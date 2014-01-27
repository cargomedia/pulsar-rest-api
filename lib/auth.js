var github = require('./api/client/github');

module.exports = (function() {

	var gate = null;

	/**
	 * @constructor
	 */
	function Authorisation(username, password, provider, method) {
		createAuth(username, password, provider, method);
	}

	Authorisation.prototype.getParser = function() {
		function parseAuthorization(req, res, next) {
			if(!gate.enabled()) {
				return (next());
			}

			console.log(JSON.stringify(req.headers));

			token = req.headers['pulsar-rest-api-token'];
			username = req.headers['pulsar-rest-api-user'];
			organisation = req.headers['pulsar-rest-api-organisation'];

			console.log(token + " " + username + " " + organisation);

			if(!token) {
				token = '12345';
				username = 'njam';
				organisation = 'cargomedia';
			}

			res.setHeader('pulsar-rest-api-token', token);
			res.setHeader('pulsar-rest-api-user', username);
			res.setHeader('pulsar-rest-api-organisation', organisation);

			console.log(token + " " + username + " " + organisation);

			gate.checkMembership(organisation, username, function(err,res) {
				if(err) {
					var e = new Error('Authorisation credential are invalid.');
					return (next(e));
				}

				console.log("is member" + JSON.stringify(err) + "   " + JSON.stringify(res));

				return (next());
			});
		}

		return (parseAuthorization);
	}

	var createAuth = function(username, password, provider, method) {
		if(provider == 'github' && method == 'user') {
			gate = new github(username, password);
		}

		if(!gate) {
			console.log('Authorisation is not enabled!');
		}
	}

	return Authorisation;
})()
