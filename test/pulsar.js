var Pulsar = require('../lib/pulsar');
var PulsarTask = require('../lib/pulsar/task');
var PulsarStatus = require('../lib/pulsar/status');
var _ = require('underscore');
var assert = require('chai').assert;

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

var DEFAULT_TASK_ARGS = {app: 'example', env: 'production', action: 'dummy:my_sleep'};

function defaultBeforeEach() {
  this.pulsarDb = new PulsarDbMock();
  this.pulsar = new Pulsar(this.pulsarDb, {'repo': 'test/data/pulsar-conf-dummy/'});
}

describe('tests that don\'t execute pulsar command', function() {

  this.timeout(300);

  beforeEach(function() {
    defaultBeforeEach.call(this);
  });


  it('check if task is created', function() {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
    assert(task.status.is(PulsarStatus.CREATED));
  });

  it('check if task can be got after it is created', function(done) {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
    this.pulsar.getTask(task.id, function(err, result) {
      assert.deepEqual(result.getData(), task.getData());
      done();
    });
  });

  it('check if created task in the list of current tasks of pulsar', function() {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
    var expectedList = [task.getData()];
    assert.deepEqual(expectedList, this.pulsar.getTaskList());
  });

  it('check if created task emits change event correctly', function(done) {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
    task.on('change', function(data) {
      assert(data.task.id === task.id);
      done();
    });
    task.onUpdate();
  });

});

describe('tests that execute pulsar command', function() {

  this.timeout(2000);

  beforeEach(function() {
    defaultBeforeEach.call(this);
  });

  it('check if created task returns available cap tasks', function(done) {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
    this.pulsar.getAvailableTasks(DEFAULT_TASK_ARGS.app, DEFAULT_TASK_ARGS.env, function(tasks) {
      assert(tasks['shell'], 'Shell task must be always present in available tasks');
      done();
    });
  });

  it('check if created task can be killed with SIG TERM signal', function(done) {
    var task = this.pulsar.createTask(DEFAULT_TASK_ARGS);
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
    var task = this.pulsar.createTask({app: DEFAULT_TASK_ARGS.app, env: DEFAULT_TASK_ARGS.env, action: 'dummy:my_sleep_unkillable'});
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
