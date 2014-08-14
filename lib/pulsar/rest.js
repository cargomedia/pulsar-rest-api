var _ = require('underscore');

module.exports = (function() {

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
  PulsarREST.prototype.installHandlers = function(server) {
    var self = this;
    this.protocol = server.secure ? 'https' : 'http';

    server.post('/:app/:env', function(req, res, next) {
      var wait = !!req.params.wait;
      self.pulsar.createTask(req.params, function(err, task) {
        if (err) {
          return next(err);
        }
        var response = {
          id: task.id,
          url: self.protocol + '://' + req.headers.host + HOME_DIR + '/task/' + task.id
        };
        task.execute();
        if (wait) {
          task.on('close', function() {
            response.data = task.getData();
            res.send(response);
            next();
          });
        } else {
          res.send(response);
          next();
        }
      });
    });

    server.get('/task/:id', function(req, res, next) {
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          return next(err);
        }
        res.send(task.getData());
        next();
      });
    });

    server.post('/task/:id/kill', function(req, res, next) {
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          return next(err);
        }
        task.kill();
        res.send(200);
        next();
      });
    });

    server.get('/tasks', function(req, res, next) {
      self.pulsar.getTaskList(function(err, taskList) {
        if (err) {
          return next(err);
        }
        taskList = _.map(taskList, function(task) {
          return task.getData();
        });
        res.send(taskList);
        next();
      });
    });

    server.get('/:app/:env/tasks', function(req, res, next) {
      self.pulsar.getAvailableTasks(req.params.app, req.params.env, function(err, tasks) {
        if (err) {
          return next(err);
        }
        res.send(tasks);
        next();
      });
    });

  };

  return PulsarREST;

})();
