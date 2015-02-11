var github = require('github');
var githubOAuth = require('github-oauth');
var auth = require('basic-auth');

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

GithubHelper.prototype.hasBasicToken = function(req) {
  var credentials = auth(req);
  return credentials && credentials.pass == 'x-oauth-basic';
};

GithubHelper.prototype.getBasicToken = function(req) {
  var credentials = auth(req);
  return credentials.name;
};

GithubHelper.prototype.authenticateWithBasicToken = function(req, res, callback) {
  this._authenticateUser(req, res, this.getBasicToken(req), callback);
};

GithubHelper.prototype.hasRequestToken = function(url) {
  return url.pathname == this.callbackUrl && url.query.code && url.query.state;
};

GithubHelper.prototype.authenticateWithRequestToken = function(req, res, next) {
  var self = this;
  this.getUserAccessToken(req, res, function(err, token) {
    if (err) {
      return next(err);
    }
    self._authenticateUser(req, res, token, next);
  });
};

GithubHelper.prototype.demandRequestToken = function(req, res) {
  this._oauth.login(req, res);
};

GithubHelper.prototype.getUserAccessToken = function(req, res, callback) {
  this._oauth.callback(req, res, function(err, tokenInfo) {
    if (err || !tokenInfo || !tokenInfo.access_token) {
      return callback(err || new Error('Authentication failed. Empty Github access tokens'));
    }
    return callback(null, tokenInfo.access_token);
  }.bind(this));
};

GithubHelper.prototype._authenticateUser = function(req, res, token, callback) {
  this.verifyUser(token, function(err, userData) {
    if (err) {
      return callback(err);
    }
    req.user = this._userContainer.saveUser(userData, token);
    res.cookies.set('userid', req.user.cookie, {path: '/', httpOnly: false});
    return callback();
  }.bind(this));
};

GithubHelper.prototype.isUserAuthenticated = function(req) {
  var cookie = req.cookies.get('userid');
  var token = this.hasBasicToken(req) ? this.getBasicToken(req) : null;
  return this._userContainer.hasUserByCookie(cookie) || this._userContainer.hasUserByToken(token);
};

/**
 * @param {Object} token
 * @param {Function} callback
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

GithubHelper.prototype.loginWithToken = function(token) {
  this._api.authenticate({
    type: "oauth",
    token: token
  });
};

GithubHelper.prototype.getUserData = function(token, callback) {
  this.loginWithToken(token);
  this._api.user.get({}, function(err, user) {
    callback(err, user);
  });
};

GithubHelper.prototype.isUserMember = function(userName, callback) {
  this._api.orgs.getMember({
    org: this.githubOrg,
    user: userName
  }, function(err, data) {
    callback(err, data);
  });
};

module.exports = GithubHelper;
