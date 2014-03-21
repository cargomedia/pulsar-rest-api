var GitHubApi = require("github");

module.exports = (function () {

  var github = null;

  /**
   * @constructor
   */
  function Github() {
    this.github = new GitHubApi({
      version: "3.0.0",
      protocol: "https"
    });
  }

  /**
   * @param token
   * @param callback
   */
  Github.prototype.checkCredential = function (token, callback) {
    this.github.authenticate({
      type: "oauth",
      token: token
    });
    this.github.user.get({}, function (err, data) {
      callback(err, data);
    });
  }

  return Github;

})()
