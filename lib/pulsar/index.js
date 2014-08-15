var PulsarExec = require('./exec');
var PulsarTask = require('./task');
var events = require('events');
var util = require('util');
var _ = require('underscore');
var shellwords = require('shellwords');

module.exports = (function() {

  /**
   * @param {Object} db
   * @param {Object} config
   * @constructor
   */
  var Pulsar = function(db, config) {
    this.db = db;
    this.config = config || {};

    this.taskQueue = [];

    events.EventEmitter.call(this);
  };

  util.inherits(Pulsar, events.EventEmitter);

  /**
   * @param {Object} args {@see PulsarExec}
   * @param {Object} [data] {@see PulsarExec}
   * @return {PulsarTask} task
   */
  Pulsar.prototype._createTask = function(args, data) {
    var task = new PulsarTask(args, data);
    if (this.config.repo) {
      task._args.pulsarOptions.push('--conf-repo ' + this.config.repo);
    }
    if (this.config.branch) {
      args._args.pulsarOptions.push('--conf-branch ' + this.config.branch);
    }
    return task;
  };

  /**
   * @param {Object} args {@see PulsarExec}
   * @param {Function} callback
   */
  Pulsar.prototype.createTask = function(args, callback) {
    var self = this;
    var task = this._createTask(args);
    this.db.saveTask(task, function(err) {
      if (err) {
        return callback(err);
      }
      self.taskQueue[task.id] = task;
      task.on('change', function() {
        self.db.updateTask(task, function(err) {
          if (err) {
            task.output = 'WARNING! Not all the command\'s output was saved successfully due to an error:' + err + '\n' + task.output;
          }
        });
      });
      task.on('close', function() {
        delete self.taskQueue[task.id];
      });
      self.emit('create', task);
      return callback(null, task);
    });
  };

  /**
   * @param {Object} params
   * @param {String} params.app
   * @param {String} params.env
   * @param {String} [params.action]
   * @param {String} [params.taskVariables]
   * @return {Object} validated params
   * @throws {Error} if taskVariables contain incorrect options
   */
  Pulsar.prototype.validateCreateTaskParams = function(params) {
    var result = _.pick(params, 'app', 'env', 'action');
    if (params.taskVariables) {
      if (!_.isObject(params.taskVariables)) {
        throw new Error('taskVariables must be the hash object');
      }
      //taskVariables are going to be '-s' capistrano options
      var errors = [];
      result.capistranoOptions = [];
      _.each(params.taskVariables, function(value, key) {
        key = key.trim();
        if (key.indexOf(' ') !== -1 || key.indexOf('"') !== -1 || key.indexOf('\'') !== -1) {
          errors.push('Whitespace and quotes are illegal to use in keys of taskVariables');
        }
        value = value.trim();
        try {
          if (shellwords.split(value).length > 1) {
            errors.push('Separate words must be in quotes to be used as values of taskVariables');
          }
        } catch (e) {
          errors.push('taskVariables have illegal value for key: ' + key + '.' + e);
        }
        result.capistranoOptions.push('-s ' + key + '=' + value);
      });
      if (errors.length) {
        throw new Error(errors.join('; '));
      }
    }
    return result;
  };

  Pulsar.prototype.getTask = function(taskId, callback) {
    if (this.taskQueue[taskId]) {
      return callback(null, this.taskQueue[taskId]);
    }
    this.db.getTask(taskId, function(err, task) {
      return callback(err, task);
    }.bind(this));
  };

  Pulsar.prototype.getAvailableTasks = function(app, env, callback) {
    var args = {
      app: app,
      env: env,
      capistranoOptions: ['--tasks']
    };
    var task = this._createTask(args);
    var process = task.run();

    var result = '';
    process.stdout.on('data', function(data) {
      result += data;
    });
    var error = '';
    process.stderr.on('data', function(data) {
      error += data;
    });
    process.on('close', function(code, signal) {
      if (code > 0 || signal) {
        error = 'Collecting of available cap tasks finished abnormally.\n' + error;
        return callback(new Error(error));
      }
      var regex = /cap\s([^\s]+)\s+#\s+([^\s].+)\n/g;
      var match;
      var tasks = {};
      while (null !== (match = regex.exec(result))) {
        tasks[match[1]] = match[2];
      }
      return callback(null, tasks);
    });
  };

  Pulsar.prototype.getTaskList = function(callback) {
    return this.db.getTaskList(callback);
  };

  return Pulsar;

})();
