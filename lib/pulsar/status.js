module.exports = (function() {

  _ = require('underscore');

  var PulsarStatus = function(status) {
    if (status) {
      this.set(status);
    }
  };

  PulsarStatus.CREATED = 'CREATED';
  PulsarStatus.RUNNING = 'RUNNING';
  PulsarStatus.FINISHED = 'FINISHED';
  PulsarStatus.FAILED = 'FAILED';
  PulsarStatus.KILLED = 'KILLED';

  var values = [];
  for (var key in PulsarStatus) {
    if (PulsarStatus.hasOwnProperty(key) && _.isString(PulsarStatus[key])) {
      values.push(PulsarStatus[key]);
    }
  }

  PulsarStatus.values = function() {
    return values;
  };

  PulsarStatus.isValid = function(status) {
    return values.indexOf(status) !== -1;
  };

  PulsarStatus.prototype.is = function(status) {
    return this.value === status;
  };

  PulsarStatus.prototype.get = function() {
    return this.value;
  };

  PulsarStatus.prototype.set = function(value) {
    if (PulsarStatus.isValid(value)) {
      this.value = value;
    } else {
      throw new Error('Invalid PulsarStatus: ' + value + ' . Valid statuses are: ' + values);
    }
  };

  return PulsarStatus;

})();
