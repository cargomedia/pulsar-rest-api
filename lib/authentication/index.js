var GithubHelper = require('./github-helper');
var UserContainer = require('./user-container');
var Cookies = require('cookies');
var Authorization = require('./authorization');

/**
 * @param {Object} config
 */
function Authentication(config) {
  this._userContainer = new UserContainer();
  this._githubHelper = new GithubHelper(config, this._userContainer);
  this.authorization = config.authorization ? new Authorization(config.authorization) : null;
}

/**
 * @param {String} cookie
 * @returns {Boolean}
 */
Authentication.prototype.isValidCookie = function(cookie) {
  return this._userContainer.hasUserByCookie(cookie);
};

/**
 * @callback Authentication~isValidTokenCallback
 * @param {Error} error
 */
/**
 * @param {String} token
 * @param {Authentication~isValidTokenCallback} callback
 */
Authentication.prototype.isValidToken = function(token, callback) {
  if (this._userContainer.hasUserByToken(token)) {
    return callback(null);
  }
  return this._githubHelper.verifyUser(token, callback);
};


/**
 * @callback Authentication~Restrictions
 * @param {Object} authorization - authorization module.
 */
/**
 *
 * @param {Object} app - express app.
 * @param {Authentication~Restrictions} restrictions
 */
Authentication.prototype.installHandlers = function(app, restrictions) {
  app.use(Cookies.express());
  app.use(this._getHandler());
  if (this.authorization) {
    this.authorization.installHandlers(app);
    if (restrictions) {
      restrictions(this.authorization);
    }
  }
};

Authentication.prototype._getHandler = function() {
  return function(req, res, next) {
    var url = require('url').parse(req.url, true);

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
