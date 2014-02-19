var _ = require('underscore');
var sockjs = require('sockjs');

module.exports = (function() {

	/**
	 * @param {Object} pulsar
	 * @constructor
	 */
	function PulsarWebSocket(pulsar) {
		this.pulsar = pulsar;
		this.connections = {};
	}

	PulsarWebSocket.prototype.broadcast = function(message) {
		_(this.connections).forEach(function(connection) {
			connection.write(message);
		});
	}

	/**
	 * @param {Object} server
	 */
	PulsarWebSocket.prototype.installHandlers = function(server) {
		var self = this;

		this.pulsar.on('create', function(task) {

			self.broadcast(JSON.stringify({
				'event': 'task.create',
				'task': task.getData()
			}));

			task.on('change', function() {
				self.broadcast(JSON.stringify({
					'event': 'task.change',
					'task': task.getData()
				}));
			});
		});

		var sockjsServer = sockjs.createServer();
		sockjsServer.on('connection', function(conn) {
			self.connections[conn.id] = conn;
			conn.on('close', function() {
				delete self.connections[conn.id];
			});
		});

		sockjsServer.installHandlers(server, {prefix: '/websocket'});
	}

	return PulsarWebSocket;

})();
