var crypto = require('crypto');
var _ = require('underscore');

function TokenContainer() {
  this._tokens = {};
  this._startGarbageCollecting();
}

TokenContainer._hourMs = 60 * 60 * 1000;
TokenContainer._collectorIntervalMs = 12 * TokenContainer._hourMs;
TokenContainer.__oudatedTimeMs = 48 * TokenContainer._hourMs;

TokenContainer.prototype.saveToken = function(res, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._tokens[cookie] = {token: token, lastUsage: Date.now()};
  res.setCookie('userid', cookie, {path: '/', secure: true});
};

TokenContainer.prototype.hasToken = function(tokenKey) {
  var info = this._tokens[tokenKey];
  if (info) {
    info.lastUsage = Date.now();
  }
  return !!info;
};

TokenContainer.prototype.extractTokenKeyFromRequest = function(req) {
  return req.cookies['userid'];
};

TokenContainer.prototype._startGarbageCollecting = function() {
  setInterval(function() {
    var now = Date.now();
    _.each(this._tokens, function(info, cookie, cookies) {
      if (now - info.lastUsage > TokenContainer._oudatedTimeMs) {
        delete cookies[cookie];
      }
    });
  }.bind(this), TokenContainer._collectorIntervalMs);
};

module.exports = TokenContainer;
