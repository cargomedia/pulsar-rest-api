var cp = require('child_process');
var walk = require('walk');

var walker = walk.walk(__dirname + '/spec', {followLinks: false});
walker.on('file', function(root, stat, next) {

  var filepath = root + '/' + stat.name;
  cp.fork('node_modules/mocha/bin/_mocha', [filepath]);

  next();
});
