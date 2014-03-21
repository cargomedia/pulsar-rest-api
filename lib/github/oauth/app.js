var OAuth = require('oauth');

module.exports = (function () {

  var engine = null;

  var baseSite = 'https://github.com/login';
  var authorizePath = null;
  var accessTokenPath = null;
  var customHeaders = null;

  /**
   * @constructor
   */
  function OAuth2(clientId, clientSecret) {
    create(clientId, clientSecret);
  }

  var create = function (clientId, clientSecret) {
    engine = new OAuth.OAuth2(
      clientId,
      clientSecret,
      baseSite,
      authorizePath,
      accessTokenPath,
      customHeaders
    );
  }

  OAuth2.prototype.getAccessToken = function () {
    engine.getOAuthAccessToken(
      code || '',
      params || {'grant_type': 'client_credentials'},
      callback || function (e, access_token, refresh_token, results) {
        //console.log('bearer: ', access_token);
      }
    );
  }

  OAuth2.prototype.enabled = function () {
    return true;
  }

  return OAuth2;
})()
