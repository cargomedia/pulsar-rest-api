var Pulsar = require('../lib/pulsar');
var PulsarDb = require('../lib/pulsar/db');
var events = require('events');

function createDummyTask(pulsar) {
	return pulsar.createTask('foo', 'development', 'deploy');
}

exports.testCreateTask = function(test) {
	var pulsarDbMock = new PulsarDb();
	var pulsar = new Pulsar(pulsarDbMock);
	var task = createDummyTask(pulsar);

	test.ok(task.id !== null, "Check if task id is created");
	test.done();
};

exports.testGetTask = function(test){
	var pulsarDbMock = new PulsarDb();
	var pulsar = new Pulsar(pulsarDbMock)
	var task = createDummyTask(pulsar);

	test.equal(task, pulsar.getTask(task.id));
	test.done();
};

exports.testGetTaskList = function(test){
	var pulsarDbMock = new PulsarDb();
	var pulsar = new Pulsar(pulsarDbMock)
	var task = createDummyTask(pulsar);

	var expectedList = {};
	expectedList[task.id] = task;

	test.same(expectedList, pulsar.getTaskList());
	test.done();
};

exports.testTaskEvents = function(test) {
	var pulsarDbMock = new PulsarDb();
	var pulsar = new Pulsar(pulsarDbMock)
	var task = createDummyTask(pulsar);

	task.on('taskChanged', function(data) { test.equal(data.task.id, task.id); });
	task.onUpdate();
	test.expect(1);
	test.done();
}
