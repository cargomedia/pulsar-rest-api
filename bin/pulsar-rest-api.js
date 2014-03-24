#!/usr/bin/env node
var pulsar = require('../pulsar-rest-api.js');
var optimist = require('optimist').default('log-dir', null);
var fs = require('fs');
var argv = optimist.argv;
var logDir = argv['log-dir'];
var configRepo = argv['config-repo'];
var configBranch = argv['config-branch'];

var sslKey = argv['ssl-key'] || './bin/ssl/*.pulsar.local.key';
var sslCert = argv['ssl-cert'] || './bin/ssl/*.pulsar.local.pem';
var sslPfx = argv['ssl-pfx'];
var sslPassphrase = argv['ssl-passphrase'];

var authUsername = argv['github-oauth-id'];
var authPassword = argv['guthub-oauth-secret'];

var mongoHost = argv['mongo-host'];
var mongoPort = argv['mongo-port'];
var mongoDb = argv['mongo-db'];

if (logDir) {
  utils.logProcessInto(process, logDir + '/pulsar-rest-api.log');
}

argv = optimist.default('port', '8001').argv;

var sslOptions = null;
if (sslKey && sslCert) {
  sslOptions = {
    key: fs.readFileSync(sslKey)
  };

  var certFile = fs.readFileSync(sslCert).toString();
  var certs = certFile.match(/(-+BEGIN CERTIFICATE-+[\s\S]+?-+END CERTIFICATE-+)/g);
  if (certs && certs.length) {
    sslOptions.cert = certs.shift();
    if (certs.length) {
      sslOptions.ca = certs;
    }
  } else {
    sslOptions.cert = certFile;
  }
}
if (sslPfx) {
  sslOptions = {
    pfx: fs.readFileSync(sslPfx)
  };
}
if (sslOptions && sslPassphrase) {
  sslOptions.passphrase = fs.readFileSync(sslPassphrase).toString().trim();
}

var authOptions = {
  username: authUsername,
  password: authPassword
};

var pulsarConfig = {
  repo: configRepo,
  branch: configBranch
};

var mongoConfig = {
  host: mongoHost,
  port: mongoPort,
  db: mongoDb
};

pulsarServer = new pulsar.Server(argv['port'], sslOptions, authOptions, pulsarConfig, mongoConfig);
