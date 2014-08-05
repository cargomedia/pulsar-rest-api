var MongoClient = require('mongodb');

module.exports = (function() {

  var PulsarDB = function(config) {
    this.connect(config.host, config.port, config.db, 'tasks');
  };

  PulsarDB.prototype.getUniqueTaskID = function() {
    return MongoClient.ObjectID().toString();
  };

  PulsarDB.prototype.saveTask = function(task, callback) {
    this.collection.insert({_id: task.id, data: task.getData()}, function(err, focs) {
      callback(task);
    });
  };

  PulsarDB.prototype.updateTask = function(task, callback) {
    this.collection.update({_id: task.id}, {$set: {data: task.getData()}}, {safe: true}, function(err, focs) {
      callback(task);
    });
  };

  PulsarDB.prototype.getTask = function(taskId, callback) {
    this.collection.findOne({_id: taskId}, function(err, results) {
      callback(err, results);
    });
  };

  PulsarDB.prototype.getTaskList = function(callback) {
    this.collection.find().toArray(function(err, results) {
      callback(err, results);
    });
  };

  PulsarDB.prototype.connect = function(host, port, db, collection) {
    var self = this;
    var url = 'mongodb://' + host + ':' + port + '/' + db;

    this.client = MongoClient.connect(url, function(err, db) {
      if (err) {
        throw err;
      }
      self.db = db;
      self.collection = db.collection(collection);
    });

  };

  return PulsarDB;

})();
