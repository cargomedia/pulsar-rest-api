var crypto = require('crypto');
var request = require('request');

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

}

GithubApi.prototype.hasBasicToken = function(req, res) {
  return false;
};

GithubApi.prototype.extractRequestTokens = function(url, req, res) {
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
    var accessToken = token.access_token;
    var self = this;
    this.getUser(accessToken, function(err, user) {
      if (err) {
        return next(err);
      }
      self.isMemberOf(user, accessToken, function(err) {
        if (err) {
          return next(err);
        }
        self.cookieAuth.setCookie(res, accessToken);
        return next();
      });
    });
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

GithubApi.prototype.getUser = function(token, callback) {
  var url = 'https://' + token + ':x-oauth-basic@api.github.com/user';
  var opts = {
    url: url,
    headers: {
      'User-Agent': this.githubApp
    },
    json: true,
    timeout: 2000
  };
  request.get(opts, function(err, res, body) {
    callback(err, body ? body.login : null);
  });
};

GithubApi.prototype.isMemberOf = function(user, token, callback) {
  var url = 'https://' + token + ':x-oauth-basic@api.github.com/orgs/' + this.githubOrg + '/members/' + user;
  var opts = {
    url: url,
    headers: {
      'User-Agent': this.githubApp
    },
    json: true,
    timeout: 3000
  };
  request.get(opts, function(err, res, body) {
    callback(err || body, null);
  });
};
