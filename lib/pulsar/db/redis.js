var redis = require('redis');

module.exports = (function() {

    var PulsarRedisDB = function(host, port) {
        this.host = host;
        this.port = port;
    }

    PulsarRedisDB.DATABASE_KEYS_INDEX = 'PULSAR-REST-API-INDEX';
    PulsarRedisDB.DATABASE_KEY_PREFIX = 'PULSAR-REST-API-TASK';

    PulsarRedisDB.prototype.getUniqueTaskID = function() {
        return Math.round(100 * Math.random());
    }

    PulsarRedisDB.prototype._connect = function(host, port) {
        this.db = redis.createClient(port, host, {retry_max_delay: 60000});

        this.db.on("connect", function() {
            console.log("Connect to redis server `" + host + "`: " + msg);
        });

        this.db.on("error", function(msg) {
            console.log("Cannot connect to redis server `" + host + "`: " + msg);
        });
    }

    PulsarRedisDB.prototype._insert = function(id, data) {
        var key = PulsarRedisDB.DATABASE_KEY_PREFIX + id;
        this.db.set(key, data);
        this.db.sadd(PulsarRedisDB.DATABASE_KEYS_INDEX, key);
    }

    PulsarRedisDB.prototype._select = function(id, callback) {
        this.db.get(PulsarRedisDB.DATABASE_KEY_PREFIX + id, callback);
    }

    PulsarRedisDB.prototype._delete = function() {
        var key = PulsarRedisDB.DATABASE_KEY_PREFIX + id;
        this.db.del(key);
        this.db.srem(PulsarRedisDB.DATABASE_KEYS_INDEX, key);
    }

    PulsarRedisDB.prototype._update = function(id, data) {
        this.db.set(PulsarRedisDB.DATABASE_KEY_PREFIX + id, data);
    }

    PulsarRedisDB.prototype._select_keys = function(callback) {
        this.db.smembers(PulsarRedisDB.DATABASE_KEYS_INDEX, callback);
    }

    return PulsarRedisDB;

})();