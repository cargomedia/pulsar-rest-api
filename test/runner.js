var cp = require('child_process');
var path = require('path');
var walk = require('walk');
var _ = require('underscore');
var waitForPort = require('wait-for-port');

var rootDir = path.join(__dirname, '..');
var mochaBin = rootDir + '/node_modules/.bin/mocha';

var Config = require(rootDir + '/lib/config');
var testConfig = new Config(rootDir + '/test/data/configs/config.yaml').asHash();

waitForPort(testConfig.mongodb.host, testConfig.mongodb.port, function(err) {
  if (err) {
    throw new Error(err);
  }

  var exitCodes = [];
  var walker = walk.walk(__dirname + '/spec', {followLinks: false});
  walker.on('file', function(root, stat, next) {
    var filepath = root + '/' + stat.name;
    var result = cp.spawnSync(mochaBin, [filepath], {stdio: 'inherit'});
    exitCodes.push(result.status);
    next();
  });

  walker.on('end', function() {
    var hasFailures = _.some(exitCodes, function(status) {
      return status !== 0;
    });
    if (hasFailures) {
      process.exit(1);
    }
  });
});