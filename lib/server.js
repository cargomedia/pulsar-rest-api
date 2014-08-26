require('./errors');
var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarWebsocket = require('./pulsar/websocket');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');
var fs = require('fs');
var Restify = require('restify');
var log = require('./logger');

module.exports = (function() {

  /**
   * @param {Object} config {@link '../bin/config.yaml'}
   * @constructor
   */
  function Server(config) {
    log.info('Database connecting');
    new PulsarDB(config.mongodb, function(err, db) {
      if (err) {
        throw err;
      }
      log.info('Database connecting success');
      var pulsar = new Pulsar(db, config.pulsar);
      var rest = new PulsarREST(pulsar);
      var websocket = new PulsarWebsocket(pulsar);
      var auth = new Auth(config.auth);

      this.server = this.createRestify(config.ssl || {}, auth.getParser());
      rest.installHandlers(this.server);
      log.info('Rest server installed');
      websocket.installHandlers(this.server.server);
      log.info('Websocket server installed');
      this.installStatic(this.server);
      log.info('Web client installed');

      this.server.listen(config.port);
      log.info('Pulsar API is ready and listening on port ' + config.port);
    }.bind(this));
  }

  Server.prototype.createRestify = function(sslOptions, authorisationCallback) {
    var server = Restify.createServer({
      certificate: sslOptions ? sslOptions['cert'] : null,
      key: sslOptions ? sslOptions['key'] : null,
      name: 'pulsar-rest-api',
      debug: true,
      version: '1.0.0'
    });

    server.formatters['text/html'] = server.formatters['text/plain'];

    if (authorisationCallback) {
      server.use(authorisationCallback);
    }

    server.use(Restify.acceptParser(server.acceptable));
    server.use(Restify.queryParser());
    server.use(Restify.bodyParser());
    return server;
  };

  Server.prototype.installStatic = function(server) {
    server.get(/^\/web\/assets\/?.*/, Restify.serveStatic({
      directory: './public/assets'
    }));

    server.get(/^\/web\/app\/?.*/, Restify.serveStatic({
      directory: './public/app'
    }));

    server.get('/web.*', function(req, res) {
      var html = fs.readFileSync('public/index.html').toString();
      res.setHeader('Content-type', 'text/html');
      res.send(html);
    });
  };

  return Server;
})();
