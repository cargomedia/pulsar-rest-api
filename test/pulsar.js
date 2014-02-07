var Pulsar = require('../lib/pulsar');
var events = require('events');
var _ = require('underscore');

var PulsarDbMock = function () {

    this.taskList = [];

    this.getUniqueTaskID = function () {
        return (++this.taskList.length).toString();
    }

    this.saveTask = function (task) {
        this.taskList[task.id] = {id: task.id, data: task.getData()};
    }

    this.updateTask = function (task) {
        this.taskList[task.id] = {id: task.id, data: task.getData()};
    }

    this.getTask = function (taskId, callback) {
        if (typeof this.taskList[taskId] != 'undefined') {
            callback(null, this.taskList[taskId]);
            return;
        }
        callback(Error("Task id: " + taskId + " doesn't exist."), null);
    }

    this.getTaskList = function () {
        var list = _.map(_.values(this.taskList), function(row) {
            return row.data;
        });
        return list;
    }
}

function createDummyTask(pulsar) {
    return pulsar.createTask('foo', 'development', 'deploy');
}

exports.testCreateTask = function (test) {
    var pulsarDb = new PulsarDbMock();
    var pulsar = new Pulsar(pulsarDb);
    var task = createDummyTask(pulsar);

    test.ok(task.id !== null, "Check if task id is created");
    test.done();
};

exports.testGetTask = function (test) {
    var pulsarDb = new PulsarDbMock();
    var pulsar = new Pulsar(pulsarDb)
    var task = createDummyTask(pulsar);

    pulsar.getTask(task.id, function (err, result) {
        test.same(task.getData(), result.getData());
        test.done();
    });
};

exports.testGetTaskList = function(test){
	var pulsarDb = new PulsarDbMock();
	var pulsar = new Pulsar(pulsarDb)
	var task = createDummyTask(pulsar);

	var expectedList = [task.getData()];

	test.same(expectedList, pulsar.getTaskList());
	test.done();
};

exports.testTaskEvents = function(test) {
	var pulsarDb = new PulsarDbMock();
	var pulsar = new Pulsar(pulsarDb)
	var task = createDummyTask(pulsar);

	task.on('change', function(data) { test.equal(data.task.id, task.id); });
	task.onUpdate();
	test.expect(1);
	test.done();
}
