"use strict";

import { initializeApp } from "firebase-admin/app";
import admin from "firebase-admin";
import validator from "validator";
import mongoose from "mongoose";
import { getMessaging } from "firebase-admin/messaging";
import { payload } from "../secret/serviceAcc.js";
import {
  BREAK_DURATION,
  NOTIFICATION_TYPE,
  STATUS_CODES,
} from "../constants.js";
import { NotificationModel } from "../models/notificationModel.js";
import { standardResponse } from "../helpers/helper.js";
import { UserModel } from "../models/userModel.js";
import Queue from "bull";

const messageQueue = new Queue("sendNotification", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

(() => {
  initializeApp({
    credential: admin.credential.cert(payload),
  });

  messageQueue.process(async (job) => {
    return sendTimedNotification(job.data.userID, job.data.notificationType);
  });
})();

export async function addUserToQueue(userID, notificationType, delayTime) {
  if (!userID || !validator.isMongoId(userID)) return;

  if (!delayTime) delayTime = BREAK_DURATION.ResumeToWater;
  if (!notificationType) notificationType = NOTIFICATION_TYPE.Quote;

  messageQueue.add(
    { userID, notificationType },
    { delay: delayTime, attempts: 1 }
  );
}

let sendTimedNotification = async (userID, notificationType) => {
  if (!userID || !validator.isMongoId(userID)) return;

  const recentNotification = await NotificationModel.findOne({
    userID: new mongoose.Types.ObjectId(userID),
  })
    .sort({ createdAt: -1 })
    .exec();
  const user = await UserModel.findById(userID).exec();
  if (!recentNotification) {
    sendNotification(
      user._id.toString(),
      user.fcmID,
      NOTIFICATION_TYPE.Quote,
      ""
    );
    return true;
  }

  sendNotification(user._id.toString(), user.fcmID, notificationType, "");

  return true;
};

let sendNotification = async (userID, fcmID, notificationType, body) => {
  try {
    const newNotification = new NotificationModel({
      userID: new mongoose.Types.ObjectId(userID),
      notificationType,
      ack: false,
    });

    await newNotification.save();
    const message = {
      data: {
        notificationID: newNotification._id.toString(),
        type: notificationType,
        body: body,
      },
      token: fcmID,
    };

    getMessaging()
      .send(message)
      .then(async (response) => {
        // Response is a message ID string.
        const nextNotification = await getNextNotification(
          userID,
          notificationType
        );
        addUserToQueue(userID, nextNotification.type, nextNotification.delay);
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  } catch (e) {
    console.log(`Cannot send notification ${e.toString()}`);
  }
};

let getNextNotification = async (userID, recentNotificationType) => {
  let next = {
    type: NOTIFICATION_TYPE.Quote,
    delay: BREAK_DURATION.WaterToSBreak,
  };
  if (recentNotificationType == NOTIFICATION_TYPE.WaterBreak) {
    const notificationHistory = await NotificationModel.find({
      userID: new mongoose.Types.ObjectId(userID),
    })
      .sort({ _id: -1 })
      .limit(3)
      .exec();

    if (notificationHistory.length < 2) {
      next.delay = BREAK_DURATION.WaterToSBreak;
      next.type = NOTIFICATION_TYPE.Quote;
    } else {
      next.delay = BREAK_DURATION.WaterToSBreak;
      next.type = NOTIFICATION_TYPE.WorkBreakShort;
      if (
        notificationHistory[2].notificationType ==
        NOTIFICATION_TYPE.WorkBreakShort
      ) {
        next.delay = BREAK_DURATION.WaterToLBreak;
        next.type = NOTIFICATION_TYPE.WorkBreakLong;
      } else if (
        notificationHistory[2].notificationType ==
        NOTIFICATION_TYPE.WorkBreakLong
      ) {
        next.delay = BREAK_DURATION.WaterToSBreak;
        next.type = NOTIFICATION_TYPE.WorkBreakShort;
      }
    }
  } else if (recentNotificationType == NOTIFICATION_TYPE.WorkBreakShort) {
    next.delay = BREAK_DURATION.SBreakToResume;
    next.type = NOTIFICATION_TYPE.WorkResume;
  } else if (recentNotificationType == NOTIFICATION_TYPE.WorkBreakLong) {
    next.delay = BREAK_DURATION.LBreakToResume;
    next.type = NOTIFICATION_TYPE.WorkResume;
  } else if (
    [NOTIFICATION_TYPE.WorkResume, NOTIFICATION_TYPE.Quote].indexOf(
      recentNotificationType
    ) != -1
  ) {
    next.delay = BREAK_DURATION.ResumeToWater;
    next.type = NOTIFICATION_TYPE.WaterBreak;
  }
  return next;
};

export async function getUserTimeline(req, res) {
  let { userID } = req.query;
  if (!userID || !validator.isMongoId(userID))
    return res
      .status(400)
      .json(
        standardResponse(
          STATUS_CODES.QueryError,
          "Invalid userID received",
          false
        )
      );
  try {
    const timelineEntries = await NotificationModel.find({
      userID: new mongoose.Types.ObjectId(userID),
    })
      .select({
        createdAt: 1,
        _id: 1,
        notificationType: 1,
        ack: 1,
        responded: 1,
      })
      .exec();

    return res.status(200).json(
      standardResponse(STATUS_CODES.Success, "OK", {
        entries: timelineEntries,
      })
    );
  } catch (e) {
    return res
      .status(500)
      .json(
        standardResponse(
          STATUS_CODES.InternalError,
          "Something went wrong. Error fetching timeline data" + e.toString(),
          false
        )
      );
  }
}
