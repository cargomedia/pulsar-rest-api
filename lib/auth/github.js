var github = require('github');
var githubOAuth = require('github-oauth');

function Github(config, cookieAuth) {

  this.cookieAuth = cookieAuth;
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

Github.prototype.extractBasicToken = function(req) {
  if (req.authorization.scheme == 'Basic' && req.authorization.basic.password == 'x-oauth-basic') {
    return req.authorization.basic.username;
  }
  return null;
};

Github.prototype.authenticateUser = function(req, res) {
  this._oauth.login(req, res);
};

Github.prototype.checkUser = function(req, res, next) {
  this._oauth.callback(req, res, function(err, token) {
    if (err || !token.access_token) {
      return next(err || new Error('Got empty Github access tokens'));
    }
    this.checkUserMembership(token.access_token, res, next);
  }.bind(this));
};

Github.prototype.checkUserMembership = function(token, res, next) {
  this.loginWithToken(token);
  var self = this;
  this.getUser(function(err, user) {
    if (err) {
      return next(err);
    }
    self.isUserMemberOf(user, function(err) {
      if (err) {
        return next(err);
      }
      self.cookieAuth.setCookie(res, token);
      return next();
    });
  });
};

Github.prototype.loginWithToken = function(token) {
  this._api.authenticate({
    type: "oauth",
    token: token
  });
};

Github.prototype.getUser = function(callback) {
  this._api.user.get({}, function(err, data) {
    callback(err, data ? data.login : data);
  });
};

Github.prototype.isUserMemberOf = function(user, callback) {
  this._api.orgs.getMember({
    org: this.githubOrg,
    user: user
  }, function(err, data) {
    callback(err, data);
  });
};

module.exports = Github;
