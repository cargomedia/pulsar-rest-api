require('../../lib/errors');
var Pulsar = require('../../lib/pulsar/index');
var PulsarJob = require('../../lib/pulsar/job');
var PulsarDb = require('../../lib/pulsar/db');
var PulsarRest = require('../../lib/pulsar/rest');
var assert = require('chai').assert;
var jobArgs = require('../data/jobArgs');
var Config = require('../../lib/config');

var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var request = require('request');

/**
 * This test suite must be the last to execute as it performs process.exit.
 */
describe('tests of pulsar rest server', function() {

  this.timeout(2000);

  var testConfig = new Config('./test/data/configs/config.yaml').asHash();
  require('../../lib/logger').configure(testConfig);

  before(function(done) {
    var self = this;
    this.pulsarDb = new PulsarDb(testConfig.mongodb, function(err, db) {
      if (err) {
        done(err);
        return;
      }
      self.pulsar = new Pulsar(db, testConfig.pulsar);

      var app = express();
      var router = express.Router();
      app.use(bodyParser.urlencoded({extended: false}));
      app.use(bodyParser.json());
      app.use(router);
      var server = http.createServer(app);
      process.setMaxListeners(15);

      self.rest = new PulsarRest(self.pulsar);
      self.rest.installHandlers(router);
      server.listen(testConfig.port);

      done();
    });
  });

  afterEach(function(done) {
    var self = this;
    this.pulsarDb.collection.remove(function(err) {
      done(err);
    });
  });

  function createJob(job, callback) {
    request.post('http://localhost:' + testConfig.port + '/' + jobArgs.app.example + '/' + jobArgs.env.production, {
      form: {task: job}, json: true
    }, callback);
  }

  it('check controlled shutdown', function(done) {
    this.timeout(12000);

    var self = this;
    createJob(jobArgs.task.dummySleepy, function(err, response, body) {
      assert(!!body.id && !!body.url, 'Can not create a new job');
      self.pulsar.getJob(body.id, function(err, job) {
        assert(!err && job, 'Can not get a new job');

        var isShutdowned = false;
        job.on('close', function(data) {
          assert(isShutdowned, 'server must be shutdowned!');
          assert(data.job.status == PulsarJob.STATUS.FINISHED, 'created job must be finished');
          done();
        });

        self.pulsar._shutdown('SIGTERM');

        createJob(jobArgs.task.dummySleepy, function(err, response, body) {
          isShutdowned = true;
          assert(500 == response.statusCode && body.indexOf('shutting down') > 0, 'Creating of new job must be denied');
        });
      });
    });
  });


});
