var GitHubApi = require("github");

module.exports = (function() {

	var github = null;

	/**
	 * @constructor
	 */
	function Github(username, password) {
		create(username, password);
	}

	var create = function(username, password, token) {
		github = new GitHubApi({
			version: "3.0.0",
			protocol: "https"
		});
//		token = 'f6c77c0763ead1e0bdfaa64ce17db47ce2d33f87';
//		if (token) {
//			github.authenticate({
//				type: "oauth",
//				token: token
//			});
//		}
//		if (username && password) {
//			github.authenticate({
//				type: "basic",
//				username: username,
//				password: password
//			});
//		}
	}

	/**
	 * @param username
	 * @param callback
	 */
	Github.prototype.checkMembership = function(org, username, callback) {
		github.orgs.getMember({
			org: org,
			user: username
		}, callback);
	}

	Github.prototype.isAllowed = function(username, callback) {
		this.getUser(username, callback);
	}

	Github.prototype.enabled = function() {
		return true;
	}

	return Github;
})()
