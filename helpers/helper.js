"stn strict";

export function isNumeric(str) {
  if (typeof str != "string") return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ..
}

export function stringFormattedNumber(v) {
  if (v < 10) {
    return `0000${v}`;
  } else if (v < 100) {
    return `000${v}`;
  } else if (v < 1000) {
    return `00${v}`;
  } else if (v < 10000) {
    return `0${v}`;
  } else {
    return `${v}`;
  }
}

export function standardResponse(statusCode, msg, data) {
  return {
    status: statusCode,
    msg: msg,
    data: data,
  };
}

export function sanitizeInput(str) {
  str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
  return str.trim();
}