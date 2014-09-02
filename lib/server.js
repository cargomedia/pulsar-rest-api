require('./errors');
var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarWebsocket = require('./pulsar/websocket');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');
var fs = require('fs');
var Restify = require('restify');
var CookieParser = require('restify-cookies');
var log = require('./logger');

module.exports = (function() {

  /**
   * @param {Object} config {@link '../bin/config.yaml'}
   * @constructor
   */
  function Server(config) {
    new PulsarDB(config.mongodb, function(err, db) {
      if (err) {
        throw err;
      }
      var pulsar = new Pulsar(db, config.pulsar);
      var auth;
      if (config.auth) {
        auth = new Auth(config.auth);
      }
      var rest = new PulsarREST(pulsar);
      var websocket = new PulsarWebsocket(pulsar, auth);

      this.server = this.createRestify(config.ssl, auth);
      rest.installHandlers(this.server);
      websocket.installHandlers(this.server.server);
      this.installStatic(this.server);

      this.server.listen(config.port);
      log.info('Pulsar API is ready and listening on port ' + config.port);
      log.debug('With config', config);
    }.bind(this));
  }

  Server.prototype.createRestify = function(sslOptions, auth) {
    var server = Restify.createServer({
      certificate: sslOptions ? sslOptions['cert'] : null,
      key: sslOptions ? sslOptions['key'] : null,
      name: 'pulsar-rest-api',
      debug: true,
      version: '1.0.0'
    });

    server.formatters['text/html'] = server.formatters['text/plain'];

    server.use(function(req, res, next) {
      res.redirect = function(url) {
        res.header('location', url);
        res.send(302);
      };
      return next();
    });

    if (auth) {
      server.use(CookieParser.parse);
      server.use(Restify.authorizationParser());
      server.use(auth.getHandler());
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
