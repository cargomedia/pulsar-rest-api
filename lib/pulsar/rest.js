var _ = require('underscore');
var log = require('../logger');

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

    server.post('/:app/:env', function createTask(req, res, next) {
      var params = req.params;
      var wait = !!params.wait;
      log.debug('Task create {params:', params, '}');
      self.pulsar.createTask(params.app, params.env, params.action, params.taskVariables, function(err, task) {
        if (err) {
          log.error('Task create {params:', params, '} failed', err);
          return next(err);
        }
        log.debug('Task create {params:', params, '} success {task:', task, '}');
        var response = {
          id: task.id,
          url: self.protocol + '://' + req.headers.host + HOME_DIR + '/task/' + task.id
        };
        if (wait) {
          task.on('close', function() {
            response.data = task.getData();
            res.send(response);
            return next();
          });
          task.execute();
        } else {
          task.execute();
          res.send(response);
          return next();
        }
      });
    });

    server.get('/task/:id', function getTaskById(req, res, next) {
      log.debug('Task find {id:', req.params.id, '}');
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          log.error('Task find {id:', req.params.id, '} failed', err);
          return next(err);
        }
        log.debug('Task find {id:', req.params.id, '} success {task: ', task, '}');
        res.send(task.getData());
        return next();
      });
    });

    server.post('/task/:id/kill', function killTaskById(req, res, next) {
      log.debug('Task kill {id:', req.params.id, '}');
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          log.error('Task kill {id:', req.params.id, '} failed', err);
          return next(err);
        }
        task.kill();
        res.send(200);
        return next();
      });
    });

    server.get('/tasks', function getCurrentRunningTasks(req, res, next) {
      self.pulsar.getTaskList(function(err, taskList) {
        if (err) {
          log.error('Current Tasks get failed', err);
          return next(err);
        }
        taskList = _.map(taskList, function(task) {
          return task.getData();
        });
        res.send(taskList);
        return next();
      });
    });

    server.get('/:app/:env/tasks', function getAvailableCapTasks(req, res, next) {
      self.pulsar.getAvailableTasks(req.params.app, req.params.env, function(err, tasks) {
        if (err) {
          log.error('Available Cap tasks get {params:', req.params, '} failed', err);
          return next(err);
        }
        res.send(tasks);
        return next();
      });
    });

    server.on('uncaughtException', function(req, res, route, err) {
      log.error('Request', {
        url: req.url,
        params: req.params
      }, 'caught exception', err);
      if (err instanceof ValidationError) {
        res.send(err);
      } else {
        res.send(new Error('unexpected error'));
      }
      return (true);
    });

  };

  return PulsarREST;

})();
