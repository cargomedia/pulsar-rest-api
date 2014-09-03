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

  PulsarWebSocket.prototype.authenticate = function(messageText, connection) {
    var message = JSON.parse(messageText);
    this._isAuthenticatedMessage(message, function(err) {
      if (err) {
        connection.close(403, 'Access denied');
        return;
      }
      this.connections[connection.id] = connection;
      connection.removeAllListeners('data');
    }.bind(this));
  };

  PulsarWebSocket.prototype._isAuthenticatedMessage = function(message, callback) {
    if (message.token) {
      return this._auth.isValidToken(message.token, callback);
    } else {
      callback(!message.cookie || !this._auth.hasToken(message.cookie));
    }
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
