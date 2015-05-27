var cp = require('child_process');
var join = require('path').join;
var walk = require('walk');
var mochaBin = join(__dirname, '..', 'node_modules', '.bin', 'mocha');
var _ = require('underscore');

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
