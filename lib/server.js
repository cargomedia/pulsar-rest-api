require('./errors');
var Pulsar = require('./pulsar');
var PulsarREST = require('./pulsar/rest');
var PulsarWebsocket = require('./pulsar/websocket');
var PulsarDB = require('./pulsar/db');
var Authentication = require('./authentication');
var fs = require('fs');
var express = require('express');
var Cookies = require('cookies');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var logger = require('./logger');
var getLog = logger.getLog;

module.exports = (function() {

  /**
   * @param {Config} config {@link '../bin/config.yaml'}
   * @constructor
   */
  function Server(config) {
    var configHash = config.asHash();
    function init(err, db) {
      if (err) {
        throw err;
      }
      logger.configure(configHash);
      var pulsar = new Pulsar(db, configHash.pulsar);
      var authentication = configHash.authentication ? new Authentication(configHash.authentication) : null;
      var rest = new PulsarREST(pulsar);
      var websocket = new PulsarWebsocket(pulsar, authentication);
      var app = express();
      var router = express.Router();
      var server = this.createServer(app, configHash.ssl);

      //order of below lines is very important! don't mess with it.
      this.installHandlers(app, authentication);
      app.use(router);
      rest.installHandlers(router);
      websocket.installHandlers(server);
      this.installErrorHandler(app);

      server.listen(configHash.port);
      getLog().info('Pulsar API is ready and listening on port ' + configHash.port);
      getLog().debug('With config', configHash);
    }

    new PulsarDB(configHash.mongodb, init.bind(this));
  }

  /**
   * Install main handlers that required by every other later installed handler.
   * @param {Object} app
   * @param {Object} [authentication]
   */
  Server.prototype.installHandlers = function(app, authentication) {
    if (authentication) {
      app.use(Cookies.express());
      app.use(authentication.getHandler());
    }

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());


    var publicDir = __dirname + '/../public';
    app.use('/web', express.static(publicDir, {
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
      getLog().error('Request', {
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
      getLog().error('Fatal error: ', err);
      process.nextTick(process.exit(1));
    });
  };

  return Server;
})();
