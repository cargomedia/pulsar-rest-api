var PulsarExec = require('./exec');
var events = require('events');
var util = require('util');
var psTree = require('ps-tree');
var _ = require('underscore');
var getLog = require('../logger').getLog;

module.exports = (function() {

  /**
   * @param {Object|null} execArgs {@see PulsarExec}
   * @param {Object} [jobData] already available data for the job.
   * @constructor
   */
  var PulsarJob = function(execArgs, jobData) {
    if (execArgs) {
      PulsarExec.call(this, execArgs);
    }
    events.EventEmitter.call(this);

    if (jobData) {
      this.setData(jobData);
    } else {
      this.createInitialData();
    }
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
    getLog().debug('Job execute', {id: this.id});
    this._jobProcess = this.run();
    this.status = PulsarJob.STATUS.RUNNING;
    this.pid = this._jobProcess.pid;
    this.command = this.getCapistranoCommandArgs().join(' ');
    var self = this;
    this._jobProcess.stdout.on('data', function(data) {
      self.stdout += data;
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
      getLog().debug('Job execute finished', {id: self.id, status: self.status});
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
    getLog().debug('Job kill', {id: this.id});
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
      getLog().error('Job kill failed', {id: this.id}, err);
    }
  };

  PulsarJob.prototype.getData = function() {
    return {
      id: this.id,
      status: this.status,
      timestamp: this.timestamp,
      exitCode: this.exitCode,
      stdout: this.stdout,
      output: this.output,
      pid: this.pid,
      args: this._args
    };
  };

  PulsarJob.prototype.getClientData = function() {
    return {
      id: this.id,
      status: this.status,
      timestamp: this.timestamp,
      stdout: this.stdout,
      output: this.output,
      command: this.getCapistranoCommandArgs().join(' '),
      args: this._args
    };
  };

  PulsarJob.prototype.setData = function(data) {
    this.id = data.id;
    this.status = data.status;
    this.timestamp = data.timestamp;
    this.exitCode = data.exitCode;
    this.stdout = data.stdout;
    this.output = data.output;
    this.pid = data.pid;
    this._args = data.args;
  };

  PulsarJob.prototype.createInitialData = function() {
    this.status = PulsarJob.STATUS.CREATED;
    this.timestamp = new Date().getTime();
    this.stdout = '';
    this.output = '';
    this.exitCode = null;
    this.pid = null;
  };

  return PulsarJob;

})();
