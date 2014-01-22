var OAuth2Github = require('./auth/oauth2/github');

module.exports = (function() {

	var gate = null;

	/**
	 * @constructor
	 */
	function Authorisation(clientId, clientSecret, provider, method) {
		createAuth(clientId, clientSecret, provider, method);
	}

	Authorisation.prototype.getParser = function() {
		function parseAuthorization(req, res, next) {
			if(!gate.enabled()) {
				return (next());
			}

			if(gate.getAccessToken() == 'some-secret-token') {
				var e = new InvalidHeaderError('Authorisation credential are not invalid.');
				return (next(e));
			}

			return (next());
		}

		return (parseAuthorization);
	}

	var createAuth = function(clientId, clientSecret, provider, method) {
		if(provider == 'github' && method == 'OAuth2') {
			gate = new OAuth2Github(clientId, clientSecret);
		}

		if(!gate) {
			console.log('Authorisation is not enabled!');
		}
	}

	return Authorisation;
})()
