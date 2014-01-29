var Restapi = require('./api/server/rest');
var Pulsar = require('./pulsar');
var Auth = require('./auth');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} [sslOptions]
	 * @constructor
	 */
	function Server(port, sslOptions, authUsername, authPassword, authProvider, authMethod) {
		this.server = new Restapi(
			port || 8080,
			sslOptions || {},
			new Pulsar(),
			new Auth(authUsername, authPassword, authProvider, authMethod)
		).getServerInstance();
	}

	Server.prototype.getInstance = function() {
		return this.server;
	}

	return Server;
})()
