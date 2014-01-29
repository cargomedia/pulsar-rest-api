var Pulsar = require('../lib/pulsar');
var PulsarDb = require('../lib/pulsar/db');

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


