var Restapi = require('./api/rest');
var Pulsar = require('./engine/pulsar');
var Authorisation = require('./authorisation');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} [sslOptions]
	 * @constructor
	 */
	function Server(port, sslOptions, authClientId, authClientSecret, authProvider, authMethod) {
		createServer(port, sslOptions, authClientId, authClientSecret, authProvider, authMethod);
	}

	Server.prototype.cleanup = function() {};

	var createServer = function(port, sslOptions, authClientId, authClientSecret, authProvider, authMethod) {
		var server = new Restapi(
			port,
			sslOptions,
			new Pulsar(),
			new Authorisation(authClientId, authClientSecret, authProvider, authMethod)
		).getServerInstance();
	}

	return Server;
})()
