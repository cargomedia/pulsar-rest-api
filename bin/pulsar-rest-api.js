#!/usr/bin/env node
var Config = require('../lib/config');
var pulsar = require('../pulsar-rest-api.js');

var config = new Config(__dirname + '/config.yaml');
setLog(config.asHash());
pulsarServer = new pulsar.Server(config.asHash());

function setLog(config){
  var log = config.log;
  if (log && log.dir && log.name) {
    utils.logProcessInto(process, log.dir + '/' + log.name);
  }
}
