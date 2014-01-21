var Restapi = require('./rest');
var Pulsar = require('./pulsar');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} [sslOptions]
	 * @constructor
	 */
	function Server(port, sslOptions) {
		createServer(port, sslOptions);
	}

	Server.prototype.cleanup = function() {};

	var createServer = function(port, sslOptions) {
		api = new Restapi(port, sslOptions)
		engine = new Pulsar(api);
	}

	return Server;
})()
