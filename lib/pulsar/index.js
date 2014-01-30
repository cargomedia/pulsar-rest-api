var PulsarTask = require('./task');

module.exports = (function() {

	/**
     * @param {Object} plusarDb
	 * @constructor
	 */
	var Pulsar = function(db, config) {
		this.db = db;
        this.config = config || {};
	}

	Pulsar.prototype.createTask = function(app, env, action) {
        var self = this;
		var taskId = this.db.getUniqueTaskID();
		var task = new PulsarTask(taskId, app, env, action, this.config);

        this.db.saveTask(task);

        task.on('taskChanged', function() {
            self.db.saveTask(task);
        });

		return task;
	}

	Pulsar.prototype.getTask = function(taskId) {
		return this.db.getTask(taskId);
	}

	Pulsar.prototype.getTaskList = function() {
		return this.db.getTaskList();
	}

	return Pulsar;

})()
