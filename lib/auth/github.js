var github = require('github');
var githubOAuth = require('github-oauth');

function GithubHelper(config, tokenContainer) {

  this._tokenContainer = tokenContainer;
  this.githubOrg = config.githubOrg;
  this.baseUrl = config.baseUrl;
  this.callbackUrl = config.callbackUrl;

  this._oauth = new githubOAuth({
    githubClient: config.githubOauthId,//process.env['GITHUB_CLIENT'],
    githubSecret: config.githubOauthSecret,//process.env['GITHUB_SECRET'],
    baseURL: config.baseUrl,
    loginURI: '/',
    callbackURI: this.callbackUrl,
    scope: 'user'
  });

  this._api = new github({
    version: "3.0.0",
    debug: true,
    protocol: "https",
    timeout: 5000
  });

}

GithubHelper.prototype.hasBasicToken = function(req) {
  return req.authorization.scheme == 'Basic' && req.authorization.basic.password == 'x-oauth-basic';
};

GithubHelper.prototype.authenticateWithBasicToken = function(req, callback) {
  var token = req.authorization.basic.username;
  this.checkUserMembership(token, callback);
};

GithubHelper.prototype.hasRequestToken = function(url) {
  return url.pathname == this.callbackUrl && url.query.code && url.query.state;
};

GithubHelper.prototype.authenticateWithRequestToken = function(req, res, next) {
  this.doesUserGivePermission(req, res, function(err, token) {
    if (err) {
      return next(err);
    }
    this._tokenContainer.saveToken(res, token);
    return next();
  }.bind(this));
};

GithubHelper.prototype.demandRequestToken = function(req, res) {
  this._oauth.login(req, res);
};

GithubHelper.prototype.doesUserGivePermission = function(req, res, callback) {
  this._oauth.callback(req, res, function(err, token) {
    if (err || !token.access_token) {
      return callback(err || new Error('Got empty Github access tokens'));
    }
    this.checkUserMembership(token.access_token, function(err) {
      callback(err, token.access_token);
    });
  }.bind(this));
};

GithubHelper.prototype.checkUserMembership = function(token, callback) {
  this.loginWithToken(token);
  var self = this;
  this.getUserName(function(err, user) {
    if (err) {
      return callback(err);
    }
    self.isUserMemberOf(user, function(err) {
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

GithubHelper.prototype.getUserName = function(callback) {
  this._api.user.get({}, function(err, data) {
    callback(err, data ? data.login : data);
  });
};

GithubHelper.prototype.isUserMemberOf = function(userName, callback) {
  this._api.orgs.getMember({
    org: this.githubOrg,
    user: userName
  }, function(err, data) {
    callback(err, data);
  });
};

module.exports = GithubHelper;
