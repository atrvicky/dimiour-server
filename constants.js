export const STATUS_CODES = {
  Failed: 0,
  NoMatchFound: 100,
  Success: 200,
  SuccessAndProcessing: 201,
  InternalError: 500,
  QueryError: 400,
  Unauthorized: 401,
};

// the standart error codes returned by mongo db
export const ERROR_CODES = {
  DuplicateKey: "E1100",
};

export const DB_NAME = "dimiour";

export const SERVER_PORT = 8080;
export const SUPER_ADMIN_PASS_KEY = "dm#$Admin@123";

export const USER_ROLES = {
  SuperAdmin: "UserType.SuperAdmin",
  Admin: "UserType.Admin",
  User: "UserType.User",
};

export const NOTIFICATION_TYPE = {
  WorkBreakShort: "NotificationType.WorkBreakShort",
  WorkBreakLong: "NotificationType.WorkBreakLong",
  WorkResume: "NotificationType.WorkResume",
  WaterBreak: "NotificationType.WaterBreak",
  FoodBreak: "NotificationType.FoodBreak",
  Posture: "NotificationType.Posture",
  Quote: "NotificationType.Quote",
};

// break duration in milliseconds
export const BREAK_DURATION = {
  WaterToSBreak: 3000,
  SBreakToResume: 1000,
  ResumeToWater: 3000,
  WaterToLBreak: 3000,
  LBreakToResume: 2000,
  WaterToFood: 3000,
  FoodToResume: 4000,
};

// Change this to control the environment variables
let isDev = process.env.NODE_ENV === "dev";

// Z!C_%#hA3V23nvC
let dbUrl = isDev ? "mongodb://127.0.0.1:27017/" : "";
let serverURL = isDev
  ? "http://192.168.1.100:8080/"
  : "https://api.dimiour.io/";

export const DB_URL = dbUrl;
export const LIVE_URL = serverURL;
