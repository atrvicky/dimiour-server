/**
 * Handles the validation of the user-fed data
 * Uses the https://www.npmjs.com/package/validatorjs package
 */
const Validator = require("validatorjs");
const validator = (body, rules, customMessages, callback) => {
  const validation = new Validator(body, rules, customMessages);
  validation.passes(() => callback(null, true));
  validation.fails(() => callback(validation.errors, false));
};

module.exports = validator;
