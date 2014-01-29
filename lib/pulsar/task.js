var PulsarStatus = require('./status');

module.exports = (function() {

	var PulsarTask = function(id, app, env, action, onUpdate) {
		this.id = id;
		this.status = new PulsarStatus();
		this.app = app;
		this.env = env;
		this.action = action;
		this.exitCode = null;
		this.output = '';
		this.onUpdate = onUpdate || function() {};
	}

	PulsarTask.prototype.getStatus = function() {
		return this.status.get();
	}

	PulsarTask.prototype.execute = function() {
		var self = this;
		self.status.set(PulsarStatus.STATUS_RUNNING);

		var spawn = require('child_process').spawn;
		var pulsarProcess = spawn('pulsar', [self.app, self.env, self.action]);

		pulsarProcess.stdout.on('data', function(data) {
			self.output += data;
			self.onUpdate(self);
		});

		pulsarProcess.stderr.on('data', function(data) {
			self.output += data;
			self.onUpdate(self);
		});

		pulsarProcess.on('close', function(code) {
			self.exitCode = code;
			if (code == 0) {
				self.status.set(PulsarStatus.STATUS_FINISHED);
			} else {
				self.status.set(PulsarStatus.STATUS_FAILED); // TODO: error code
			}
			self.onUpdate(self);
		});
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
			output: this.output
		};
	}

	return PulsarTask;

})()
