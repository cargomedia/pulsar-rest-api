module.exports = (function () {

  var PulsarStatus = function (status) {
    this.status = status || PulsarStatus.STATUS_CREATED;
  };

  PulsarStatus.STATUS_CREATED = 'CREATED';
  PulsarStatus.STATUS_RUNNING = 'RUNNING';
  PulsarStatus.STATUS_FINISHED = 'FINISHED';
  PulsarStatus.STATUS_FAILED = 'FAILED';
  PulsarStatus.STATUS_KILLED = 'KILLED';

  PulsarStatus.prototype.get = function () {
    return this.status;
  };

  PulsarStatus.prototype.set = function (status) {
    this.status = status;
  };

  PulsarStatus.prototype.isRunning = function () {
    return this.status === PulsarStatus.STATUS_RUNNING;
  };

  return PulsarStatus;

})();
