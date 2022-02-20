"use strict";

import mongoose from "mongoose";
import { USER_ROLES } from "../constants.js";

let userSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  deletedAt: Date,
  password: { type: String, required: "Password Required" },
  email: { type: String, unique: true, required: "Email Required" },
  nickname: { type: String, default: "" },
  accessToken: { type: String, unique: false, default: "" },
  workStartHour: { type: Number, default: 9 },
  workEndHour: { type: Number, default: 17 },
  workStartMinute: { type: Number, default: 0 },
  workEndMinute: { type: Number, default: 0 },
  workDays: {
    type: String,
    default: "0111110",
  },
  workInfoSetup: { type: Boolean, default: false },
  userType: {
    type: String,
    enum: [USER_ROLES.SuperAdmin, USER_ROLES.Admin, USER_ROLES.User],
    required: "User Type required",
  },
  fcmID: { type: String, default: "" },
  deviceID: { type: String, default: "" },
});

export const UserModel = mongoose.model("Users", userSchema);
