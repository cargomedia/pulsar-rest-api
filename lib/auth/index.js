var Github = require('./github');
var CookieAuth = require('./cookie');
var urlModule = require('url');

module.exports = function(config) {

  var cookieAuth = new CookieAuth();
  var githubAuth = new Github(config, cookieAuth);

  return function(req, res, next) {
    var url = urlModule.parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (cookieAuth.isCookieSet(req, res)) {
      return next();
    }

    var token;
    if (token = githubAuth.extractBasicToken(req)) {
      githubAuth.checkUserMembership(token, res, next);
    } else {
      if (url.pathname = githubAuth.callbackUrl && url.query.code && url.query.state) {
        githubAuth.checkUser(req, res, next);
      } else {
        githubAuth.authUser(req, res);
      }
    }
  };
};
