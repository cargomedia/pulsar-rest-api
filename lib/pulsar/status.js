module.exports = (function() {

	var PulsarStatus = function(status) {
		this.status = status || this.STATUS_PENDING;
	}

	PulsarStatus.STATUS_PENDING = 'pending';  // todo
	PulsarStatus.STATUS_RUNNING = 'running';
	PulsarStatus.STATUS_FINISHED = 'finished';
	PulsarStatus.STATUS_CANCELLED = 'cancelled';
	PulsarStatus.STATUS_FAILED = 'failed';
	PulsarStatus.STATUS_KILLED = 'killed'; // set when the process was manually killed through the API

	PulsarStatus.prototype.get = function() {
		return this.status;
	}

	PulsarStatus.prototype.set = function(status) {
		this.status = status;
	}

	PulsarStatus.prototype.isRunning = function() {
		return this.status == STATUS_PENDING;
	}

	return PulsarStatus;

})()
