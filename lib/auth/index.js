var Github = require('./github');
var CookieAuth = require('./cookie');

function Auth(config) {
  this._cookieAuth = new CookieAuth();
  this._githubAuth = new Github(config, this._cookieAuth);
}

Auth.prototype.hasCookie = function(cookie) {
  return this._cookieAuth.hasCookie(cookie);
};

Auth.prototype.isValidToken = function(token, callback) {
  this._githubAuth.checkUserMembership(token, callback);
};

Auth.prototype.getHandler = function() {
  return function(req, res, next) {
    var url = require('url').parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (this._cookieAuth.hasRequestWithCookie(req)) {
      return next();
    }

    var token;
    if (token = this._githubAuth.extractBasicToken(req)) {
      this.isValidToken(token, next);
    } else {
      if (url.pathname = this._githubAuth.callbackUrl && url.query.code && url.query.state) {
        this._githubAuth.checkUser(req, res, function(err, token) {
          if (err) {
            return next(err);
          }
          this._cookieAuth.setCookie(res, token);
          return next();
        }.bind(this));
      } else {
        this._githubAuth.authenticateUser(req, res);
      }
    }
  }.bind(this);
};

module.exports = Auth;
