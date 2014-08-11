var Pulsar = require('../lib/pulsar');
var PulsarTask = require('../lib/pulsar/task');
var PulsarStatus = require('../lib/pulsar/status');
var _ = require('underscore');
var assert = require('chai').assert;
var taskArgs = require('./task-args');

var PulsarDbMock = function() {

  this.taskList = [];

  this.getUniqueTaskID = function() {
    return (++this.taskList.length).toString();
  };

  this.saveTask = function(task) {
    this.taskList[task.id] = {id: task.id, data: task.getData(), args: task.getArgs()};
  };

  this.updateTask = function(task) {
    this.taskList[task.id] = {id: task.id, data: task.getData(), args: task.getArgs()};
  };

  this.getTask = function(taskId, callback) {
    if (typeof this.taskList[taskId] != 'undefined') {
      var task = this.taskList[taskId];
      callback(null, new PulsarTask(task.args, task.data));
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

describe('tests of pulsar API', function() {

  this.timeout(2000);

  beforeEach(function() {
    this.pulsarDb = new PulsarDbMock();
    this.pulsar = new Pulsar(this.pulsarDb, {'repo': 'test/data/pulsar-conf-dummy/'});
  });


  it('check if task is created', function() {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });
    assert(task.status.is(PulsarStatus.CREATED));
  });

  it('check if task can be got after it is created', function(done) {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });
    this.pulsar.getTask(task.id, function(err, result) {
      assert.deepEqual(result.getData(), task.getData());
      done();
    });
  });

  it('saved task must be available after server restart', function(done) {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });

    var pulsar = new Pulsar(this.pulsarDb, {'repo': 'test/data/pulsar-conf-dummy/'});
    pulsar.getTask(task.id, function(err, task) {
      assert.deepEqual(task.getData(), task.getData());
      done();
    });
  });

  it('check if created task in the list of current tasks of pulsar', function() {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });
    var expectedList = [task.getData()];
    assert.deepEqual(expectedList, this.pulsar.getTaskList());
  });

  it('check if created task emits change event correctly', function(done) {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });
    task.on('change', function(data) {
      assert(data.task.id === task.id);
      done();
    });
    task.onUpdate();
  });

  it('check if created task returns available cap tasks', function(done) {
    this.pulsar.getAvailableTasks(taskArgs.app.example, taskArgs.env.production, function(tasks) {
      assert(tasks['shell'], 'Shell task must be always present in available tasks');
      done();
    });
  });

  it('check if created task can be killed with SIG TERM signal', function(done) {
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummySleepy
    });
    task.execute();
    task.once('change', function() {
      if (task.output) {
        task.kill();
      }
    });
    task.on('close', function() {
      assert(task.status.is(PulsarStatus.KILLED), 'The task kill (SIGTERM) does not work');
      done();
    });
  });

  it('check if created task can be killed with SIG KILL signal', function(done) {
    //only for the sake of the test
    PulsarTask._KILL_TIMEOUT = 200;
    var task = this.pulsar.createTask({
      app: taskArgs.app.example,
      env: taskArgs.env.production,
      action: taskArgs.action.dummyUnKillable
    });
    task.execute();
    task.once('change', function() {
      if (task.output) {
        task.kill();
      }
      setTimeout(function() {
        assert(task.status.is(PulsarStatus.RUNNING), 'Task should still be running');
      }, PulsarTask._KILL_TIMEOUT - 1);

      setTimeout(function() {
        assert(task.status.is(PulsarStatus.KILLED), 'The task kill (SIGKILL) does not work');
        done();
      }, PulsarTask._KILL_TIMEOUT + 50);

    });
  });

});
