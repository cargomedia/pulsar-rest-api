var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} sslOptions
	 * @param {Object} authOptions
	 * @param {Object} pulsarConfig
	 * @constructor
	 */
	function Server(port, sslOptions, authOptions, pulsarConfig) {
		var db = new PulsarDB();
		var pulsar = new Pulsar(db, pulsarConfig);
		var rest = new PulsarREST(pulsar);
		var auth = new Auth(authOptions);

		this.server = rest.createServer(
			port || 8071,
			sslOptions || {},
			auth.getParser()
		);

		this.server.get(/\/pulsar\/?.*/, rest.serveStatic({
			directory: './public'
		}));

	}

	Server.prototype.getInstance = function() {
		return this.server;
	}

	return Server;
})()
