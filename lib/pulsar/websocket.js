var _ = require('underscore');
var sockjs = require('sockjs');

module.exports = (function() {

  /**
   * @param {Object} pulsar
   * @param {Object} auth
   * @constructor
   */
  function PulsarWebSocket(pulsar, auth) {
    this._auth = auth;
    this.pulsar = pulsar;
    this.connections = {};
  }

  PulsarWebSocket.prototype.broadcast = function(message) {
    _(this.connections).forEach(function(connection) {
      connection.write(message);
    });
  };

  PulsarWebSocket.prototype.authenticate = function(message, connection) {
    var token = this._extractToken(message);
    connection.removeAllListeners('data');
    if (this._hasToken(token)) {
      this.connections[connection.id] = connection;
    } else {
      connection.close(403, 'Access denied');
    }
  };

  PulsarWebSocket.prototype._extractToken = function(message) {
    return JSON.parse(message).token;
  };

  PulsarWebSocket.prototype._hasToken = function(token) {
    return this._auth.hasCookie(token);
  };

  /**
   * @param {Object} server
   */
  PulsarWebSocket.prototype.installHandlers = function(server) {
    var self = this;

    this.pulsar.on('create', function(task) {

      self.broadcast(JSON.stringify({
        'event': 'task.create',
        'task': task.getData()
      }));

      task.on('change', function() {
        self.broadcast(JSON.stringify({
          'event': 'task.change',
          'task': task.getData()
        }));
      });
    });

    var sockjsServer = sockjs.createServer();
    sockjsServer.on('connection', function(connection) {
      connection.on('data', function(message) {
        self.authenticate(message, connection)
      });
      connection.on('close', function() {
        delete self.connections[connection.id];
      });
    });

    sockjsServer.installHandlers(server, {prefix: '/websocket'});
  };

  return PulsarWebSocket;

})();
