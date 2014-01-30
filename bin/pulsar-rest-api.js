#!/usr/bin/env node
var pulsar = require('../pulsar-rest-api.js');
var optimist = require('optimist').default('log-dir', null);
var fs = require('fs');
var argv = optimist.argv;
var logDir = argv['log-dir'];
var configRepo = argv['config-repo'] || null;
var configBranch = argv['config-branch'] || 'master';

var sslKey = argv['ssl-key'] || './bin/ssl/*.pulsar.local.key';
var sslCert = argv['ssl-cert'] || './bin/ssl/*.pulsar.local.pem';
var sslPfx = argv['ssl-pfx'];
var sslPassphrase = argv['ssl-passphrase'];

var authUsername = argv['auth-username'] || null;
var authPassword = argv['auth-password'] || null;
var authProvider = argv['auth-provider'] || 'github';
var authMethod = argv['auth-method'] || 'user';


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
    password: authPassword,
    provider: authProvider,
    method: authMethod
}

var pulsarConfig = {
    repo: configRepo,
    branch: configBranch
}

if(configRepo) {
    pulsarServer = new pulsar.Server(
        argv['port'],
        sslOptions,
        authOptions,
        pulsarConfig
    );
} else {
    throw new Error("Parameter --config-repo must be set!");
}