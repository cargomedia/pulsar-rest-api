var PulsarTask = require('./task');

module.exports = (function() {

	/**
     * @param {Object} plusarDb
	 * @constructor
	 */
	var Pulsar = function(pulsarDb) {
		this.pulsarDb = pulsarDb;
	}

	Pulsar.prototype.createTask = function(app, env, action) {
		var self = this;
		var taskId = this.pulsarDb.getUniqueTaskID();
		var task = new PulsarTask(taskId, app, env, action, function(task) {
			self.pulsarDb.saveTask(task);
		});
		self.pulsarDb.saveTask(task);
		return task;
	}

	Pulsar.prototype.getTask = function(taskId) {
		return this.pulsarDb.getTask(taskId);
	}

	Pulsar.prototype.getTaskList = function() {
		return this.pulsarDb.getTaskList();
	}

	return Pulsar;

})()
