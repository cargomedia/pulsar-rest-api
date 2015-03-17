var cp = require('child_process');
var join = require('path').join;
var walk = require('walk');
var mochaBin = join(__dirname, '..', 'node_modules', '.bin', 'mocha');

var walker = walk.walk(__dirname + '/spec', {followLinks: false});
walker.on('file', function(root, stat, next) {
  var filepath = root + '/' + stat.name;
  cp.spawnSync(mochaBin, [filepath], {stdio: 'inherit'});

  next();
});
