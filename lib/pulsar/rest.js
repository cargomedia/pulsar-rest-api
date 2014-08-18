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
      log.info('create task, wait flag is:', wait);
      log.debug('create task with params:', params);
      self.pulsar.createTask(params.app, params.env, params.action, params.taskVariables, function(err, task) {
        if (err) {
          log.error('create task, params:', params, 'fail:', err);
          return next(err);
        }
        log.info('create task success. task id is:', task.id);
        log.debug('create task, params:', params, 'success, task is:', task);
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

    server.get('/task/:id', function(req, res, next) {
      log.info('get task by id:', req.params.id);
      log.debug('get task, params:', req.params);
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          log.error('get task, params:', req.params, 'fail:', err);
          return next(err);
        }
        log.info('get task by id:', req.params.id, 'success');
        log.debug('get task by id:', req.params.id, 'task is:', task);
        res.send(task.getData());
        return next();
      });
    });

    server.post('/task/:id/kill', function(req, res, next) {
      log.info('kill task by id:', req.params.id);
      log.debug('kill task, params:', req.params);
      self.pulsar.getTask(req.params.id, function(err, task) {
        if (err) {
          log.error('kill task, params:', req.params, 'fail:', err);
          return next(err);
        }
        task.kill();
        res.send(200);
        return next();
      });
    });

    server.get('/tasks', function(req, res, next) {
      log.info('get current tasks');
      log.debug('get current tasks, params:', req.params);
      self.pulsar.getTaskList(function(err, taskList) {
        if (err) {
          log.error('get current tasks, params:', req.params, 'fail:', err);
          return next(err);
        }
        taskList = _.map(taskList, function(task) {
          return task.getData();
        });
        log.info('get current tasks success');
        log.debug('get current tasks success, tasks are:', taskList);
        res.send(taskList);
        return next();
      });
    });

    server.get('/:app/:env/tasks', function(req, res, next) {
      log.info('get available tasks of app/env');
      log.debug('get available tasks of app/env', req.params);
      self.pulsar.getAvailableTasks(req.params.app, req.params.env, function(err, tasks) {
        if (err) {
          log.error('get available tasks of app/env', req.params, 'fail:', err);
          return next(err);
        }
        log.info('get available tasks of app/env success');
        log.debug('get available tasks of app/env success, tasks are:');
        res.send(tasks);
        return next();
      });
    });

    server.on('uncaughtException', function(req, res, route, err) {
      log.error('Request:', {url: req.url, params: req.params}, 'caught exception:', err);
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
