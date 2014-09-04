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

    server.get('/', function(req, res) {
      res.redirect(HOME_DIR);
    });

    server.post('/:app/:env', function createJob(req, res, next) {
      var params = req.params;
      var wait = !!params.wait;
      log.debug('Job create', {params: params});
      self.pulsar.createJob(params.app, params.env, params.action, params.taskVariables, function(err, job) {
        if (err) {
          log.error('Job create failed', {params: params}, err);
          return next(err);
        }
        log.debug('Job create success', {params: params, job: job});
        var response = {
          id: job.id,
          url: self.protocol + '://' + req.headers.host + HOME_DIR + '/job/' + job.id
        };
        if (wait) {
          job.on('close', function() {
            response.data = job.getData();
            res.send(response);
            return next();
          });
          job.execute();
        } else {
          job.execute();
          res.send(response);
          return next();
        }
      });
    });

    server.get('/job/:id', function getJobById(req, res, next) {
      log.debug('Job find', {id: req.params.id});
      self.pulsar.getJob(req.params.id, function(err, job) {
        if (err) {
          log.error('Job find failed', {id: req.params.id}, err);
          return next(err);
        }
        log.debug('Job find success', {id: req.params.id, job: job});
        res.send(job.getData());
        return next();
      });
    });

    server.post('/job/:id/kill', function killJobById(req, res, next) {
      log.debug('Job kill', {id: req.params.id});
      self.pulsar.getJob(req.params.id, function(err, job) {
        if (err) {
          log.error('Job kill failed', {id: req.params.id}, err);
          return next(err);
        }
        job.kill();
        res.send(200);
        return next();
      });
    });

    server.get('/jobs', function getCurrentJobs(req, res, next) {
      self.pulsar.getJobList(function(err, jobList) {
        if (err) {
          log.error('Current Jobs get failed', err);
          return next(err);
        }
        jobList = _.map(jobList, function(job) {
          return job.getData();
        });
        res.send(jobList);
        return next();
      });
    });

    server.get('/:app/:env/tasks', function getAvailableTasks(req, res, next) {
      self.pulsar.getAvailableTasks(req.params.app, req.params.env, function(err, tasks) {
        if (err) {
          log.error('Available Cap tasks get failed', {params: req.params}, err);
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
