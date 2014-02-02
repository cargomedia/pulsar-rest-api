var PulsarTask = require('./task');
var events = require('events');
var util = require('util');

module.exports = (function() {

	/**
     * @param {Object} db
     * @param {Object} config
	 * @constructor
	 */
	var Pulsar = function(db, config) {
		this.db = db;
        this.config = config || {};

        events.EventEmitter.call(this);
	}

    util.inherits(Pulsar, events.EventEmitter);

    Pulsar.prototype.onCreate = function(task) {
        this.emit("create", task);
    }

	Pulsar.prototype.createTask = function(app, env, action) {
        var self = this;
		var taskId = this.db.getUniqueTaskID();
		var task = new PulsarTask(taskId, app, env, action, this.config);

        this.db.saveTask(task);
        this.onCreate(task);

        task.on('change', function() {
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
