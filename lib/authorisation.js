var OAuth = require('oauth');
var OAuth2Github = require('./auth/oauth2/github');

module.exports = (function() {

	var authGate = null;

	/**
	 * @constructor
	 */
	function Authorisation(clientId, clientSecret, provider, method) {
		createOAuth(clientId, clientSecret, provider, method);
	}

	Authorisation.prototype.getParser = function() {

		function parseAuthorization(req, res, next) {
			var e = new InvalidHeaderError('BasicAuth content ' + 'is invalid.');
			return (next(e));
		}

		return (parseAuthorization);
	}

	var createOAuth = function(clientId, clientSecret, provider, method) {
		if(provider == 'github' && method == 'OAuth2') {
			provider = new OAuth2Github();
		} else {
			return;
		}

		authGate = new OAuth.OAuth2(
			clientId,
			clientSecret,
			provider.baseSite,
			provider.authorizePath,
			provider.accessTokenPath,
			provider.customHeaders
		);
	}

	Authorisation.prototype.getAccessToken = function(code, params, callback) {
		authGate.getOAuthAccessToken(
			code || '',
			params || {'grant_type':'client_credentials'},
			callback || function (e, access_token, refresh_token, results){
				console.log('bearer: ',access_token);
			}
		);
	}

	return Authorisation;
})()
