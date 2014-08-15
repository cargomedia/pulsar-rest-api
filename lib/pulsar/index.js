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
   * @param {String} app
   * @param {String} env
   * @param {String} action
   * @param {Object} [taskVariables]
   * @param {Function} callback
   */
  Pulsar.prototype.createTask = function(app, env, action, taskVariables, callback) {
    if (!action || !_.isString(action) || !action.trim()) {
      throw new ValidationError('create task requires an action');
    }
    var args = {
      app: app,
      env: env,
      action: action
    };
    if (taskVariables) {
      if (_.isFunction(taskVariables)) {
        callback = taskVariables;
      } else {
        this._validateTaskVariables(taskVariables);
        args.capistranoOptions = this._taskVariablesToCapistrano(taskVariables);
      }
    }
    var task = this._createTask(args);
    var self = this;
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
   * @param {Object} variables
   * @return {Object} validated variables formatted as required for capistranoOptions in constructor of PulsarExec
   * @throws {ValidationError} if taskVariables contain incorrect options
   */
  Pulsar.prototype._validateTaskVariables = function(variables) {
    if (!_.isObject(variables)) {
      throw new ValidationError('taskVariables must be the hash object');
    }
    //taskVariables are going to be '-s' capistrano options
    var errors = [];
    _.each(variables, function(value, key) {
      key = key.trim();
      if (key.indexOf(' ') !== -1 || key.indexOf('"') !== -1 || key.indexOf('\'') !== -1) {
        errors.push('Whitespace and quotes are illegal to use in keys of taskVariables');
      }
      if (!_.isString(value)) {
        errors.push(key + ' in taskVariables must contain string value');
        return;
      }
      value = value.trim();
      try {
        if (shellwords.split(value).length > 1) {
          errors.push('Separate words must be in quotes to be used as values of taskVariables');
        }
      } catch (e) {
        errors.push('taskVariables have illegal value for key: ' + key + '.' + e);
      }
    });
    if (errors.length) {
      throw new ValidationError(errors.join('; '));
    }
  };

  Pulsar.prototype._taskVariablesToCapistrano = function(variables) {
    var result = [];
    _.each(variables, function(value, key) {
      result.push('-s ' + key + '=' + value);
    });
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
