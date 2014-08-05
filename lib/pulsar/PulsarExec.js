var _ = require('underscore');
var spawn = require('child_process').spawn;

module.exports = (function() {

  /**
   *
   * @param {Object} args
   * @param {String} args.app
   * @param {String} args.env
   * @param {String} [args.action]
   * @param {Object} args.pulsarOptions
   * @param {Object} args.capistranoOptions
   * @constructor
   */
  function PulsarExec(args) {
    var defaults = {
      action: null,
      pulsarOptions: {},
      capistranoOptions: {}
    };
    this._args = _.defaults(args, defaults);
  }

  PulsarExec.prototype.setPulsarOption = function(key, value) {
    this._args.pulsarOptions[key] = value;
  };

  PulsarExec.prototype.getArgs = function() {
    return this._args;
  };

  PulsarExec.prototype.getCommandArgs = function() {
    var args = [];
    var parseArgument = function(value, key) {
      args.push(key);
      args.push(value);
    };

    _.each(this._args.pulsarOptions, parseArgument);
    args = args.concat([this._args.app, this._args.env, this._args.action]);
    _.each(this._args.capistranoOptions, parseArgument);

    return _.without(args, null);
  };

  PulsarExec.prototype.run = function() {
    return spawn('pulsar', this.getCommandArgs());
  };

  PulsarExec.prototype.toString = function() {
    return 'pulsar ' + this.getCommandArgs().join(' ');
  };

  return PulsarExec;
}());
