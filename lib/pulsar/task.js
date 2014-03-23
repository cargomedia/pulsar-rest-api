var PulsarStatus = require('./status');
var events = require('events');
var util = require('util');

module.exports = (function () {

  var PulsarTask = function (id, app, env, action, config) {
    var data = id;
    if (typeof data != 'object') {
      data = {
        id: id,
        app: app,
        env: env,
        action: action
      };
    }
    this.setData(data);

    this._config = config;
    this._taskProcess = null;
    events.EventEmitter.call(this);
  }

  util.inherits(PulsarTask, events.EventEmitter);

  PulsarTask.prototype.onUpdate = function () {
    this.emit("change", { task: this });
  }

  PulsarTask.prototype.onClose = function () {
    this.emit("close", { task: this });
  }

  PulsarTask.prototype.execute = function () {
    var self = this;
    var spawn = require('child_process').spawn;

    self.status.set(PulsarStatus.STATUS_RUNNING);

    var args = [
      self.app,
      self.env,
      self.action
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

    this._taskProcess.stdout.on('data', function (data) {
      self.output += data;
      self.onUpdate();
    });

    this._taskProcess.stderr.on('data', function (data) {
      self.output += data;
      self.onUpdate();
    });

    this._taskProcess.on('close', function (code) {
      self.exitCode = code;
      if (code == 0) {
        self.status.set(PulsarStatus.STATUS_FINISHED);
      } else {
        self.status.set(PulsarStatus.STATUS_FAILED);
      }
      self.onUpdate();
      self.onClose();
    });
  }

  PulsarTask.prototype.getStatus = function () {
    return this.status.get();
  }

  PulsarTask.prototype.setStatus = function (status) {
    return this.status.set(status);
  }

  PulsarTask._FATALITY_INTERVAL = 500;
  PulsarTask._FATALITY_COUNTER = 3;

  PulsarTask.prototype.kill = function () {
    try{
      //We use here process.kill instead of child_process.kill because it will throw an error instantly if there is no process with such pid. Child_process.kill
      //will throw an error too but this error will be async and we have to use additional complex event listener to catch it.
      //docu about process.kill: http://nodejs.org/api/process.html#process_process_kill_pid_signal
      //docu about child_process.kill http://nodejs.org/api/child_process.html#child_process_child_kill_signal
      process.kill(this._taskProcess.pid, 'SIGTERM');//Yeah we don't rely on default behaviour of kill and set signal manually.
      setTimeout(this._fatality.bind(this, 1), PulsarTask._FATALITY_INTERVAL);
    } catch(e){
      this._setKilled(e);
    }
    this.onUpdate();
  };

  PulsarTask.prototype._fatality = function (counter) {
    if(counter >= PulsarTask._FATALITY_COUNTER){
      //TODO here we have to write to some log or email admins that task can't be killed after 3 attempts.
      return;
    }
    try{
      process.kill(this.pid, 0);
      process.kill(this.pid, 'SIGKILL');
      setTimeout(this._fatality.bind(this, counter + 1), PulsarTask._FATALITY_INTERVAL);
    }catch(e){
      this._setKilled(e);
    }
  };

  /**
   * This is tricky method that sets status to {@link PulsarStatus.STATUS_KILLED} from the error of process.kill.
   * @param {Error} err Error that as thrown when we've tried to kill process.
   * @private
   */
  PulsarTask.prototype._setKilled = function (err) {
    if(err.code === 'ESRCH'){
      //Such error code means that task process was killed successfully before. You can see more info about this code here: https://github.com/joyent/node/blob/master/deps/uv/include/uv.h#L134.
      this.setStatus(PulsarStatus.STATUS_KILLED);
    } else {
      //TODO here we have to write to some log or websocket that task can't be killed by some unexpected reason.
    }
  };

  PulsarTask.prototype.getOutput = function () {
    return this.output;
  }

  PulsarTask.prototype.getExitCode = function () {
    return this.exitCode;
  }

  PulsarTask.prototype.getData = function () {
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
  }

  PulsarTask.prototype.setData = function (data) {
    this.id = data.id;
    this.status = new PulsarStatus(data.status || null);
    this.timestamp = data.timestamp || new Date().getTime();
    this.app = data.app;
    this.env = data.env;
    this.action = data.action;
    this.exitCode = data.exitCode || null;
    this.output = data.output || '';
    this.pid = data.pid || null;
    this.command = data.command || '';
  }

  return PulsarTask;

})()
