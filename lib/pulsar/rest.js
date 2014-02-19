var Restify = require('restify');
var PulsarStatus = require('./status');
var _ = require('underscore');

module.exports = (function() {

	var HOME_DIR = '/pulsar';
	var HOME_URL = HOME_DIR + '/index.html';

	/**
	 * @param {Object} pulsar
	 * @constructor
	 */
	function PulsarREST(pulsar) {
		this.pulsar = pulsar;
	}

	/**
	 * @param {Object} server
	 */
	PulsarREST.prototype.installHandlers = function(server) {
		var self = this;

		server.post('/:app/:env', function(req, res, next) {
			self.pulsar.createTask(req.params.app, req.params.env, req.params.action, function(task) {
                try {
                    task.execute();
                    res.send({
                        id: task.id,
                        url: self.protocol + '://' + req.headers.host + '/task/' + task.id + '/state'
                    });
                } catch (e) {
                    return next(new Restify.RestError({message: e.message}));
                }
                return next();
            });
		});

		server.get('/task/:id', function(req, res, next) {
			self.pulsar.getTask(req.params.id, function(err, task) {
                if(err) {
                    return next(err);
                }
                res.send(task.getData());
            });
		});

		server.get('/task/:id/state', function(req, res, next) {
            self.pulsar.getTask(req.params.id, function(err, task) {
                if(err) {
                    return next(err);
                }

                var listenerTimeout = setTimeout(function() {
                    task.removeListener('close', listener);
                    res.send({changed: false});
                }, 30000);

                var listener = function(data) {
                    res.send({changed: true, task: task.getData()});
                    clearTimeout(listenerTimeout);
                };

                if (task.getStatus() != PulsarStatus.STATUS_RUNNING
                    && task.getStatus() != PulsarStatus.STATUS_CREATED) {

                    listener.call(this);
                    return next();
                }

                task.once('close', listener);
            });
		});

		server.get('/task/:id/output', function(req, res, next) {
            self.pulsar.getTask(req.params.id, function(err, task) {
                if(err) {
                    return next(err);
                }

                var listenerTimeout = setTimeout(function() {
                    task.removeListener('change', listener);
                    res.send({changed: false});
                }, 30000);

                var listener = function(data) {
                    res.send({changed: true, task: task.getData()});
                    clearTimeout(listenerTimeout);
                };

                if (task.getStatus() != PulsarStatus.STATUS_RUNNING
                    && task.getStatus() != PulsarStatus.STATUS_CREATED) {

                    listener.call(this);
                    return next();
                }

                task.once('change', listener);
            });
		});

		server.post('/task/:id/kill', function(req, res, next) {
            self.pulsar.getTask(req.params.id, function(err, task) {
                if(err) {
                    return next(err);
                }

                task.kill();
                res.send(200);
                return next();
            });
		});

		server.get('/tasks', function(req, res, next) {
			self.pulsar.getTaskList(function(taskList) {
                res.send(taskList);
                return next();
            });
		});

		server.get('/tasks/created', function(req, res, next) {
			var listenerTimeout = setTimeout(function() {
				self.pulsar.removeListener('create', listener);
				res.send({changed: false});
			}, 10000);

			var listener = function(task) {
				res.send({changed: true, task: task.getData()});
				clearTimeout(listenerTimeout);
			};

			self.pulsar.once('create', listener);
		});
	}

	return PulsarREST;

})();
