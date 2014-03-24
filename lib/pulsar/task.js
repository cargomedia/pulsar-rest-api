var PulsarStatus = require('./status');
var events = require('events');
var util = require('util');
var psTree = require('ps-tree');

module.exports = (function() {

  var PulsarTask = function(id, app, env, action, config) {
    var data = id;
    if (typeof data != 'object') {
      data = {
        id: id,
        app: app,
        env: env,
        action: action
      };
    }
    this.status = new PulsarStatus(PulsarStatus.CREATED);
    this.setData(data);

    this._config = config;
    this._taskProcess = null;
    events.EventEmitter.call(this);
  };

  util.inherits(PulsarTask, events.EventEmitter);

  PulsarTask.prototype.onUpdate = function() {
    this.emit("change", { task: this });
  };

  PulsarTask.prototype.onClose = function() {
    this.emit("close", { task: this });
  };

  PulsarTask.prototype.execute = function() {
    var self = this;
    var spawn = require('child_process').spawn;

    self.status.set(PulsarStatus.RUNNING);

    var args = [
      self.app, self.env, self.action
    ];

    if (this._config.repo) {
      args.unshift(this._config.repo);
      args.unshift('--conf-repo');
    }

    if (this._config.branch) {
      args.unshift(this._config.branch);
      args.unshift('--conf-branch');
    }

    this._taskProcess = spawn('pulsar', args);
    this.pid = this._taskProcess.pid;
    this.command = 'pulsar ' + args.join(' ');

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
        self.setStatus(PulsarStatus.KILLED);
      } else {
        if (code == 0) {
          self.setStatus(PulsarStatus.FINISHED);
        } else {
          self.setStatus(PulsarStatus.FAILED);
        }
      }
      self.onUpdate();
      self.onClose();
    });
  };

  PulsarTask.prototype.getStatus = function() {
    return this.status.get();
  };

  PulsarTask.prototype.setStatus = function(status) {
    return this.status.set(status);
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
      //TODO here we have to write to some log or websocket that task can't be killed by some unexpected reason.
    }
  };

  PulsarTask.prototype.getData = function() {
    return {
      id: this.id,
      status: this.getStatus(),
      timestamp: this.timestamp,
      app: this.app,
      env: this.env,
      action: this.action,
      exitCode: this.exitCode,
      output: this.output,
      pid: this.pid,
      command: this.command
    };
  };

  PulsarTask.prototype.setData = function(data) {
    this.id = data.id;
    if (data.status) {
      this.status.set(data.status);
    }
    this.timestamp = data.timestamp || new Date().getTime();
    this.app = data.app;
    this.env = data.env;
    this.action = data.action;
    this.exitCode = data.exitCode || null;
    this.output = data.output || '';
    this.pid = data.pid || null;
    this.command = data.command || '';
  };

  return PulsarTask;

})();
