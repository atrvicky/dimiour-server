"use strict";

import cors from "cors";
import { SERVER_PORT } from "./constants.js";
import express from "express";
import * as database from "./database/db.js";
const app = express();
import router from "./routes/routes.js";

app.use(cors({ origin: "*" }));
app.use("/api", router);
app.get("/", (req, res) => {
  console.info(`incoming @ ${new Date()}`);
  res.status(404).end(`Hello, world @ ${new Date()}!`);
});

app.listen(SERVER_PORT, () => {
  console.info(`${process.env.NODE_ENV} server online in port: ${SERVER_PORT}`);
});
