var PulsarExec = require('./exec');
var events = require('events');
var util = require('util');
var psTree = require('ps-tree');
var _ = require('underscore');
var log = require('../logger');

module.exports = (function() {

  /**
   * @param {Object} execArgs {@see PulsarExec}
   * @param {Object} [taskData] already available data for the task.
   * @constructor
   */
  var PulsarTask = function(execArgs, taskData) {
    PulsarExec.call(this, execArgs);
    events.EventEmitter.call(this);

    this.setData(taskData || {status: PulsarTask.STATUS.CREATED});
    this._taskProcess = null;
  };

  PulsarTask.STATUS = {
    CREATED: 'CREATED', RUNNING: 'RUNNING', FINISHED: 'FINISHED', FAILED: 'FAILED', KILLED: 'KILLED'
  };

  util.inherits(PulsarTask, events.EventEmitter);
  _.extend(PulsarTask.prototype, PulsarExec.prototype);

  PulsarTask.prototype.onUpdate = function() {
    this.emit("change", {task: this});
  };

  PulsarTask.prototype.onClose = function() {
    this.emit("close", {task: this});
  };

  PulsarTask.prototype.execute = function() {
    log.debug('Task execute', {id: this.id});
    this._taskProcess = this.run();
    this.status = PulsarTask.STATUS.RUNNING;
    this.pid = this._taskProcess.pid;
    this.command = PulsarExec.prototype.toString.call(this);
    var self = this;
    this._taskProcess.stdout.on('data', function(data) {
      self.output += data;
      self.onUpdate();
    });

    this._taskProcess.stderr.on('data', function(data) {
      self.output += data;
      self.onUpdate();
    });

    this._taskProcess.on('close', function(code, signal) {
      self.exitCode = code;
      if (signal) {
        self.status = PulsarTask.STATUS.KILLED;
      } else {
        if (code == 0) {
          self.status = PulsarTask.STATUS.FINISHED;
        } else {
          self.status = PulsarTask.STATUS.FAILED;
        }
      }
      log.debug('Task execute finished', {id: self.id, status: self.status});
      self.onUpdate();
      self.onClose();
    });
  };

  PulsarTask._KILL_TIMEOUT = 2000;

  /**
   * @param {Function} callback fn(Number pid)
   */
  PulsarTask.prototype._forEachTaskPid = function(callback) {
    if (this._taskProcess) {
      psTree(this._taskProcess.pid, function(err, children) {
        var pids = children.map(function(p) {
          return p.PID;
        });
        pids.push(this._taskProcess.pid);
        pids.forEach(function(pid) {
          callback(pid);
        });
      }.bind(this));
    }
  };

  PulsarTask.prototype.kill = function() {
    log.debug('Task kill', {id: this.id});
    this._forEachTaskPid(function(pid) {
      try {
        process.kill(pid, 'SIGTERM');
        setTimeout(this._killTimeout.bind(this, pid), PulsarTask._KILL_TIMEOUT);
      } catch (e) {
        this._onKillError(e);
      }
    }.bind(this));
  };

  PulsarTask.prototype._killTimeout = function(pid) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (e) {
      this._onKillError(e);
    }
  };

  /**
   * @param {Error} err Error that as thrown when we've tried to kill process.
   * @private
   */
  PulsarTask.prototype._onKillError = function(err) {
    if (err.code !== 'ESRCH') {
      log.error('Task kill failed', {id: this.id}, err);
    }
  };

  PulsarTask.prototype.getData = function() {
    return {
      id: this.id,
      status: this.status,
      timestamp: this.timestamp,
      exitCode: this.exitCode,
      output: this.output,
      pid: this.pid,
      command: this.command
    };
  };

  PulsarTask.prototype.setData = function(data) {
    this.id = data.id;
    this.status = data.status;
    this.timestamp = data.timestamp || new Date().getTime();
    this.exitCode = data.exitCode || null;
    this.output = data.output || '';
    this.pid = data.pid || null;
    this.command = data.command || '';
  };

  return PulsarTask;

})();
