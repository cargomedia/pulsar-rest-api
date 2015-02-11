var _ = require('underscore');
var sockjs = require('sockjs');

module.exports = (function() {

  /**
   * @param {Object} pulsar
   * @param {Object} authentication
   * @constructor
   */
  function PulsarWebSocket(pulsar, authentication) {
    this._authentication = authentication;
    this.pulsar = pulsar;
    this.connections = {};
  }

  PulsarWebSocket.prototype.broadcast = function(message) {
    _(this.connections).forEach(function(connection) {
      connection.write(message);
    });
  };

  PulsarWebSocket.prototype.saveConnection = function(connection) {
    this.connections[connection.id] = connection;
  };

  PulsarWebSocket.prototype.deleteConnection = function(connection) {
    delete this.connections[connection.id];
  };

  PulsarWebSocket.prototype.authenticate = function(messageText, connection) {
    var message = JSON.parse(messageText);
    this._isAuthenticatedMessage(message, function(err) {
      if (err) {
        connection.close(403, 'Access denied');
        return;
      }
      this.saveConnection(connection);
      connection.removeAllListeners('data');
    }.bind(this));
  };

  PulsarWebSocket.prototype._isAuthenticatedMessage = function(message, callback) {
    if (message.token) {
      return this._authentication.isValidToken(message.token, callback);
    } else {
      callback(!message.cookie || !this._authentication.isValidCookie(message.cookie));
    }
  };

  /**
   * @param {Object} server
   */
  PulsarWebSocket.prototype.installHandlers = function(server) {
    var self = this;

    this.pulsar.on('create', function(job) {

      self.broadcast(JSON.stringify({
        'event': 'job.create',
        'job': job.getData()
      }));

      job.on('change', function() {
        self.broadcast(JSON.stringify({
          'event': 'job.change',
          'job': job.getData()
        }));
      });
      job.on('close', function() {
        self.broadcast(JSON.stringify({
          'event': 'job.close',
          'job': job.getData()
        }));
      });
    });

    var sockjsServer = sockjs.createServer();
    sockjsServer.on('connection', function(connection) {
      if (self._authentication) {
        connection.on('data', function(message) {
          self.authenticate(message, connection)
        });
      } else {
        self.saveConnection(connection);
      }
      connection.on('close', function() {
        self.deleteConnection(connection);
      });
    });

    sockjsServer.installHandlers(server, {prefix: '/websocket'});
  };

  return PulsarWebSocket;

})();
