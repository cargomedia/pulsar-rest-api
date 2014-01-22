var _ = require('underscore');

module.exports = (function() {

	/**
	 * @constructor
	 */
	function Pulsar() {
	}

	Pulsar.prototype.rest = function(api) {
		api.get('/:application/:environment/:action', function(req, res) {
			if (req.params.action == 'deploy') {
				res.send(taskDeploy());
			} else if(req.params.action == 'pending') {
				res.send(taskDeployPending());
			}
		});
		api.get('/status/:params', function(req, res) {
			res.send(taskDeployPending());
		});
	}

	Pulsar.prototype.soap = function(api) {}
	Pulsar.prototype.socket = function(api) {}

	var taskDeploy = function() {
		return 'Deploying...';
	}

	var taskDeployPending = function() {
		return 'Deploy pending...';
	}

	return Pulsar;
})()
