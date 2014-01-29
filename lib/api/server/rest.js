var _ = require('underscore');
var restify = require('restify');

module.exports = (function() {

	/**
	 * @param {Number} port
	 * @param {Object} [sslOptions]
	 * @param {Object} pulsar
	 * @param {Object} auth
	 * @constructor
	 */
	function REST(port, sslOptions, pulsar, auth) {
		this.server = restify.createServer({
			certificate: sslOptions ? sslOptions['cert'] : null,
			key: sslOptions ? sslOptions['key'] : null,
			name: 'pulsar-rest-api',
			version: '1.0.0'
		});

		if(auth) {
			this.server.use(auth.getParser());
		}

		this.server.use(restify.acceptParser(this.server.acceptable));
		this.server.use(restify.queryParser());
		this.server.use(restify.bodyParser());

		this.server.post('/:app/:env', function(req, res, next) {
			res.send(pulsar.createTask(req.params.app, req.params.env, req.params.action));
			return next();
		});

		this.server.listen(port);
	}

	REST.prototype.getServerInstance = function() {
		return this.server;
	}

	return REST;
})()
