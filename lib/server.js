var _ = require('underscore');
var check = require('validator').check;

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
		var server;
		if (sslOptions) {
			server = require('https').createServer(sslOptions);
		} else {
			server = require('http').createServer();
		}
		server.on('connection', function(socket) {
			socket.setTimeout(10000);
		});
		server.listen(port);
	}

	return Server;
})()
