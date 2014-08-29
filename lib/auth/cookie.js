var crypto = require('crypto');
var _ = require('underscore');

function CookieAuth() {
  this._cookies = {};
  this._collectorIntervalMs = 12 * 60 * 60 * 1000;//12 hours
  this._oudatedTimeMs = 48 * 60 * 60 * 1000;//48 hours
}

CookieAuth.prototype.setCookie = function(res, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._cookies[cookie] = {token: token, lastUsage: Date.now()};
  res.setCookie('who-is-me', cookie, {path: '/', secure: true});
  if (!this._isGarbageCollecting()) {
    this._startGarbageCollecting();
  }
};

CookieAuth.prototype.hasCookie = function(cookie) {
  var info = this._cookies[cookie];
  if (info) {
    info.lastUsage = Date.now();
  }
  return !!info;
};

CookieAuth.prototype.reqHasCookie = function(req) {
  var cookie = req.cookies['who-is-me'];
  return this.hasCookie(cookie);
};

CookieAuth.prototype._isGarbageCollecting = function() {
  return !!this._collector;
};

CookieAuth.prototype._startGarbageCollecting = function() {
  this._collector = setInterval(function() {
    var now = Date.now();
    _.each(this._cookies, function(info, cookie, cookies) {
      if (now - info.lastUsage > this._oudatedTimeMs) {
        delete cookies[cookie];
      }
    }.bind(this));
    if (_.isEmpty(this._cookies)) {
      this._stopGarbageCollecting();
    }
  }.bind(this), this._collectorIntervalMs);
};

CookieAuth.prototype._stopGarbageCollecting = function() {
  clearInterval(this._collector);
  this._collector = null;
};

module.exports = CookieAuth;
