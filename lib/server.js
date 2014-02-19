var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarWebsocket = require('./pulsar/websocket');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');
var fs = require('fs');

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
		var websocket = new PulsarWebsocket(pulsar);
		var auth = new Auth(authOptions);

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

		websocket.installHandlers(this.server.server);

		this.server.listen(port);

	}

	Server.prototype.getInstance = function() {
		return this.server;
	}

	return Server;
})()
