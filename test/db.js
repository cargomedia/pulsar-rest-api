var _ = require('underscore');
var PulsarDb = require('../lib/pulsar/db');
var PulsarTask = require('../lib/pulsar/task');

function createDummyTask(id) {
	return new PulsarTask(id, 'foo', 'development', 'deply');
}

exports.testSaveTask = function(test) {
	var pulsarDb = new PulsarDb();
	var task = createDummyTask(1);
	pulsarDb.saveTask(task);

	var fetchedTask = pulsarDb.getTask(task.id);
	test.equal(fetchedTask, task);
	test.done();
};

exports.testGetTaskList = function(test) {
	var pulsarDb = new PulsarDb();
	var task1 = createDummyTask(1);
	var task2 = createDummyTask(2);
	pulsarDb.saveTask(task1);
	pulsarDb.saveTask(task2);

	var fetchedTaskList = pulsarDb.getTaskList();
	test.equal(2, _.size(fetchedTaskList));
	test.done();
};


