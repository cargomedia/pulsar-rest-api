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

exports.setUp = function(callback) {
  this.pulsarDb = new PulsarDbMock();
  this.pulsar = new Pulsar(this.pulsarDb,  {'repo': 'test/data/pulsar-conf-dummy/'});
  this.task = this.pulsar.createTask('example', 'production', 'dummy:my_sleep');

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

exports.testTaskKillSigTerm = function (test) {
  var task = this.task;
  task.execute();

  task.once('change', function() {
    if (task.output) {
      task.kill();

      setTimeout(function() {
        if(!task.status.is(PulsarStatus.KILLED)){
          test.ok(false, 'The task kill (SIGTERM) does not work')
        }
        test.done();
      }, 50);
    }
  });
};

exports.testTaskKillSigKill = function (test) {
  var task = this.pulsar.createTask('example', 'production', 'dummy:my_sleep_unkillable');
  task.execute();

  task.once('change', function() {
    if (task.output) {
      task.kill();

      setTimeout(function() {
        if(!task.status.is(PulsarStatus.RUNNING)){
          test.ok(false, 'Task should still be running')
        }
      }, 50);

      setTimeout(function() {
        if(!task.status.is(PulsarStatus.KILLED)){
          test.ok(false, 'The task kill (SIGKILL) does not work')
        }
        test.done();
      }, PulsarTask._KILL_TIMEOUT + 50);
    }
  });
};
