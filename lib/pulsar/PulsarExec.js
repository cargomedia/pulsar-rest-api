module.exports = (function() {

  var spawn = require('child_process').spawn;

  var PulsarExec = {};

  PulsarExec.run = function(args) {
    return spawn('pulsar', args);
  };

  return PulsarExec;

})();
