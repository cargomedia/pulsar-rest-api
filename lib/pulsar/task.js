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

<<<<<<< HEAD
    this._taskProcess.on('close', function(code) {
      self.exitCode = code;
      if (code == 0) {
        self.status.set(PulsarStatus.FINISHED);
      } else {
        self.status.set(PulsarStatus.FAILED);
=======
    this._taskProcess.on('close', function (code, signal) {
      self.exitCode = code;
      if (signal) {
        self.setStatus(PulsarStatus.STATUS_KILLED);
      } else {
        if (code == 0) {
          self.setStatus(PulsarStatus.STATUS_FINISHED);
        } else {
          self.setStatus(PulsarStatus.STATUS_FAILED);
        }
>>>>>>> 7e4d1b7244d33adea5f0be0d7c1443136caacad2
      }
      self.onUpdate();
      self.onClose();
    });
<<<<<<< HEAD
    //    this._taskProcess.
  };
=======
  }

  PulsarTask.prototype.getStatus = function () {
    return this.status.get();
  }

  PulsarTask.prototype.setStatus = function (status) {
    return this.status.set(status);
  }
>>>>>>> 7e4d1b7244d33adea5f0be0d7c1443136caacad2

  PulsarTask._KILL_TIMEOUT = 2000;

<<<<<<< HEAD
  PulsarTask.prototype.kill = function() {
    try {
      //We use here process.kill instead of child_process.kill because it will throw an error instantly if there is no process with such pid. Child_process.kill
      //will throw an error too but this error will be async and we have to use additional complex event listener to catch it.
      //docu about process.kill: http://nodejs.org/api/process.html#process_process_kill_pid_signal
      //docu about child_process.kill http://nodejs.org/api/child_process.html#child_process_child_kill_signal
      process.kill(this._taskProcess.pid, 'SIGTERM');//Yeah we don't rely on default behaviour of kill and set signal manually.
      setTimeout(this._fatality.bind(this, 1), PulsarTask._FATALITY_INTERVAL);
    } catch (e) {
      this._setKilled(e);
=======
  /**
   * @param {Function} callback fn(Number pid)
   */
  PulsarTask.prototype._forEachTaskPid = function(callback) {
    if (this._taskProcess) {
      psTree(this._taskProcess.pid, function (err, children) {
        var pids = children.map(function (p) { return p.PID; });
        pids.push(this._taskProcess.pid);
        pids.forEach(function(pid) {
          callback(pid);
        });
      }.bind(this));
>>>>>>> 7e4d1b7244d33adea5f0be0d7c1443136caacad2
    }
  };

<<<<<<< HEAD
  PulsarTask.prototype._fatality = function(counter) {
    if (counter >= PulsarTask._FATALITY_COUNTER) {
      //TODO here we have to write to some log or email admins that task can't be killed after 3 attempts.
      return;
    }
    try {
      process.kill(this.pid, 0);
      process.kill(this.pid, 'SIGKILL');
      setTimeout(this._fatality.bind(this, counter + 1), PulsarTask._FATALITY_INTERVAL);
    } catch (e) {
      this._setKilled(e);
=======
  PulsarTask.prototype.kill = function () {
    this._forEachTaskPid(function(pid) {
      try{
        process.kill(pid, 'SIGTERM');
        setTimeout(this._killTimeout.bind(this, pid), PulsarTask._KILL_TIMEOUT);
      } catch(e){
        this._onKillError(e);
      }
    }.bind(this));
  };

  PulsarTask.prototype._killTimeout = function (pid) {
    try{
      process.kill(pid, 'SIGKILL');
    }catch(e){
      this._onKillError(e);
>>>>>>> 7e4d1b7244d33adea5f0be0d7c1443136caacad2
    }
  };

  /**
<<<<<<< HEAD
   * This is tricky method that sets status to {@link PulsarStatus.KILLED} from the error of process.kill.
   * @param {Error} err Error that as thrown when we've tried to kill process.
   * @private
   */
  PulsarTask.prototype._setKilled = function(err) {
    if (err.code === 'ESRCH') {
      //Such error code means that task process was killed successfully before. You can see more info about this code here: https://github.com/joyent/node/blob/master/deps/uv/include/uv.h#L134.
      this.status.set(PulsarStatus.KILLED);
    } else {
=======
   * @param {Error} err Error that as thrown when we've tried to kill process.
   * @private
   */
  PulsarTask.prototype._onKillError = function (err) {
    if(err.code !== 'ESRCH'){
>>>>>>> 7e4d1b7244d33adea5f0be0d7c1443136caacad2
      //TODO here we have to write to some log or websocket that task can't be killed by some unexpected reason.
    }
  };

  PulsarTask.prototype.getData = function() {
    return {
      id: this.id,
      status: this.status.get(),
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
