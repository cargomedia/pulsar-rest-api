var Restify = require('restify');
var PulsarStatus = require('./status');
var _ = require('underscore');

module.exports = (function () {

    var WEB_ROOT = '/web';

    /**
     * @param {Object} pulsar
     * @constructor
     */
    function PulsarREST(pulsar) {
        this.pulsar = pulsar;
    }

    /**
     * @param {Number} port
     * @param {Object} [sslOptions]
     * @param {Function} authorisationCallback
     */
    PulsarREST.prototype.createServer = function (port, sslOptions, authorisationCallback) {
        var self = this;

        this.server = Restify.createServer({
            certificate: sslOptions ? sslOptions['cert'] : null,
            key: sslOptions ? sslOptions['key'] : null,
            name: 'pulsar-rest-api',
            debug: true,
            version: '1.0.0'
        });

        this.protocol = this.server.secure ? 'https' : 'http';
        this.server.formatters['text/html'] = this.server.formatters['text/plain'];

        if (authorisationCallback) {
            this.server.use(authorisationCallback);
        }
        this.server.use(Restify.acceptParser(this.server.acceptable));
        this.server.use(Restify.queryParser());
        this.server.use(Restify.bodyParser());

        this.server.post('/:app/:env', function (req, res, next) {
            self.pulsar.createTask(req.params.app, req.params.env, req.params.action, function (task) {
                try {
                    task.execute();
                    res.send({
                        id: task.id,
                        url: self.protocol + '://' + req.headers.host + WEB_ROOT + '/task/' + task.id
                    });
                } catch (e) {
                    return next(new Restify.RestError({message: e.message}));
                }
                return next();
            });
        });

        this.server.get('/task/:id', function (req, res, next) {
            self.pulsar.getTask(req.params.id, function (err, task) {
                if (err) {
                    return next(err);
                }
                res.send(task.getData());
            });
        });

        this.server.get('/task/:id/state', function (req, res, next) {
            self.pulsar.getTask(req.params.id, function (err, task) {
                if (err) {
                    return next(err);
                }

                var listenerTimeout = setTimeout(function () {
                    task.removeListener('close', listener);
                    res.send({changed: false});
                }, 30000);

                var listener = function (data) {
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

        this.server.get('/task/:id/output', function (req, res, next) {
            self.pulsar.getTask(req.params.id, function (err, task) {
                if (err) {
                    return next(err);
                }

                var listenerTimeout = setTimeout(function () {
                    task.removeListener('change', listener);
                    res.send({changed: false});
                }, 30000);

                var listener = function (data) {
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

        this.server.post('/task/:id/kill', function (req, res, next) {
            self.pulsar.getTask(req.params.id, function (err, task) {
                if (err) {
                    return next(err);
                }

                task.kill();
                res.send(200);
                return next();
            });
        });

        this.server.get('/tasks', function (req, res, next) {
            self.pulsar.getTaskList(function (taskList) {
                res.send({
                    tasks: taskList,
                    url: self.protocol + '://' + req.headers.host + WEB_ROOT
                });
                return next();
            });
        });

        this.server.get('/tasks/created', function (req, res, next) {
            var listenerTimeout = setTimeout(function () {
                self.pulsar.removeListener('create', listener);
                res.send({changed: false});
            }, 10000);

            var listener = function (task) {
                res.send({changed: true, task: task.getData()});
                clearTimeout(listenerTimeout);
            };

            self.pulsar.once('create', listener);
        });

        this.server.listen(port);

        return this.server;
    }

    PulsarREST.prototype.serveStatic = Restify.serveStatic;

    PulsarREST.prototype.getProtocol = function () {
        return this.protocol;
    }

    return PulsarREST;

})();
