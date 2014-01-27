module.exports = (function() {

	/**
	 * @constructor
	 */
	function Pulsar() {}

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
		api.get('/api-urls', function(req, res) {
			res.send(taskDeployPending());
		});
		api.get('/info/:username', function(req, res) {
			res.send(taskDeployPending());
		});
		api.get('/info/apps/:username', function(req, res) {
			res.send(taskDeployPending());
		});
		api.get('/info/envs/:username', function(req, res) {
			res.send(taskDeployPending());
		});
		api.get('/info/:username/:app', function(req, res) {
			res.send(taskDeployPending());
		});
		api.get('/info/:username/:app/:env', function(req, res) {
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

	var status = function() {
		return 'Status...';
	}

	var apiUrls = function() {
		return 'Api urls...';
	}

	var info = function(username) {
		return 'Info...';
	}

	var infoApps = function(username) {
		return 'Info for granted applications...';
	}

	var infoEnvs = function(username) {
		return 'Info for granted apps/environments...';
	}

	var infoAppEnvs = function(username, app) {
		return 'Info for granted app/environments...';
	}

	var infoAppEnvsTasks = function(username, app, env) {
		return 'Info for granted app/environment/tasks...';
	}

	return Pulsar;
})()
