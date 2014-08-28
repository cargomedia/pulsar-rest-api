var crypto = require('crypto');

function CookieAuth() {
  //yes yes, server restart will drop all the cookies.
  this._cookies = {};
}

CookieAuth.prototype.setCookie = function(res, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._cookies[cookie] = token;
  res.setCookie('who-is-me', cookie, {path: '/', secure: true});
};

CookieAuth.prototype.hasCookie = function(cookie) {
  return !!this._cookies[cookie];
};

CookieAuth.prototype.reqHasCookie = function(req) {
  var cookie = req.cookies['who-is-me'];
  return this.hasCookie(cookie);
};

module.exports = CookieAuth;
