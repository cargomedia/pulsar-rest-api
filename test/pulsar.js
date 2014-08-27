var Pulsar = require('../lib/pulsar');
var PulsarTask = require('../lib/pulsar/task');
var PulsarStatus = require('../lib/pulsar/status');
var PulsarDb = require('../lib/pulsar/db');
var assert = require('chai').assert;
var taskArgs = require('./task-args');
var Config = require('../lib/config');

describe('tests of pulsar API', function() {

  this.timeout(2000);

  var testConfig = new Config('./test/config.yaml').asHash();

  beforeEach(function(done) {
    var self = this;

    new PulsarDb(testConfig.mongodb, function(err, db) {
      if (err) {
        done(err);
        return;
      }
      self.pulsarDb = db;
      //remove all items from collection that might remain from previous tests.
      db.collection.remove(function(err) {
        self.pulsar = new Pulsar(db, testConfig.pulsar);
        done(err);
      });
    });
  });

  it('check if taskVariables are validated', function() {
    var app = taskArgs.app.example;
    var env = taskArgs.env.production;
    var action = taskArgs.action.dummySleepy;

    function callback(err, task) {
    }

    var self = this;
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, [], callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, {key: []}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, {key: {}}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, {'key df': ''}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, {'ke"ydf': ''}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createTask(app, env, action, {'keydf\'': ''}, callback);
    }, ValidationError);

  });

  it('check if task is created', function(done) {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err && task.status.is(PulsarStatus.CREATED));
        done();
      });
  });

  it('check if task can be got after it is created', function(done) {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err);
        this.pulsar.getTask(task.id, function(err, result) {
          assert.deepEqual(result.getData(), task.getData());
          done();
        });
      }.bind(this));
  });

  it('saved task must be available after server restart', function(done) {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err);
        var pulsar = new Pulsar(this.pulsarDb, testConfig.pulsar);
        pulsar.getTask(task.id, function(err, task) {
          assert.deepEqual(task.getData(), task.getData());
          done();
        });
      }.bind(this));
  });

  it('check if created task in the list of current tasks of pulsar', function() {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err);
        this.pulsar.getTaskList(function(err, taskList) {
          assert(taskList.length === 1);
          assert.deepEqual(task.getData(), taskList[0].getData());
          assert.deepEqual(task.getArgs(), taskList[0].getArgs());
        });
      }.bind(this));
  });

  it('check if created task emits change event correctly', function(done) {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err);
        task.on('change', function(data) {
          assert(data.task.id === task.id);
          done();
        });
        task.onUpdate();
      });
  });

  it('check if created task returns available cap tasks', function(done) {
    this.pulsar.getAvailableCapTasks(taskArgs.app.example, taskArgs.env.production, function(err, tasks) {
      assert(!err);
      assert(tasks['shell'], 'Shell task must be always present in available tasks');
      done();
    });
  });

  it('check if created task can be killed with SIG TERM signal', function(done) {
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummySleepy,
      function(err, task) {
        assert(!err);
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
  });

  it('check if created task can be killed with SIG KILL signal', function(done) {
    //only for the sake of the test
    PulsarTask._KILL_TIMEOUT = 200;
    this.pulsar.createTask(
      taskArgs.app.example,
      taskArgs.env.production,
      taskArgs.action.dummyUnKillable,
      function(err, task) {
        assert(!err);
        task.execute();
        task.once('change', function() {
          if (task.output) {
            setTimeout(function() {
              assert(task.status.is(PulsarStatus.RUNNING), 'Task should still be running');
            }, PulsarTask._KILL_TIMEOUT - 1);

            setTimeout(function() {
              assert(task.status.is(PulsarStatus.KILLED), 'The task kill (SIGKILL) does not work');
              done();
            }, PulsarTask._KILL_TIMEOUT + 50);

            task.kill();
          }
        });
      });
  });

});
