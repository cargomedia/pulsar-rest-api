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
            var token = req.headers['github-auth-token'];

            if(!token) {
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
	}

	var createAuth = function(options) {
		if (options) {
            api = new GithubApi();
		}
		if (!api) {
			console.log('Authorisation is not enabled!');
		}
	}

	return Authorisation;
})()
