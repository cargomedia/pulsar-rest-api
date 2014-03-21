var Restify = require('restify');
var PulsarStatus = require('./status');
var _ = require('underscore');

module.exports = (function () {

  var HOME_DIR = '/web';

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
  PulsarREST.prototype.installHandlers = function (server) {
    var self = this;

    this.protocol = server.secure ? 'https' : 'http';

    server.post('/:app/:env', function (req, res, next) {
      self.pulsar.createTask(req.params.app, req.params.env, req.params.action, function (task) {
        try {
          task.execute();
          res.send({
            id: task.id,
            url: self.protocol + '://' + req.headers.host + HOME_DIR + '/task/' + task.id
          });
        } catch (e) {
          return next(new Restify.RestError({message: e.message}));
        }
        return next();
      });
    });

    server.get('/task/:id', function (req, res, next) {
      self.pulsar.getTask(req.params.id, function (err, task) {
        if (err) {
          return next(err);
        }
        res.send(task.getData());
      });
    });

    server.post('/task/:id/kill', function (req, res, next) {
      self.pulsar.getTask(req.params.id, function (err, task) {
        if (err) {
          return next(err);
        }

        task.kill();
        res.send(200);
        return next();
      });
    });

    server.get('/tasks', function (req, res, next) {
      self.pulsar.getTaskList(function (taskList) {
        res.send(taskList);
        return next();
      });
    });
  }

  return PulsarREST;

})();
