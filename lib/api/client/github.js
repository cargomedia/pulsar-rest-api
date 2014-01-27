var GitHubApi = require("github");

module.exports = (function() {

	var github = null;

	/**
	 * @constructor
	 */
	function Github(username, password) {
		create(username, password);
	}

	var create = function(username, password) {
		github = new GitHubApi({
			version: "3.0.0"
		});
		if (username && password) {
			github.authenticate({
				type: "basic",
				username: username,
				password: password
			});
		}
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
