
module.exports = (function() {

	/**
	 * @constructor
	 */
	function Pulsar() {

	}

	var PulsarTask = function (app, env, action) {
		var self = this;
		self.app = app;
		self.env = env;
		self.action = action;
	}

	Pulsar.prototype.getStatus = function(task) {
	}

	Pulsar.prototype.createTask = function(app, env, action) {
		return new PulsarTask(app, env, action);
	}

	return Pulsar;
})()

