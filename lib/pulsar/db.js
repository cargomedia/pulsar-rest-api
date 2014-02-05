var PulsarRedisDB = require('./db/redis');
var PulsarMongoDB = require('./db/mongo');

module.exports = (function() {

	var PulsarDB = function(host, port, engine) {
		this.taskList = {};
		if (engine == 'mongo') {
			this.db = new PulsarMongoDB(host, port);
			return;
		}
		this.db = new PulsarRedisDB(host, port);
	}

	PulsarDB.prototype.getUniqueTaskID = function() {
		return this.db.getUniqueTaskID();
	}

	PulsarDB.prototype.saveTask = function(task) {
		this.taskList[task.id] = task;
	}

	PulsarDB.prototype.getTask = function(taskId) {
		if (typeof this.taskList[taskId] !== 'undefined') {
			return this.taskList[taskId];
		}
		throw Error("Task id: " + taskId + " doesn't exist.");
	}

	PulsarDB.prototype.getTaskList = function() {
		return this.taskList;
	}

	PulsarDB.prototype.connect = function() {
		this.db.connect();
	}

	return PulsarDB;

})();
