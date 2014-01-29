var githubApi = require('./api/client/github');
var oAuthBasic = require('./api/client/oauth/basic.js');

module.exports = (function() {

	var gate = null;
	var oauth = null;

	/**
	 * @constructor
	 */
	function Authorisation(username, password, provider, method) {
		createAuth(username, password, provider, method);
	}

	Authorisation.prototype.getParser = function() {
		function parseAuthorization(req, res, next) {

			return (next());

			if(!gate.enabled()) {
				return (next());
			}

			token = req.headers['pulsar-rest-api-token'];
			username = req.headers['pulsar-rest-api-user'];
			organisation = req.headers['pulsar-rest-api-organisation'];

			if(!token) {
				token = '12345';
				username = 'kris-lab';
				organisation = 'cargomedia';
			}

			res.setHeader('pulsar-rest-api-token', token);
			res.setHeader('pulsar-rest-api-user', username);
			res.setHeader('pulsar-rest-api-organisation', organisation);

			oauth.checkToken('f6c77c0763ead1e0bdfaa64ce17db47ce2d33f87', function(error, response) {
				console.log(error);
				console.log(JSON.stringify(response));
			});

			gate.checkMembership(organisation, username, function(err,res) {

				if(err) {
					var e = new Error('Authorisation credential are invalid.');
					return (next(e));
				}

				return (next());
			});
		}

		return (parseAuthorization);
	}

	var createAuth = function(username, password, provider, method) {
		if(provider == 'github' && method == 'user') {
			gate = new githubApi(username, password);
			oauth = new oAuthBasic();
		}

		if(!gate) {
			console.log('Authorisation is not enabled!');
		}
	}

	return Authorisation;
})()
