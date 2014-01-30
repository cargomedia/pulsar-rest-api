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
			var task = pulsar.createTask(req.params.app, req.params.env, req.params.action);
			try {
				task.execute();
				res.send({taskId: task.id});
			} catch (e) {
				return next(new restify.RestError({message: e.message}));
			}
			return next();
		});

		this.server.get('/task/:id', function(req, res, next) {
			var task = pulsar.getTask(req.params.id);
			res.send(task.getData());
		});

		this.server.get('/task/:id/state', function(req, res, next) {
			var task = pulsar.getTask(req.params.id);

			var listenerTimeout = setTimeout(function() {
				task.removeListener('taskChanged', listener);
				res.send({changed: false});
				console.log('task timeout');
			}, 30000);

			var listener = function(data) {
				res.send({changed: true, task: task.getData()});
				clearTimeout(listenerTimeout);
				console.log('state changed, clearing listener');
			};

			task.once('taskChanged', listener);
		});

		this.server.post('/task/:id/kill', function(req, res, next) {
			var task = pulsar.getTask(req.params.id);
			task.kill();
			res.send(200);
			return next();
		});


		this.server.listen(port);
	}

	REST.prototype.getServerInstance = function() {
		return this.server;
	}

	return REST;
})()
