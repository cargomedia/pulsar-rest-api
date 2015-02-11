var GithubHelper = require('./github-helper');
var UserContainer = require('./user-container');
var Cookies = require('cookies');

function Authentication(config) {
  this._userContainer = new UserContainer();
  this._githubHelper = new GithubHelper(config, this._userContainer);
}

Authentication.prototype.isValidCookie = function(cookie) {
  return this._userContainer.hasUserByCookie(cookie);
};

Authentication.prototype.isValidToken = function(token, callback) {
  this._githubHelper.verifyUser(token, callback);
};

Authentication.prototype.installHandlers = function(app) {
  app.use(Cookies.express());
  app.use(this._getHandler());
};

Authentication.prototype._getHandler = function() {
  return function(req, res, next) {
    var url = require('url').parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (this._githubHelper.isUserAuthenticated(req)) {
      return next();
    }

    if (this._githubHelper.hasBasicToken(req)) {
      return this._githubHelper.authenticateWithBasicToken(req, res, next);
    }

    if (this._githubHelper.hasRequestToken(url)) {
      return this._githubHelper.authenticateWithRequestToken(req, res, next);
    }

    return this._githubHelper.demandRequestToken(req, res);
  }.bind(this);
};

module.exports = Authentication;
