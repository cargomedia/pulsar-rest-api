var MongoClient = require('mongodb');
var PulsarJob = require('./job');
var _ = require('underscore');

module.exports = (function() {

  var PulsarDB = function(config, callback) {
    this.connect(config.host, config.port, config.db, 'jobs', callback);
  };

  PulsarDB.prototype.getUniqueJobID = function() {
    return MongoClient.ObjectID().toString();
  };

  /**
   * @callback PulsarDB~saveJobCallback
   * @param {Error} error
   */
  /**
   * @param {PulsarJob} job
   * @param {PulsarDB~saveJobCallback} callback
   */
  PulsarDB.prototype.saveJob = function(job, callback) {
    job.id = this.getUniqueJobID();
    this.collection.insert({_id: job.id, data: job.getData()}, {safe: true}, function(err) {
      return callback(err);
    });
  };

  /**
   * @param {PulsarJob} job
   * @param {PulsarDB~saveJobCallback} callback
   */
  PulsarDB.prototype.updateJob = function(job, callback) {
    this.collection.update({_id: job.id}, {$set: {data: job.getData()}}, {safe: true}, function(err) {
      return callback(err);
    });
  };

  /**
   * @callback PulsarDB~getJobCallback
   * @param {Error} error
   * @param {PulsarJob} job
   */
  /**
   * @param {String} jobId
   * @param {PulsarDB~getJobCallback} callback
   */
  PulsarDB.prototype.getJob = function(jobId, callback) {
    this.collection.findOne({_id: jobId}, function(err, result) {
      if (err) {
        return callback(err);
      }
      if (!result) {
        return callback(new ValidationError('Invalid job'));
      }
      var job = new PulsarJob(null, result.data);
      return callback(null, job);
    });
  };

  /**
   * @callback PulsarDB~getJobListCallback
   * @param {Error} error
   * @param {PulsarJob[]} jobs
   */
  /**
   * @param {PulsarDB~getJobListCallback} callback
   * @param {Number} [currentPage]
   * @param {Number} [pageSize]
   */
  PulsarDB.prototype.getJobList = function(callback, currentPage, pageSize) {
    this.collection
      .find({}, {"sort": [['data.timestamp', 'desc']]})
      .skip(currentPage * pageSize)
      .limit(pageSize || 0)
      .toArray(function(err, resultList) {
        if (!err) {
          resultList = _.map(resultList, function(result) {
            return new PulsarJob(null, result.data);
          });
        }
        return callback(err, resultList);
      });
  };

  PulsarDB.prototype.connect = function(host, port, db, collection, callback) {
    var url = 'mongodb://' + host + ':' + port + '/' + db;

    this.client = MongoClient.connect(url, function(err, db) {
      if (err) {
        return callback(err);
      }
      this.db = db;
      this.collection = db.collection(collection);
      return callback(null, this);
    }.bind(this));
  };

  return PulsarDB;

})();
