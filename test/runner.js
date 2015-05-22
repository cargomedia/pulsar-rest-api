var cp = require('child_process');
var join = require('path').join;
var walk = require('walk');
var mochaBin = join(__dirname, '..', 'node_modules', '.bin', 'mocha');
var _ = require('underscore');

var statusList = [];
var walker = walk.walk(__dirname + '/spec', {followLinks: false});
walker.on('file', function(root, stat, next) {
  var filepath = root + '/' + stat.name;
  var result = cp.spawnSync(mochaBin, [filepath], {stdio: 'inherit'});
  statusList.push(result.status);
  next();
});
walker.on('end', function() {
  console.log(statusList);
  if (!_.every(statusList, 0)) {
    process.exit(1);
  }
});
