var GithubHelper = require('./github-helper');
var TokenContainer = require('./token-container');
var Cookies = require('cookies');

function Authentication(config) {
  this._tokenContainer = new TokenContainer();
  this._githubHelper = new GithubHelper(config, this._tokenContainer);
}

Authentication.prototype.hasToken = function(token) {
  return this._tokenContainer.hasToken(token);
};

Authentication.prototype.isValidToken = function(token, callback) {
  this._githubHelper.checkUserMembership(token, callback);
};

Authentication.prototype.isAlreadyAuthenticated = function(req) {
  var tokenKey = this._tokenContainer.extractTokenKeyFromRequest(req);
  return this._tokenContainer.hasToken(tokenKey);
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

    if (this.isAlreadyAuthenticated(req)) {
      return next();
    }

    if (this._githubHelper.hasBasicToken(req)) {
      return this._githubHelper.authenticateWithBasicToken(req, next);
    }

    if (this._githubHelper.hasRequestToken(url)) {
      return this._githubHelper.authenticateWithRequestToken(req, res, next);
    }

    return this._githubHelper.demandRequestToken(req, res);
  }.bind(this);
};

module.exports = Authentication;
