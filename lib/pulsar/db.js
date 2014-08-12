var MongoClient = require('mongodb');
var PulsarTask = require('./task');

module.exports = (function() {

  var PulsarDB = function(config, callback) {
    this.connect(config.host, config.port, config.db, 'tasks', callback);
  };

  PulsarDB.prototype.getUniqueTaskID = function() {
    return MongoClient.ObjectID().toString();
  };

  PulsarDB.prototype.saveTask = function(task, callback) {
    task.id = this.getUniqueTaskID();
    this.collection.insert({_id: task.id, data: task.getData(), args: task.getArgs()}, {safe: true}, function(err) {
      callback(err);
    });
  };

  PulsarDB.prototype.updateTask = function(task, callback) {
    this.collection.update({_id: task.id}, {$set: {data: task.getData()}}, {safe: true}, function(err) {
      callback(err);
    });
  };

  PulsarDB.prototype.getTask = function(taskId, callback) {
    this.collection.findOne({_id: taskId}, function(err, result) {
      var task;
      if (!err) {
        task = new PulsarTask(result.args, result.data);
      }
      callback(err, task);
    });
  };

  PulsarDB.prototype.getTaskList = function(callback) {
    this.collection.find().toArray(function(err, resultList) {
      if (!err) {
        resultList = _.map(resultList, function(result) {
          return new PulsarTask(result.args, result.data);
        });
      }
      callback(err, resultList);
    });
  };

  PulsarDB.prototype.connect = function(host, port, db, collection, callback) {
    var url = 'mongodb://' + host + ':' + port + '/' + db;

    this.client = MongoClient.connect(url, function(err, db) {
      if (err) {
        callback(err);
      }
      this.db = db;
      this.collection = db.collection(collection);
      callback(null, this);
    }.bind(this));
  };

  return PulsarDB;

})();
