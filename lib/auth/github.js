var crypto = require('crypto');
var request = require('request');
var github = require('github');

function GithubApi(config, cookieAuth) {

  this.cookieAuth = cookieAuth;

  this.githubApp = config.githubApp;//process.env['GITHUB_CLIENT'],
  this.githubOrg = config.githubOrg;//process.env['GITHUB_CLIENT'],
  this.githubClient = config.githubAppId;//process.env['GITHUB_CLIENT'],
  this.githubSecret = config.githubAppSecret;//process.env['GITHUB_SECRET'],
  this.baseURL = config.baseUrl;//'http://localhost',
  this.callbackURI = config.callbackUrl;
  //this.redirectURI = urlModule.format(path.join(this.baseURL, this.callbackURI));
  this.redirectURI = this.baseURL + this.callbackURI;
  this.scope = config.scope;// optional, default scope is set to user
  this.state = crypto.randomBytes(8).toString('hex');

  this.github = new github({
    version: "3.0.0",
    debug: true,
    protocol: "https",
    timeout: 5000
  });

}

GithubApi.prototype.extractBasicToken = function(req) {
  if (req.authorization.scheme == 'Basic' && req.authorization.basic.password == 'x-oauth-basic') {
    return req.authorization.basic.username;
  }
  return null;
};

GithubApi.prototype.extractRequestTokens = function(url) {
  //if req is for callback url
  if (url.pathname == this.callbackURI) {
    var query = url.query;
    var code = query.code;
    if (code) {
      return code;
    }
  }
  return null;
};

GithubApi.prototype.demandRequestTokens = function(res) {
  var u = 'https://github.com/login/oauth/authorize'
    + '?client_id=' + this.githubClient
    + '&scope=' + this.scope
    + '&redirect_uri=' + this.redirectURI
    + '&state=' + this.state;
  res.statusCode = 302;
  res.setHeader('location', u);
  res.end();
};

GithubApi.prototype.checkAccessTokens = function(token, res, next) {
  if (token && token.access_token) {
    this.checkUserMembership(token.access_token, res, next);
  } else {
    return next(new Error('Got empty Github access tokens'));
  }
};

GithubApi.prototype.demandAccessTokens = function(code, res, next) {
  var self = this;
  var url = 'https://github.com/login/oauth/access_token'
    + '?client_id=' + this.githubClient
    + '&client_secret=' + this.githubSecret
    + '&code=' + code
    + '&state=' + this.state;

  request.get({url:url, json: true}, function (err, tokenResp, tokenBody) {
    if (err) {
      err.body = tokenBody;
      err.tokenResp = tokenResp;
      return next(err);
    }
    self.checkAccessTokens(tokenBody, res, next);
  });
};

GithubApi.prototype.checkUserMembership = function(token, res, next) {
  this.login(token);
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

GithubApi.prototype.login = function(token) {
  this.github.authenticate({
    type: "oauth", token: token
  });
};

GithubApi.prototype.getUser = function(callback) {
  this.github.user.get({}, function(err, data) {
    callback(err, data.login);
  });
};

GithubApi.prototype.isUserMemberOf = function(user, callback) {
  this.github.orgs.getMember({org: this.githubOrg, user: user}, function(err, data) {
    callback(err, data);
  });
};

module.exports = GithubApi;
