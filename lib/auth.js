var GithubApi = require('./github');

module.exports = (function() {

  var api = null;
  var oauth = null;

  /**
   * @param {Object} options
   * @constructor
   */
  function Authorisation(options) {
    createAuth(options);
  }

  Authorisation.prototype.getParser = function() {
    function parseAuthorization(req, res, next) {

      return (next());

      if (req.url.indexOf('/web/app/') > -1 || req.url.indexOf('/web/assets/') > -1) {
        return next();
      }

      var cookies = parseCookies(req);
      if (cookies['github-auth-token']) {
        return next();
      } else {
        // here must be redirected to github-oauth
        //res.setHeader('Set-Cookie', 'github-auth-token=f6c77c0763ead1e0bdfaa64ce17db47ce2d33f87');
        //return next();
      }

      // proper authorisation with github-api using token
      var token = req.headers['github-auth-token'];
      if (!token) {
        return next(new Error('Authorisation token is not set.'));
      }
      api.checkCredential(token, function(err, res) {
        if (err) {
          var e = new Error('Authorisation credential are invalid.');
          return next(e);
        }
        return next();
      });
    }

    return (parseAuthorization);
  };

  var createAuth = function(options) {
    if (options) {
      api = new GithubApi();
    }
    if (!api) {
      console.log('Authorisation is not enabled!');
    }
  };

  function parseCookies(req) {
    var list = {};
    var rc = req.headers.cookie;

    rc && rc.split(';').forEach(function(cookie) {
      var parts = cookie.split('=');
      list[parts.shift().trim()] = unescape(parts.join('='));
    });

    return list;
  }

  return Authorisation;
})();
