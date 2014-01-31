var PulsarStatus = require('./status');
var events = require('events');
var util = require('util');

module.exports = (function() {

	var PulsarTask = function(id, app, env, action, config) {
		this.id = id;
		this.status = new PulsarStatus();
		this.app = app;
		this.env = env;
		this.action = action;
		this.exitCode = null;
		this.output = '';
		this.pid = null;

        this._config = config;
		this._taskProcess = null;
		events.EventEmitter.call(this);
	}

	util.inherits(PulsarTask, events.EventEmitter);

	PulsarTask.prototype.getStatus = function() {
		return this.status.get();
	}

	PulsarTask.prototype.onUpdate = function() {
		this.emit("taskChanged", { task: this });
	}

	PulsarTask.prototype.onClose = function() {
		this.emit("taskClose", { task: this });
	}

	PulsarTask.prototype.execute = function() {
		var self = this;
		var spawn = require('child_process').spawn;

        self.status.set(PulsarStatus.STATUS_RUNNING);

        var args = [
            '--conf-repo', this._config.repo,
            '--conf-branch', this._config.branch,
            self.app,
            self.env,
            self.action
        ];

		this._taskProcess = spawn('pulsar', args);
		this.pid = this._taskProcess.pid;

		this._taskProcess.stdout.on('data', function(data) {
			self.output += data;
			self.onUpdate();
		});

		this._taskProcess.stderr.on('data', function(data) {
			self.output += data;
			self.onUpdate();
		});

		this._taskProcess.on('close', function(code) {
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

	PulsarTask.prototype.kill = function() {
		this._taskProcess.kill();
	}

	PulsarTask.prototype.getOutput = function() {
		return this.output;
	}

	PulsarTask.prototype.getExitCode = function() {
		return this.exitCode;
	}

	PulsarTask.prototype.getData = function() {
		return {
			id: this.id,
			status: this.getStatus(),
			app: this.app,
			env: this.env,
			action: this.action,
			exitCode: this.exitCode,
			output: this.output,
			pid: this.pid
		};
	}

	return PulsarTask;

})()
