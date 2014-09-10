var util = require('util');

function ValidationError(message) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message;
  this.statusCode = 400;
}

util.inherits(ValidationError, Error);
global.ValidationError = ValidationError;
