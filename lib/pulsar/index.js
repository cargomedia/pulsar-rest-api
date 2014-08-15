var PulsarExec = require('./exec');
var PulsarTask = require('./task');
var events = require('events');
var util = require('util');
var _ = require('underscore');

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
    params = _.pick(params, 'app', 'env', 'action', 'taskVariables');
    if (params.taskVariables) {
      //taskVariables are going to be '-s' capistrano options
      var errors = [];
      _.each(params.taskVariables, function(elem, index, list) {
        if (shellwords.split(elem).length > 1 || elem.indexOf('=') === -1) {
          errors.push(elem + ' is illegal task variable. The supported format is <key>=<value>. There must be no whitespace between <key>,\'=\' and <value>');
        }
        list[index] = '-s ' + elem;
      });
      if (errors.length) {
        throw new Error(errors.join('; '));
      }
      params.capistranoOptions = params.taskVariables;
      delete params.taskVariables;
    }
    return params;
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
