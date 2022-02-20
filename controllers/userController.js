"use strict";

import { UserModel } from "../models/userModel.js";
import {
  SUPER_ADMIN_PASS_KEY,
  STATUS_CODES,
  USER_ROLES,
} from "../constants.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";
import { standardResponse } from "../helpers/helper.js";
import * as notificationController from "./notificationController.js";

// create a super admin
(() => {
  let userID = "mk@testmail.com";
  console.log(`looking up username: ${userID}`);
  UserModel.findOne({ email: userID }, async (e, r) => {
    if (e) {
      // some error
      console.log(`Error searching user: ${e.toString()}`);
      return;
    }
    if (r == null) {
      // result found no user
      console.log("no super admin found.");
      let hashedPassword = await hashPassword(SUPER_ADMIN_PASS_KEY);
      const accessToken = generateAccessToken(hashedPassword);

      if (hashedPassword == "error!") {
        console.log(`cannot create hash`);
        return;
      }

      let superAdmin = {
        nickname: "Super Admin",
        accessToken: accessToken,
        password: hashedPassword,
        email: "mk@testmail.com",
        userType: USER_ROLES.SuperAdmin,
      };
      UserModel.create(superAdmin, (err, res) => {
        // check for duplicate entry
        if (err != null && err.message.indexOf("duplicate key error") !== -1) {
          console.error(`Super Admin already created: ${e.toString()}`);
          return;
        }
        if (err) {
          // some other error
          console.error(`Could not create superAdmin: ${err.toString()}`);
          return;
        }
        // created successfully
        console.log(`Super Admin created successfully: ${res.toString()}`);
      });
      return;
    }
    console.log(`Super Admin matched accounts: ${r.toString()}`);
  });
})();

// auth related functions
export async function login(req, res) {
  let { userID: email, password, fcmID } = req.body;

  if (!email || !validator.isEmail(email) || !password || password.length < 4)
    return res
      .status(400)
      .json(
        standardResponse(
          STATUS_CODES.QueryError,
          "Invalid credentials entered",
          null
        )
      );

  try {
    let user = await UserModel.findOne({ email: email }).exec();

    if (!user || !user._id)
      return res
        .status(401)
        .json(
          standardResponse(STATUS_CODES.Unauthorized, "User Not found", null)
        );

    if (!(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json(
          standardResponse(STATUS_CODES.Unauthorized, "Invalid password", null)
        );

    const accessToken = generateAccessToken(user.password);

    user.updatedAt = Date.now();
    user.accessToken = accessToken;
    user.fcmID = fcmID;

    await user.save();
    notificationController.addUserToQueue(user._id.toString());

    return res
      .status(200)
      .json(standardResponse(STATUS_CODES.Success, "OK", user));
  } catch (e) {
    return res
      .status(500)
      .json(
        standardResponse(
          STATUS_CODES.InternalError,
          "Something went wrong. Error Logging In." + e.toString(),
          null
        )
      );
  }
}

export async function updateFCMID(req, res) {
  let { fcmID, userID } = req.body;

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
    await UserModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userID) },
      { $set: { fcmID: fcmID } }
    ).exec();

    return res
      .status(200)
      .json(standardResponse(STATUS_CODES.Success, "OK", true));
  } catch (e) {
    return res
      .status(500)
      .json(
        standardResponse(
          STATUS_CODES.InternalError,
          "Something went wrong. Error updating fcmID." + e.toString(),
          false
        )
      );
  }
}

export async function updateWorkInfo(req, res) {
  let { workDays, workStartTime, workEndTime, userID } = req.body;

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

  if (!workDays || workDays.length == 0)
    return res
      .status(400)
      .json(
        standardResponse(
          STATUS_CODES.QueryError,
          "Invalid workDays received",
          false
        )
      );

  if (!workStartTime || workStartTime.length == 0)
    return res
      .status(400)
      .json(
        standardResponse(
          STATUS_CODES.QueryError,
          "Invalid work start time received",
          false
        )
      );

  if (!workEndTime || workEndTime.length == 0)
    return res
      .status(400)
      .json(
        standardResponse(
          STATUS_CODES.QueryError,
          "Invalid work end time received",
          false
        )
      );

  try {
    await UserModel.findOneAndUpdate(
      { _id: new mongoose.Types.Objectid(userID) },
      {
        $set: {
          workDays: workDays,
          workStartTime: workStartTime,
          workEndTime: workEndTime,
        },
      }
    ).exec();

    return res
      .status(200)
      .json(standardResponse(STATUS_CODES.Success, "OK", true));
  } catch (e) {
    return res
      .status(500)
      .json(
        standardResponse(
          STATUS_CODES.InternalError,
          "Something went wrong. Error updating Work Schedule." + e.toString(),
          false
        )
      );
  }
}

let generateAccessToken = (data) => {
  return jwt.sign({ data }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

let hashPassword = async (pass) => {
  try {
    return await bcrypt.hash(pass, 10);
  } catch (e) {
    return `error!`;
  }
};

export async function renewAuthToken(req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken == null) {
    return res.status(401).json({
      status: STATUS_CODES.Unauthorized,
      msg: "Invalid refresh token received",
      data: null,
    });
  }

  UserModel.findOne({ refreshToken: refreshToken }, (err, resp) => {
    if (err != null) {
      return res.status(401).json({
        status: STATUS_CODES.Unauthorized,
        msg: "No matching refresh token found!",
        data: null,
      });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (e, user) => {
      if (e != null) {
        return res.status(401).json({
          status: STATUS_CODES.Unauthorized,
          msg: "Refresh token invalid",
          data: null,
        });
      }
      const accessToken = generateAccessToken(user);
      UserModel.updateOne(
        { password: user },
        {
          updatedAt: Date.now(),
          accessToken: accessToken,
        },
        (error, response) => {
          if (error != null) {
            return res.status(403).json({
              status: STATUS_CODES.NoMatchFound,
              msg: "Unable to register new token!",
              data: null,
            });
          }
          return res.status(200).json({
            status: STATUS_CODES.Success,
            msg: "OK",
            data: { accessToken: accessToken },
          });
        }
      );
    });
  });
}

export async function logOut(req, res) {
  UserModel.updateOne(
    { accessToken: req.body.accessToken },
    {
      updatedAt: Date.now(),
      refreshToken: "",
      accessToken: "",
      fcmID: "",
    },
    (error, response) => {
      if (error != null) {
        return res.status(403).json({
          status: STATUS_CODES.NoMatchFound,
          msg: "Unable to find user!",
          data: null,
        });
      }
      return res.status(200).json({
        status: STATUS_CODES.Success,
        msg: "OK",
        data: null,
      });
    }
  );
}
