var _ = require('underscore');
var github = require('github');
var githubOAuth = require('github-oauth');
var auth = require('basic-auth');

/**
 * @param {Object} config
 * @param {UserContainer} userContainer
 */
function GithubHelper(config, userContainer) {

  this._userContainer = userContainer;
  this.githubOrg = config.githubOrg;
  this.baseUrl = config.baseUrl;
  this.callbackUrl = '/';

  this._oauth = new githubOAuth({
    githubClient: config.githubOauthId,//process.env['GITHUB_CLIENT'],
    githubSecret: config.githubOauthSecret,//process.env['GITHUB_SECRET'],
    baseURL: config.baseUrl,
    loginURI: '/',
    callbackURI: this.callbackUrl,
    scope: 'read:org'
  });

  this._api = new github({
    version: "3.0.0",
    debug: true,
    protocol: "https",
    timeout: 5000
  });

}

/**
 * @param {Object} req
 * @returns {Boolean}
 */
GithubHelper.prototype.hasBasicToken = function(req) {
  var credentials = auth(req);
  return credentials && credentials.pass == 'x-oauth-basic';
};

/**
 * @param {Object} req
 * @returns {String}
 */
GithubHelper.prototype.getBasicToken = function(req) {
  var credentials = auth(req);
  return credentials.name;
};

/**
 * @callback GithubHelper~authenticateUserCallback
 * @param {Error} error
 */

/**
 * @param {Object} req
 * @param {Object} res
 * @param {GithubHelper~authenticateUserCallback} callback
 */
GithubHelper.prototype.authenticateWithBasicToken = function(req, res, callback) {
  var token = this.getBasicToken(req);
  if (!token || !token.trim()) {
    throw new AuthenticationError('Empty oauth basic token');
  }
  this._authenticateUser(req, res, token, callback);
};

/**
 * @param url
 * @returns {Boolean}
 */
GithubHelper.prototype.hasRequestToken = function(url) {
  return url.pathname == this.callbackUrl && url.query.code && url.query.state;
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {GithubHelper~authenticateUserCallback} next
 */
GithubHelper.prototype.authenticateWithRequestToken = function(req, res, next) {
  var self = this;
  this.getUserAccessToken(req, res, function(err, token) {
    if (err) {
      return next(err);
    }
    self._authenticateUser(req, res, token, next);
  });
};

/**
 * @param {Object} req
 * @param {Object} res
 */
GithubHelper.prototype.demandRequestToken = function(req, res) {
  this._oauth.login(req, res);
};

/**
 * @callback GithubHelper~getUserAccessTokenCallback
 * @param {Error} error
 * @param {String} accessToken
 */

/**
 * @param {Object} req
 * @param {Object} res
 * @param {GithubHelper~getUserAccessTokenCallback} callback
 */
GithubHelper.prototype.getUserAccessToken = function(req, res, callback) {
  this._oauth.callback(req, res, function(err, tokenInfo) {
    if (err || !tokenInfo || !tokenInfo.access_token) {
      return callback(err || new AuthenticationError('Authentication failed. Empty Github access tokens'));
    }
    return callback(null, tokenInfo.access_token);
  }.bind(this));
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {String} token
 * @param {GithubHelper~authenticateUserCallback} callback
 */
GithubHelper.prototype._authenticateUser = function(req, res, token, callback) {
  this.verifyUser(token, function(err, userData) {
    if (err) {
      return callback(err);
    }
    this._api.orgs.getFromUser({
      user: userData.login
    }, function(err, orgList) {
      if (err) {
        return callback(err);
      }
      var userOrgList = _.map(orgList, function(org) {
        return org.login
      });
      req.user = this._userContainer.saveUser(userData, userOrgList, token);
      res.cookies.set('userid', req.user.cookie, {path: '/', httpOnly: false});
      return callback();
    }.bind(this));
  }.bind(this));
};

/**
 * @param {Object} req
 * @returns {Boolean}
 */
GithubHelper.prototype.isUserAuthenticated = function(req) {
  var cookie = req.cookies.get('userid');
  if (this._userContainer.hasUserByCookie(cookie)) {
    req.user = this._userContainer.getUserByCookie(cookie);
    return true;
  }
  if (this.hasBasicToken(req)) {
    var token = this.getBasicToken(req);
    if (this._userContainer.hasUserByToken(token)) {
      req.user = this._userContainer.getUserByToken(token);
      return true;
    }
  }
  return false;
};

/**
 * @param {String} token
 * @param {GithubHelper~getUserDataCallback} callback
 */
GithubHelper.prototype.verifyUser = function(token, callback) {
  var self = this;
  this.getUserData(token, function(err, userData) {
    if (err) {
      return callback(err);
    }
    self.isUserMember(userData.login, function(err) {
      if (err) {
        return callback(err);
      }
      return callback(null, userData);
    });
  });
};

/**
 * @param {String} token
 */
GithubHelper.prototype.loginWithToken = function(token) {
  this._api.authenticate({
    type: "oauth",
    token: token
  });
};

/**
 * @callback GithubHelper~getUserDataCallback
 * @param {Error} error
 * @param {Object} userData
 */
/**
 * @param {Object} token
 * @param {GithubHelper~getUserDataCallback} callback
 */
GithubHelper.prototype.getUserData = function(token, callback) {
  this.loginWithToken(token);
  this._api.user.get({}, function(err, user) {
    callback(err, user);
  });
};

/**
 * @callback GithubHelper~isUserMemberCallback
 * @param {Error} error
 * @param {Object} data
 */
/**
 * @param {String} userName
 * @param {GithubHelper~isUserMemberCallback} callback
 */
GithubHelper.prototype.isUserMember = function(userName, callback) {
  this._api.orgs.getMember({
    org: this.githubOrg,
    user: userName
  }, function(err, data) {
    callback(err, data);
  });
};

module.exports = GithubHelper;
