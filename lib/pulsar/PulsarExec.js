var _ = require('underscore');
var spawn = require('child_process').spawn;

module.exports = (function() {

  /**
   *
   * @param {Object} args
   * @param {Object|Array} args.params params of cmd to pulsar exec.
   * If it's Object then it'll be transformed to Array that contains only values of Object.
   * @param {Object} [args.options] options of cmd to pulsar exec.
   * If it's omitted then instance will be created with args.params === args and args.options = {}.
   * @constructor
   */
  function PulsarExec(args) {
    if (args.params) {
      this._args = args;
    } else {
      this._args = {params: args, options: {}};
    }
    if (!_.isArray(this._args.params)) {
      this._args.params = _.values(this._args.params);
    }
  }

  PulsarExec.prototype.setOption = function(key, value) {
    this._args.options[key] = value;
  };

  PulsarExec.prototype.getArgs = function() {
    return this._args;
  };

  PulsarExec.prototype.run = function() {
    var args = _.clone(this._args.params);
    if (this._args.options) {
      _.each(this._args.options, function(value, key) {
        args.unshift(value);
        args.unshift(key);
      });
    }
    return spawn('pulsar', args);
  };

  PulsarExec.prototype.toString = function() {
    var str = this._args.params.join(' ');
    if (this._args.options) {
      str += ' ' + _.map(this._args.options,function(value, key) {
        return key + ' ' + value;
      }).join(' ');
    }
    return 'pulsar ' + str;
  };

  return PulsarExec;
}());
