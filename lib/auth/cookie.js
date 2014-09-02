var crypto = require('crypto');
var _ = require('underscore');

function CookieAuth() {
  this._cookies = {};
  this._startGarbageCollecting();
}

CookieAuth._hourMs = 60 * 60 * 1000;
CookieAuth._collectorIntervalMs = 12 * CookieAuth._hourMs;
CookieAuth.__oudatedTimeMs = 48 * CookieAuth._hourMs;

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
  setInterval(function() {
    var now = Date.now();
    _.each(this._cookies, function(info, cookie, cookies) {
      if (now - info.lastUsage > CookieAuth._oudatedTimeMs) {
        delete cookies[cookie];
      }
    });
  }.bind(this), CookieAuth._collectorIntervalMs);
};

module.exports = CookieAuth;
