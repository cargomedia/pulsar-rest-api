module.exports = (function() {

	var PulsarDB = function() {
		this.taskList = {};
	}

	PulsarDB.prototype.getUniqueTaskID = function() {
		return Math.round(100 * Math.random());
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

	return PulsarDB;

})();
