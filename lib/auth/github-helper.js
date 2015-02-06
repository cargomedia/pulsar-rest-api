var github = require('github');
var githubOAuth = require('github-oauth');
var auth = require('basic-auth');

function GithubHelper(config, tokenContainer) {

  this._tokenContainer = tokenContainer;
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

GithubHelper.prototype.authenticateWithBasicToken = function(req, callback) {
  var credentials = auth(req);
  var token = credentials.name;
  this.checkUserMembership(token, callback);
};

GithubHelper.prototype.hasRequestToken = function(url) {
  return url.pathname == this.callbackUrl && url.query.code && url.query.state;
};

GithubHelper.prototype.authenticateWithRequestToken = function(req, res, next) {
  this.getUserAccessToken(req, res, function(err, token) {
    if (err) {
      return next(err);
    }
    this.checkUserMembership(token, function(err) {
      if (err) {
        return next(err);
      }
      this._tokenContainer.saveToken(res, token);
      return next();
    }.bind(this));
  }.bind(this));
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

GithubHelper.prototype.checkUserMembership = function(token, callback) {
  var self = this;
  this.getUserName(token, function(err, userName) {
    if (err) {
      return callback(err);
    }
    self.isUserMember(userName, function(err) {
      if (err) {
        return callback(err);
      }
      return callback();
    });
  });
};

GithubHelper.prototype.loginWithToken = function(token) {
  this._api.authenticate({
    type: "oauth",
    token: token
  });
};

GithubHelper.prototype.getUserName = function(token, callback) {
  this.loginWithToken(token);
  this._api.user.get({}, function(err, data) {
    callback(err, data ? data.login : data);
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
