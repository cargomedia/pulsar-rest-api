var Restify = require('restify');
var PulsarStatus = require('./status');
var _ = require('underscore');

module.exports = (function() {

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
    PulsarREST.prototype.createServer = function(port, sslOptions, authorisationCallback) {
        var self = this;

        this.server = Restify.createServer({
            certificate: sslOptions ? sslOptions['cert'] : null,
            key: sslOptions ? sslOptions['key'] : null,
            name: 'pulsar-rest-api',
            version: '1.0.0'
        });

        if(authorisationCallback) {
            this.server.use(authorisationCallback);
        }

        this.server.use(Restify.acceptParser(this.server.acceptable));
        this.server.use(Restify.queryParser());
        this.server.use(Restify.bodyParser());

        this.server.post('/:app/:env', function(req, res, next) {
            var task = self.pulsar.createTask(req.params.app, req.params.env, req.params.action);
            try {
                task.execute();
                res.send({taskId: task.id});
            } catch (e) {
                return next(new Restify.RestError({message: e.message}));
            }
            return next();
        });

        this.server.get('/task/:id', function(req, res, next) {
            var task = this.pulsar.getTask(req.params.id);
            res.send(task.getData());
        });

        this.server.get('/task/:id/state', function(req, res, next) {
            var task = self.pulsar.getTask(req.params.id);

            var listenerTimeout = setTimeout(function() {
                task.removeListener('taskChanged', listener);
                res.send({changed: false});
            }, 10000);

            var listener = function(data) {
                res.send({changed: true, task: task.getData()});
                clearTimeout(listenerTimeout);
            };

            if(task.getStatus() != PulsarStatus.STATUS_RUNNING) {
                listener.call(this);
                return next();
            }

            task.once('taskChanged', listener);
        });

        this.server.post('/task/:id/kill', function(req, res, next) {
            var task = self.pulsar.getTask(req.params.id);
            task.kill();
            res.send(200);
            return next();
        });

        this.server.get('/tasks', function(req, res, next) {
            var taskList = self.pulsar.getTaskList();
            var taskDataList = _.map(_.values(taskList), function(task) {
                return task.getData();
            });

            res.send(taskDataList);
            return next();
        });


        this.server.listen(port);

        return this.server;
    }

    PulsarREST.prototype.serveStatic = Restify.serveStatic;

    return PulsarREST;

})();
