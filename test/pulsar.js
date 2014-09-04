var Pulsar = require('../lib/pulsar');
var PulsarJob = require('../lib/pulsar/job');
var PulsarDb = require('../lib/pulsar/db');
var assert = require('chai').assert;
var jobArgs = require('./job-args');
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
    var app = jobArgs.app.example;
    var env = jobArgs.env.production;
    var task = jobArgs.task.dummySleepy;

    function callback(err, job) {
    }

    var self = this;
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, [], callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, {key: []}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, {key: {}}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, {'key df': ''}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, {'ke"ydf': ''}, callback);
    }, ValidationError);
    assert.throw(function() {
      self.pulsar.createJob(app, env, task, {'keydf\'': ''}, callback);
    }, ValidationError);

  });

  it('check if job is created', function(done) {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err && job.status == PulsarJob.STATUS.CREATED);
        done();
      });
  });

  it('check if job can be got after it is created', function(done) {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err);
        this.pulsar.getJob(job.id, function(err, result) {
          assert.deepEqual(result.getData(), job.getData());
          done();
        });
      }.bind(this));
  });

  it('saved job must be available after server restart', function(done) {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err);
        var pulsar = new Pulsar(this.pulsarDb, testConfig.pulsar);
        pulsar.getJob(job.id, function(err, result) {
          assert.deepEqual(result.getData(), job.getData());
          done();
        });
      }.bind(this));
  });

  it('check if created job in the list of current jobs of pulsar', function() {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err);
        this.pulsar.getJobList(function(err, jobList) {
          assert(jobList.length === 1);
          assert.deepEqual(job.getData(), jobList[0].getData());
          assert.deepEqual(job.getArgs(), jobList[0].getArgs());
        });
      }.bind(this));
  });

  it('check if created job emits change event correctly', function(done) {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err);
        job.on('change', function(data) {
          assert(data.job.id === job.id);
          done();
        });
        job.onUpdate();
      });
  });

  it('check if created job returns available tasks', function(done) {
    this.pulsar.getAvailableTasks(jobArgs.app.example, jobArgs.env.production, function(err, tasks) {
      assert(!err);
      assert(tasks['shell'], 'Shell task must be always present in available tasks');
      done();
    });
  });

  it('check if created job can be killed with SIG TERM signal', function(done) {
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummySleepy,
      function(err, job) {
        assert(!err);
        job.execute();
        job.once('change', function() {
          if (job.output) {
            job.kill();
          }
        });
        job.on('close', function() {
          assert(job.status == PulsarJob.STATUS.KILLED, 'The job kill (SIGTERM) does not work');
          done();
        });
      });
  });

  it('check if created job can be killed with SIG KILL signal', function(done) {
    //only for the sake of the test
    PulsarJob._KILL_TIMEOUT = 200;
    this.pulsar.createJob(
      jobArgs.app.example,
      jobArgs.env.production,
      jobArgs.task.dummyUnKillable,
      function(err, job) {
        assert(!err);
        job.execute();
        job.once('change', function() {
          if (job.output) {
            setTimeout(function() {
              assert(job.status == PulsarJob.STATUS.RUNNING, 'Job should still be running');
            }, PulsarJob._KILL_TIMEOUT - 1);

            setTimeout(function() {
              assert(job.status == PulsarJob.STATUS.KILLED, 'The job kill (SIGKILL) does not work');
              done();
            }, PulsarJob._KILL_TIMEOUT + 50);

            job.kill();
          }
        });
      });
  });

});
