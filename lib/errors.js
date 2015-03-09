var util = require('util');

function PulsarError(message, code) {
  Error.apply(this, arguments);
  Error.captureStackTrace(this, arguments.callee);
  this.message = message;
  this.code = code;
}
util.inherits(PulsarError, Error);
global.PulsarError = PulsarError;

function ValidationError(message) {
  PulsarError.call(this, message, 400);
}
util.inherits(ValidationError, PulsarError);
global.ValidationError = ValidationError;

function AuthenticationError(message) {
  PulsarError.call(this, message, 401);
}
util.inherits(AuthenticationError, PulsarError);
global.AuthenticationError = AuthenticationError;

function AuthorizationError(message) {
  PulsarError.call(this, message, 403);
}
util.inherits(AuthorizationError, PulsarError);
global.AuthorizationError = AuthorizationError;
