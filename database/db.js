"use strict";

import mongoose from "mongoose";
import { DB_URL, DB_NAME } from "../constants.js";

const dbURL = DB_URL + DB_NAME;

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
console.info("connected to db");
