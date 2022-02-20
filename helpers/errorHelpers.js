"use strict";

import { ERROR_CODES } from '../constants.js';

/**
 * Takes in a stringified version of the standard mongoose error and
 * returns a user-friendly error output
 *
 * @param {String} stdErr The standard mongoose error
 * @returns String
 */
export function getUserErrors(stdErr) {
  console.error(stdErr);
  if (stdErr.indexOf(`${ERROR_CODES.DuplicateKey} duplicate key error`) > -1) {
    if (stdErr.indexOf("email") > -1) return "Email address already used";
  }
  return stdErr;
}