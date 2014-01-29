var PulsarStatus = require('./status');
var PulsarTask = require('./task');

module.exports = (function() {

	/**
	 * @constructor
	 */
	var Pulsar = function(pulsarDB) {
		this.pulsarDB = pulsarDB;
	}

	Pulsar.prototype.createTask = function(app, env, action) {
		var self = this;
		var taskId = this.pulsarDB.getUniqueTaskID();
		var task = new PulsarTask(taskId, app, env, action, function(task) {
			self.pulsarDB.saveTask(task);
		});
		self.pulsarDB.saveTask(task);
		return task;
	}

	Pulsar.prototype.getTask = function(taskId) {
		return this.pulsarDB.getTask(taskId);
	}

	Pulsar.prototype.getTaskList = function() {
		return this.pulsarDB.getTaskList();
	}

	return Pulsar;

})()
