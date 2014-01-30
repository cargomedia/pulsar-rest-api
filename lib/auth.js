var githubApi = require('./github');
var oAuthBasic = require('./github/oauth/basic.js');

module.exports = (function() {

	var gate = null;
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

			if(!gate.enabled()) {
				return (next());
			}

			token = req.headers['pulsar-rest-api-token'];
			username = req.headers['pulsar-rest-api-user'];
			organisation = req.headers['pulsar-rest-api-organisation'];

			if(!token) {
				token = '';
				username = '';
				organisation = '';
			}

			res.setHeader('pulsar-rest-api-token', token);
			res.setHeader('pulsar-rest-api-user', username);
			res.setHeader('pulsar-rest-api-organisation', organisation);

			oauth.checkToken('', function(error, response) {
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

	var createAuth = function(options) {
        if(options) {
            if(provider == 'github' && method == 'user') {
                gate = new githubApi(username, password);
                oauth = new oAuthBasic();
            }
        }
		if(!gate) {
			console.log('Authorisation is not enabled!');
		}
	}

	return Authorisation;
})()
