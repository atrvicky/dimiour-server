"use strict";

import express from "express";
import jwt from "jsonwebtoken";
import * as constants from "../constants.js";
import * as userController from "../controllers/userController.js";
import * as notificationController from "../controllers/notificationController.js";
import { UserModel } from "../models/userModel.js";
import { standardResponse } from "../helpers/helper.js";

const ROLES = constants.USER_ROLES;
const CODES = constants.STATUS_CODES;

const router = express.Router();

// function to authenticate the user
let authenticateAuthToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({
        status: CODES.Unauthorized,
        msg: "Invalid token received",
        data: null,
      });
    let user = await UserModel.findOne({ accessToken: token }).exec();

    if (!user || !user._id)
      return res
        .status(400)
        .json(
          standardResponse(CODES.Unauthorized, "Cannot authenticate!", null)
        );

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, r) => {
      if (err != null)
        return res
          .status(401)
          .json(
            standardResponse(CODES.Unauthorized, "Cannot verify user!", null)
          );

      if (r === null)
        return res
          .status(401)
          .json(
            standardResponse(CODES.Unauthorized, "Cannot authenticate", null)
          );

      req.user = user;
      next();
    });
  } catch (e) {
    return res
      .status(500)
      .json(
        standardResponse(
          CODES.InternalError,
          "Error authenticating " + e.toString(),
          null
        )
      );
  }
};

let checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res
        .status(401)
        .json(
          standardResponse(
            CODES.Unauthorized,
            "You are not authorized to perform this action.",
            null
          )
        );
    }
    next();
  };
};

router.use(express.json({ limit: "50mb" }));
router.use(express.urlencoded({ extended: true, limit: "50mb" }));

router.put(
  "/users/updateFCMID",
  authenticateAuthToken,
  checkRole([ROLES.SuperAdmin, ROLES.User]),
  userController.updateFCMID
);

router.get(
  "/users/timeline/getAll",
  authenticateAuthToken,
  checkRole([ROLES.SuperAdmin, ROLES.User]),
  notificationController.getUserTimeline
);

// general user action
router.post("/users/auth/login", userController.login);
router.post("/users/auth/renewToken", userController.renewAuthToken);
router.delete("/users/auth/logout", userController.logOut);

export default router;
