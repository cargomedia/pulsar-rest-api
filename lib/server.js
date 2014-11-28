require('./errors');
var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarWebsocket = require('./pulsar/websocket');
var PulsarDB = require('./pulsar/db');
var Auth = require('./auth');
var fs = require('fs');
var express = require('express');
var Cookies = require('cookies');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var logger = require('./logger');
var log = logger.getLog();

module.exports = (function() {

  /**
   * @param {Object} config {@link '../bin/config.yaml'}
   * @constructor
   */
  function Server(config) {
    function init(err, db) {
      if (err) {
        throw err;
      }
      logger.createLog(config);
      var pulsar = new Pulsar(db, config.pulsar);
      var auth = config.auth ? new Auth(config.auth) : null;
      var rest = new PulsarREST(pulsar);
      var websocket = new PulsarWebsocket(pulsar, auth);
      var app = express();
      var router = express.Router();
      var server = this.createServer(app, config.ssl);

      //order of below lines is very important! don't mess with it.
      this.installHandlers(app, auth);
      app.use(router);
      rest.installHandlers(router);
      websocket.installHandlers(server);
      this.installErrorHandler(app);

      server.listen(config.port);
      log.info('Pulsar API is ready and listening on port ' + config.port);
      log.debug('With config', config);
    }

    new PulsarDB(config.mongodb, init.bind(this));
  }

  /**
   * Install main handlers that required by every other later installed handler.
   * @param {Object} app
   * @param {Object} [auth]
   */
  Server.prototype.installHandlers = function(app, auth) {
    if (auth) {
      app.use(Cookies.express());
      app.use(auth.getHandler());
    }

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app.use('/web', express.static('public', {
      etag: false
    }));
    app.get('/', function(req, res) {
      res.redirect('/web')
    });
  };

  Server.prototype.createServer = function(app, sslOptions) {
    if (sslOptions) {
      return https.createServer({
        key: sslOptions['key'],
        cert: sslOptions['cert']
      }, app);
    } else {
      return http.createServer(app);
    }
  };


  Server.prototype.installErrorHandler = function(app) {
    //IMPORTANT! Do not remove unused `next`.
    app.use(function(err, req, res, next) {
      log.error('Request', {
        url: req.url,
        params: req.params
      }, 'caught exception', err);
      if (err instanceof ValidationError) {
        res.status(err.statusCode).send({error: err.message});
      } else {
        res.status(500).send({error: 'unexpected error'});
      }
    });

    process.on('uncaughtException', function(err) {
      log.error('Fatal error: ', err);
      process.nextTick(process.exit(1));
    });
  };

  return Server;
})();
