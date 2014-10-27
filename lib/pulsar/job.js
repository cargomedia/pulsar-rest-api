var PulsarExec = require('./exec');
var events = require('events');
var util = require('util');
var psTree = require('ps-tree');
var _ = require('underscore');
var log = require('../logger');

module.exports = (function() {

  /**
   * @param {Object} execArgs {@see PulsarExec}
   * @param {Object} [jobData] already available data for the job.
   * @constructor
   */
  var PulsarJob = function(execArgs, jobData) {
    PulsarExec.call(this, execArgs);
    events.EventEmitter.call(this);

    this.setData(jobData || {status: PulsarJob.STATUS.CREATED});
    this._jobProcess = null;
  };

  PulsarJob.STATUS = {
    CREATED: 'CREATED', RUNNING: 'RUNNING', FINISHED: 'FINISHED', FAILED: 'FAILED', KILLED: 'KILLED'
  };

  util.inherits(PulsarJob, events.EventEmitter);
  _.extend(PulsarJob.prototype, PulsarExec.prototype);

  PulsarJob.prototype.onUpdate = function() {
    this.emit("change", {job: this});
  };

  PulsarJob.prototype.onClose = function() {
    this.emit("close", {job: this});
  };

  PulsarJob.prototype.execute = function() {
    log.debug('Job execute', {id: this.id});
    this._jobProcess = this.run();
    this.status = PulsarJob.STATUS.RUNNING;
    this.pid = this._jobProcess.pid;
    this.command = PulsarExec.prototype.toString.call(this);
    var self = this;
    this._jobProcess.stdout.on('data', function(data) {
      self.output += data;
      self.onUpdate();
    });

    this._jobProcess.stderr.on('data', function(data) {
      self.output += data;
      self.onUpdate();
    });

    this._jobProcess.on('close', function(code, signal) {
      self.exitCode = code;
      if (signal) {
        self.status = PulsarJob.STATUS.KILLED;
      } else {
        if (code == 0) {
          self.status = PulsarJob.STATUS.FINISHED;
        } else {
          self.status = PulsarJob.STATUS.FAILED;
        }
      }
      log.debug('Job execute finished', {id: self.id, status: self.status});
      self.onClose();
    });
  };

  PulsarJob._KILL_TIMEOUT = 2000;

  /**
   * @param {Function} callback fn(Number pid)
   */
  PulsarJob.prototype._forEachJobPid = function(callback) {
    if (this._jobProcess) {
      psTree(this._jobProcess.pid, function(err, children) {
        var pids = children.map(function(p) {
          return p.PID;
        });
        pids.push(this._jobProcess.pid);
        pids.forEach(function(pid) {
          callback(pid);
        });
      }.bind(this));
    }
  };

  PulsarJob.prototype.kill = function() {
    log.debug('Job kill', {id: this.id});
    this._forEachJobPid(function(pid) {
      try {
        process.kill(pid, 'SIGTERM');
        setTimeout(this._killTimeout.bind(this, pid), PulsarJob._KILL_TIMEOUT);
      } catch (e) {
        this._onKillError(e);
      }
    }.bind(this));
  };

  PulsarJob.prototype._killTimeout = function(pid) {
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
  PulsarJob.prototype._onKillError = function(err) {
    if (err.code !== 'ESRCH') {
      log.error('Job kill failed', {id: this.id}, err);
    }
  };

  PulsarJob.prototype.getData = function() {
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

  PulsarJob.prototype.setData = function(data) {
    this.id = data.id;
    this.status = data.status;
    this.timestamp = data.timestamp || new Date().getTime();
    this.exitCode = data.exitCode || null;
    this.output = data.output || '';
    this.pid = data.pid || null;
    this.command = data.command || '';
  };

  return PulsarJob;

})();
