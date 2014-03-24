var _ = require('underscore');
var PulsarTask = require('../lib/pulsar/task');

var PulsarDbMock = function () {

  this.taskList = {};

  this.getUniqueTaskID = function () {
    return (++this.taskList.length).toString();
  };

  this.saveTask = function (task) {
    this.taskList[task.id] = task;
  };

  this.getTask = function (taskId) {
    if (typeof this.taskList[taskId] !== 'undefined') {
      return this.taskList[taskId];
    }
    throw Error("Task id: " + taskId + " doesn't exist.");
  };

  this.getTaskList = function () {
    return this.taskList;
  }
};

function createDummyTask(id) {
  return new PulsarTask({id: id, app: 'foo', env: 'development', action: 'deploy'});
}

exports.testSaveTask = function (test) {
  var pulsarDb = new PulsarDbMock();
  var task = createDummyTask(1);
  pulsarDb.saveTask(task);

  var fetchedTask = pulsarDb.getTask(task.id);
  test.equal(fetchedTask, task);
  test.done();
};

exports.testGetTaskList = function (test) {
  var pulsarDb = new PulsarDbMock();
  var task1 = createDummyTask(1);
  var task2 = createDummyTask(2);
  pulsarDb.saveTask(task1);
  pulsarDb.saveTask(task2);

  var fetchedTaskList = pulsarDb.getTaskList();
  test.equal(2, _.size(fetchedTaskList));
  test.done();
};


