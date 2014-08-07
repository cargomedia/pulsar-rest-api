var _ = require('underscore');
var shellwords = require('shellwords');
var spawn = require('child_process').spawn;

module.exports = (function() {

  /**
   *
   * @param {Object} args
   * @param {String} args.app
   * @param {String} args.env
   * @param {String} [args.action]
   * @param {Array} [args.pulsarOptions]
   * @param {Array} [args.capistranoOptions]
   * @constructor
   */
  function PulsarExec(args) {
    var defaults = {
      action: null,
      pulsarOptions: [],
      capistranoOptions: []
    };
    args = _.defaults(args, defaults);
    PulsarExec.validate(args);
    this._args = args;
    this._args.pulsarOptions = this._optionsToSpawnFormat(this._args.pulsarOptions);
    this._args.capistranoOptions = this._optionsToSpawnFormat(this._args.capistranoOptions);
  }

  PulsarExec.prototype._optionsToSpawnFormat = function(options){
    var formattedOpts = [];
    _.each(options, function(opt) {
      formattedOpts = formattedOpts.concat(shellwords.split(opt));
    });
    return formattedOpts;
  };

  PulsarExec.validate = function(args) {
    var errors = [];
    PulsarExec._validateRequired(args.app, 'app', errors);
    PulsarExec._validateRequired(args.env, 'env', errors);
    PulsarExec._validatePulsarOptions(args.pulsarOptions, errors);
    if (errors.length) {
      throw new Error(errors.join('; '));
    }
  };

  PulsarExec._validateRequired = function(field, fieldName, errors) {
    if (!field || !_.isString(field) || !field.trim()) {
      errors.push('[' + fieldName + '] param must be not empty string to create Pulsar Command');
    }
  };

  PulsarExec._validatePulsarOptions = function(pulsarOptions, errors) {
    for (var i = pulsarOptions.length - 1; i >= 0; i--) {
      try {
        var opt = shellwords.split(pulsarOptions[i]);
        if (opt.length > 2) {
          errors.push('Pulsar option [' + pulsarOptions[i] + '] can\'t have more than two(2) parts');
        }
        if (opt[0].charAt(0) !== '-') {
          errors.push('Pulsar option [' + pulsarOptions[i] + '] must have dash(-) or double-dash(--) prefix.');
        }
      } catch (err) {
        errors.push(pulsarOptions[i] + ' has error: ' + err.message);
      }
    }
  };

  PulsarExec.prototype.setPulsarOption = function(key, value) {
    this._args.pulsarOptions.push(key);
    this._args.pulsarOptions.push(value);
  };

  PulsarExec.prototype.getArgs = function() {
    return this._args;
  };

  PulsarExec.prototype.getCommandArgs = function() {
    var args = [];
    args = args.concat(this._args.pulsarOptions, [this._args.app, this._args.env, this._args.action], this._args.capistranoOptions);
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
