var PulsarStatus = require('./status');
var events = require('events');
var util = require('util');

module.exports = (function() {

	var PulsarTask = function(id, app, env, action, config) {
        var data = id;
        if(typeof data == 'string') {
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

	PulsarTask.prototype.onCreate = function() {
		this.emit("create", { task: this });
	}

	PulsarTask.prototype.onUpdate = function() {
		this.emit("change", { task: this });
	}

	PulsarTask.prototype.onClose = function() {
		this.emit("close", { task: this });
	}

	PulsarTask.prototype.execute = function() {
		var self = this;
		var spawn = require('child_process').spawn;

		self.status.set(PulsarStatus.STATUS_RUNNING);

		var args = [
			'--conf-repo', this._config.repo || '$(echo $PULSAR_CONF_REPO)',
			'--conf-branch', this._config.branch || 'master',
			self.app,
			self.env,
			self.action
		];

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

	PulsarTask.prototype.getStatus = function() {
		return this.status.get();
	}

    PulsarTask.prototype.setStatus = function(status) {
        return this.status.set(status);
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

    PulsarTask.prototype.setData = function(data) {
        this.id = data.id;
        this.status = new PulsarStatus(data.status || null);
        this.timestamp = data.timestamp || new Date().getTime();
        this.app  = data.app;
        this.env  = data.env;
        this.action = data.action;
        this.exitCode = data.exitCode || null;
        this.output = data.output || '';
        this.pid = data.pid || null;
        this.command = data.command || '';
    }

	return PulsarTask;

})()
