var crypto = require('crypto');
var _ = require('underscore');

function CookieAuth() {
  this._cookies = {};
  var hourMs = 60 * 60 * 1000;
  this._collectorIntervalMs = 12 * hourMs;
  this._oudatedTimeMs = 48 * hourMs;
  this._startGarbageCollecting();
}

CookieAuth.prototype.setCookie = function(res, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._cookies[cookie] = {token: token, lastUsage: Date.now()};
  res.setCookie('userid', cookie, {path: '/', secure: true});
};

CookieAuth.prototype.hasCookie = function(cookie) {
  var info = this._cookies[cookie];
  if (info) {
    info.lastUsage = Date.now();
  }
  return !!info;
};

CookieAuth.prototype.extractCookie = function(req) {
  return req.cookies['userid'];
};

CookieAuth.prototype._startGarbageCollecting = function() {
  var self = this;
  setInterval(function() {
    var now = Date.now();
    _.each(self._cookies, function(info, cookie, cookies) {
      if (now - info.lastUsage > self._oudatedTimeMs) {
        delete cookies[cookie];
      }
    });
  }, this._collectorIntervalMs);
};

module.exports = CookieAuth;
