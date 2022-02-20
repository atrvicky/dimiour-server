"use strict";

import mongoose from "mongoose";
import { NOTIFICATION_TYPE } from "../constants.js";

let schema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  deletedAt: Date,
  userID: {
    type: mongoose.Types.ObjectId,
    required: "User ID Required",
    ref: "Users",
  },
  notificationType: {
    type: String,
    enum: [
      NOTIFICATION_TYPE.WorkBreakShort,
      NOTIFICATION_TYPE.WorkBreakLong,
      NOTIFICATION_TYPE.WorkResume,
      NOTIFICATION_TYPE.WaterBreak,
      NOTIFICATION_TYPE.FoodBreak,
      NOTIFICATION_TYPE.Posture,
      NOTIFICATION_TYPE.Quote,
    ],
    required: "Notification Type required",
  },
  ack: { type: Boolean, default: false },
  responded: { type: Boolean, default: false },
});

export const NotificationModel = mongoose.model("Notifications", schema);
