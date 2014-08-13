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
   * @param {Object} pulsarExec
   */
  Pulsar.prototype.setConfigOptions = function(pulsarExec) {
    if (this.config.repo) {
      pulsarExec.setPulsarOption('--conf-repo', this.config.repo);
    }
    if (this.config.branch) {
      pulsarExec.setPulsarOption('--conf-branch', this.config.branch);
    }
  };

  /**
   * @param {Object} args {@see PulsarExec}
   * @param {Function} callback
   */
  Pulsar.prototype.createTask = function(args, callback) {
    var self = this;
    var task = new PulsarTask(args);
    this.setConfigOptions(task);
    this.db.saveTask(task, function(err) {
      if (err) {
        callback(err);
        return;
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
      callback(null, task);
    });
  };

  Pulsar.prototype.getTask = function(taskId, callback) {
    if (this.taskQueue[taskId]) {
      callback(null, this.taskQueue[taskId]);
      return;
    }
    this.db.getTask(taskId, function(err, task) {
      callback(err, task);
    }.bind(this));
  };

  Pulsar.prototype.getAvailableTasks = function(app, env, callback) {
    var args = {
      app: app,
      env: env,
      capistranoOptions: ['--tasks']
    };
    var exec = new PulsarExec(args);
    this.setConfigOptions(exec);
    var process = exec.run();

    var result = '';

    function collectResult(data) {
      result += data;
    }

    process.stdout.on('data', collectResult);
    process.stderr.on('data', collectResult);
    process.on('close', function() {
      var regex = /cap\s([^\s]+)\s+#\s+([^\s].+)\n/g;
      var match;
      var tasks = {};
      while (null !== (match = regex.exec(result))) {
        tasks[match[1]] = match[2];
      }
      if (_.isEmpty(tasks)) {
        callback(result, null);
      } else {
        callback(null, tasks);
      }
    });
  };

  Pulsar.prototype.getTaskList = function(callback) {
    return this.db.getTaskList(callback);
  };

  return Pulsar;

})();
