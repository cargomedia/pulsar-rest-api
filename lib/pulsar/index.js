var PulsarExec = require('./exec');
var PulsarJob = require('./job');
var events = require('events');
var util = require('util');
var _ = require('underscore');
var async = require('async');
var shellwords = require('shellwords');
var log = require('../logger').getLog();

module.exports = (function() {

  /**
   * @param {Object} db
   * @param {Object} config
   * @constructor
   */
  var Pulsar = function(db, config) {
    this.db = db;
    this.config = config || {};
    this.jobQueue = {};

    events.EventEmitter.call(this);
    this._enableGracefulShutdown();
  };

  util.inherits(Pulsar, events.EventEmitter);

  /**
   * @callback Pulsar~createJobCallback
   * @param {Error} error
   * @param {PulsarJob} job
   */
  /**
   * @param {String} app
   * @param {String} env
   * @param {String} task
   * @param {Object} [taskVariables]
   * @param {Pulsar~createJobCallback} callback
   */
  Pulsar.prototype.createJob = function(app, env, task, taskVariables, callback) {
    if (!task || !_.isString(task) || !task.trim()) {
      throw new ValidationError('create pulsar job requires a pulsar task');
    }
    var args = {
      app: app,
      env: env,
      task: task
    };
    if (taskVariables) {
      if (_.isFunction(taskVariables)) {
        callback = taskVariables;
      } else {
        this._validateTaskVariables(taskVariables);
        args.capistranoOptions = this._taskVariablesToCapistrano(taskVariables);
      }
    }
    var job = this._createJob(args);
    this._saveJob(job, callback);
  };

  /**
   * @param {String} jobId
   * @param {PulsarDB~getJobCallback} callback
   */
  Pulsar.prototype.getJob = function(jobId, callback) {
    if (this.jobQueue[jobId]) {
      return callback(null, this.jobQueue[jobId]);
    }
    this.db.getJob(jobId, callback);
  };

  /**
   * @callback Pulsar~getAvailableTasks
   * @param {Error} error
   * @param {Object.<string, string>} jobs, where key is task name and value is task description.
   */
  /**
   * @param {String} app
   * @param {String} env
   * @param {Pulsar~getAvailableTasks} callback
   */
  Pulsar.prototype.getAvailableTasks = function(app, env, callback) {
    var args = {
      app: app,
      env: env,
      capistranoOptions: ['--tasks']
    };
    var job = this._createJob(args);
    job.on('close', function() {
      if (job.status != PulsarJob.STATUS.FINISHED) {
        return callback(new Error('Collecting of available tasks finished abnormally.\n' + job.output));
      }
      var regex = /cap\s([^\s]+)\s+#\s+([^\s].+)\n/g;
      var match;
      var jobs = {};
      while (null !== (match = regex.exec(job.stdout))) {
        jobs[match[1]] = match[2];
      }
      return callback(null, jobs);
    });
    job.execute();
  };

  /**
   * @see PulsarDB.getJobList
   */
  Pulsar.prototype.getJobList = function(callback) {
    return this.db.getJobList(callback);
  };

  /**
   * @param {Object} args {@see PulsarExec}
   * @param {Object} [data] {@see PulsarExec}
   * @return {PulsarJob} job
   */
  Pulsar.prototype._createJob = function(args, data) {
    var job = new PulsarJob(args, data);
    if (this.config.repo) {
      job._args.pulsarOptions.push('--conf-repo ' + this.config.repo);
    }
    if (this.config.branch) {
      args._args.pulsarOptions.push('--conf-branch ' + this.config.branch);
    }
    return job;
  };

  /**
   * @param {Object} variables
   * @return {Object} validated variables formatted as required for capistranoOptions in constructor of PulsarExec
   * @throws {ValidationError} if taskVariables contain incorrect options
   */
  Pulsar.prototype._validateTaskVariables = function(variables) {
    if (!_.isObject(variables) || _.isArray(variables)) {
      throw new ValidationError('taskVariables must be the hash object');
    }
    //taskVariables are going to be '-s' capistrano options
    var errors = [];
    _.each(variables, function(value, key) {
      key = key.trim();
      if (key.indexOf(' ') !== -1 || key.indexOf('"') !== -1 || key.indexOf('\'') !== -1) {
        errors.push('taskVariables.key:[' + key + '] contains illegal whitespace or quotes');
      }
      if (!_.isString(value) && !_.isFinite(value)) {
        errors.push('taskVariables.key:[' + key + '] contains illegal value. Value must be a string or a number');
      }
    });
    if (errors.length) {
      throw new ValidationError(errors.join('; '));
    }
  };

  Pulsar.prototype._taskVariablesToCapistrano = function(variables) {
    var result = [];
    _.each(variables, function(value, key) {
      result.push('-s ' + shellwords.escape(key) + '="' + shellwords.escape(value) + '"');
    });
    return result;
  };

  Pulsar.prototype._saveJob = function(job, callback) {
    var self = this;
    this.db.saveJob(job, function(err) {
      if (err) {
        return callback(err);
      }
      self.jobQueue[job.id] = job;
      job.on('change', function() {
        self._updateJob(job);
      });
      job.on('close', function() {
        self._updateJob(job);
        delete self.jobQueue[job.id];
      });
      self.emit('create', job);
      return callback(null, job);
    });
  };

  Pulsar.prototype._updateJob = function(job) {
    this.db.updateJob(job, function(err) {
      if (err) {
        log.error('Job update failed', {id: job.id}, err);
      }
    });
  };

  Pulsar.prototype._enableGracefulShutdown = function() {
    //we can not use process.on('exit') because it forbids to use async operations.
    var self = this;
    _.each(['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT', 'SIGABRT'], function(signal) {
      process.on(signal, function() {
        self._shutdown(signal);
      });
    });
  };

  Pulsar.prototype._shutdown = function(signal) {
    log.info('The process was interrupted by ' + signal + '. Killing all the current jobs.');
    async.each(_.values(this.jobQueue), function(job, callback) {
      job.on('close', function() {
        callback();
      });
    }, function() {
      process.exit();
    });
    _.each(this.jobQueue, function(job) {
      job.kill();
    })
  };

  return Pulsar;

})();
