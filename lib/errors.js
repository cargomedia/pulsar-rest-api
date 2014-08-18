var restify = require('restify');
var util = require('util');

function ValidationError(message) {
  restify.RestError.call(this, {
    restCode: 'ValidationError',
    statusCode: 418,
    message: message,
    constructorOpt: ValidationError
  });
  this.name = 'ValidationError';
}

util.inherits(ValidationError, restify.RestError);
global.ValidationError = ValidationError;
