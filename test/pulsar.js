var Pulsar = require('../lib/pulsar');
var PulsarTask = require('../lib/pulsar/task');
var PulsarStatus = require('../lib/pulsar/status');
var events = require('events');
var _ = require('underscore');

var PulsarDbMock = function() {

  this.taskList = [];

  this.getUniqueTaskID = function() {
    return (++this.taskList.length).toString();
  };

  this.saveTask = function(task) {
    this.taskList[task.id] = {id: task.id, data: task.getData()};
  };

  this.updateTask = function(task) {
    this.taskList[task.id] = {id: task.id, data: task.getData()};
  };

  this.getTask = function(taskId, callback) {
    if (typeof this.taskList[taskId] != 'undefined') {
      callback(null, this.taskList[taskId]);
      return;
    }
    callback(Error("Task id: " + taskId + " doesn't exist."), null);
  };

  this.getTaskList = function() {
    var list = _.map(_.values(this.taskList), function(row) {
      return row.data;
    });
    return list;
  };
};

function createDummyTask(pulsar) {
  return pulsar.createTask('foo', 'development', 'deploy');
}

exports.setUp = function(callback) {
  var pulsarDb = new PulsarDbMock();
  this.pulsar = new Pulsar(pulsarDb);
  this.task = createDummyTask(this.pulsar);

  callback()
};

exports.testCreateTask = function(test) {
  test.ok(this.task.id !== null && this.task.status.is(PulsarStatus.CREATED), "Check if task is created");
  test.done();
};

exports.testGetTask = function(test) {
  var task = this.task;
  this.pulsar.getTask(task.id, function(err, result) {
    test.same(task.getData(), result.getData());
    test.done();
  }.bind(this));
};

exports.testGetTaskList = function(test) {
  var expectedList = [this.task.getData()];
  test.same(expectedList, this.pulsar.getTaskList());
  test.done();
};

exports.testTaskEvents = function(test) {
  var task = this.task;
  task.on('change', function(data) {
    test.equal(data.task.id, task.id);
  });
  task.onUpdate();
  test.expect(1);
  test.done();
};

exports.testTaskKill = function(test) {
  var task = this.task;
  task.execute();
  task.kill();

  setTimeout(function() {
      if (!task.status.is(PulsarStatus.KILLED)) {
        test.ok(false, 'The task kill does not work')
      }
      test.done();
    }, PulsarTask._FATALITY_INTERVAL * PulsarTask._FATALITY_COUNTER + 1);

};
