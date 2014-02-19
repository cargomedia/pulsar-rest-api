var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');
var fs = require('fs');
var _ = require('underscore');
var sockjs = require('sockjs');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} sslOptions
	 * @param {Object} authOptions
	 * @param {Object} pulsarConfig
	 * @constructor
	 */
	function Server(port, sslOptions, authOptions, pulsarConfig) {
		port = port || 8071;
		var db = new PulsarDB();
		var pulsar = new Pulsar(db, pulsarConfig);
		var rest = new PulsarREST(pulsar);
		var auth = new Auth(authOptions);

		var connections = {};

		this.server = rest.createServer(sslOptions || {}, auth.getParser());


		this.server.get(/^\/web\/assets\/?.*/, rest.serveStatic({
			directory: './public/assets'
		}));

		this.server.get(/^\/web\/app\/?.*/, rest.serveStatic({
			directory: './public/app'
		}));

		this.server.get('/web.*', function(req, res, next) {
			var html = fs.readFileSync('public/index.html').toString();
			res.setHeader('Content-type', 'text/html');
			res.send(html);
		});

		pulsar.on('create', function(task) {
			broadcast(JSON.stringify({
				'event': 'task.create',
				'task': task.getData()
			}));

			task.on('change', function() {
				broadcast(JSON.stringify({
					'event': 'task.change',
					'task': task.getData()
				}));
			});
		});

		var broadcast = function broadcast(message) {
			_(connections).forEach(function(connection) {
				connection.write(message);
			});
		};

		var echo = sockjs.createServer();
		echo.on('connection', function(conn) {
			connections[conn.id] = conn;
			console.log('connect');
			conn.on('data', function(message) {
				broadcast(message);
			});
			conn.on('close', function() {
				delete connections[conn.id];
			});
		});

		echo.installHandlers(this.server.server, {prefix: '/websocket'});

		this.server.listen(port);

	}

	Server.prototype.getInstance = function() {
		return this.server;
	}

	return Server;
})()
