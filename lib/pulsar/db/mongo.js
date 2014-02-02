var redis = require('mongodb');

module.exports = (function() {

    var PulsarMongoDB = function(host, port) {
        this.host = host;
        this.port = port;
    }

    PulsarMongoDB.DATABASE_NAME = 'pulsar';
    PulsarMongoDB.COLLECTION_NAME = 'tasks';

    PulsarMongoDB.prototype.getUniqueTaskID = function() {
        return Math.round(100 * Math.random());
    }

    PulsarMongoDB.prototype.connect = function() {
        var self = this;
        var url = 'mongodb://' + this.host + ':' + this.port + '/' + PulsarRedisDB.DATABASE_NAME;

        this.db = MongoClient.connect(url, function(err, db) {
            if(err) throw err;
            self.collection = self.db.collection(PulsarRedisDB.COLLECTION_NAME);
        });
    }

    PulsarMongoDB.prototype.insert = function(id, data) {
    }

    PulsarMongoDB.prototype.select = function(id, callback) {
    }

    PulsarMongoDB.prototype.delete = function() {
    }

    PulsarMongoDB.prototype.update = function(id, data) {
    }

    return PulsarMongoDB;

})();