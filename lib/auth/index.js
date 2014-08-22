var GithubApi = require('./github');
var CookieAuth = require('./cookie');
var urlModule = require('url');

module.exports = function(config) {

  var cookieAuth = new CookieAuth();
  var githubAuth = new GithubApi(config, cookieAuth);

  return function(req, res, next) {
    var url = urlModule.parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (cookieAuth.isCookieSet(req, res)) {
      return next();
    }

    if (githubAuth.hasBasicToken(req)) {
      return next();
    }

    var reqTokens;
    if (reqTokens = githubAuth.extractRequestTokens(url)) {
      githubAuth.demandAccessTokens(reqTokens, res, next);
    } else {
      githubAuth.demandRequestTokens(res, next);
    }

  };
};
