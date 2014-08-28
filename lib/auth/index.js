var Github = require('./github');
var CookieAuth = require('./cookie');

function Auth(config) {
  this._cookieAuth = new CookieAuth();
  this._githubAuth = new Github(config, this._cookieAuth);
}

Auth.prototype.hasToken = function(token) {
  return this._cookieAuth.hasCookie(token);
};

Auth.prototype.getHandler = function() {
  return function(req, res, next) {
    var url = require('url').parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (this._cookieAuth.reqHasCookie(req)) {
      return next();
    }

    var token;
    if (token = this._githubAuth.extractBasicToken(req)) {
      this._githubAuth.checkUserMembership(token, res, next);
    } else {
      if (url.pathname = this._githubAuth.callbackUrl && url.query.code && url.query.state) {
        this._githubAuth.checkUser(req, res, next);
      } else {
        this._githubAuth.authUser(req, res);
      }
    }
  }.bind(this);
};

module.exports = Auth;
