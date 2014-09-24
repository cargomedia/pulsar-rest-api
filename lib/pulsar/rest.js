var _ = require('underscore');
var log = require('../logger');

module.exports = (function() {

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

    server.post('/:app/:env', function createJob(req, res, next) {
      var params = _.extend({}, req.params, req.query, req.body);
      var wait = !!params.wait;
      log.debug('Job create', {params: params});
      self.pulsar.createJob(params.app, params.env, params.task, params.taskVariables, function(err, job) {
        if (err) {
          log.error('Job create failed', {params: params}, err);
          return next(err);
        }
        log.debug('Job create success', {params: params, job: job});
        var response = {
          id: job.id,
          url: req.protocol + '://' + req.headers.host + '/web/?job=' + job.id
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
        return res.send(job.getData());
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
        return res.send(200);
      });
    });

    server.get('/jobs', function getJobList(req, res, next) {
      self.pulsar.getJobList(function(err, jobList) {
        if (err) {
          log.error('JobList get failed', err);
          return next(err);
        }
        jobList = _.map(jobList, function(job) {
          return job.getData();
        });
        return res.send(jobList);
      });
    });

    server.get('/:app/:env/tasks', function getAvailableTasks(req, res, next) {
      self.pulsar.getAvailableTasks(req.params.app, req.params.env, function(err, tasks) {
        if (err) {
          log.error('Available Cap tasks get failed', {params: req.params}, err);
          return next(err);
        }
        return res.send(tasks);
      });
    });

    return server;

  };

  return PulsarREST;

})();
