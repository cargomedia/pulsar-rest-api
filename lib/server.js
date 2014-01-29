var Restapi = require('./api/server/rest');
var Pulsar = require('./pulsar');
var Auth = require('./auth');
var PulsarDB = require('./pulsar/db');

module.exports = (function() {

	var pulsarDB = new PulsarDB();

	/**
	 * @param {Number} port
	 * @param {Object} [sslOptions]
	 * @constructor
	 */
	function Server(port, sslOptions, authUsername, authPassword, authProvider, authMethod) {
		this.server = new Restapi(
			port || 8071,
			sslOptions || {},
			new Pulsar(pulsarDB),
			new Auth(authUsername, authPassword, authProvider, authMethod)
		).getServerInstance();
	}

	Server.prototype.getInstance = function() {
		return this.server;
	}

	return Server;
})()
