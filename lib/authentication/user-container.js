var crypto = require('crypto');
var _ = require('underscore');

function UserContainer() {
  this._userList = [];
  this._startGarbageCollecting();
}

UserContainer._hourMs = 60 * 60 * 1000;
UserContainer._collectorIntervalMs = 12 * UserContainer._hourMs;
UserContainer._oudatedTimeMs = 48 * UserContainer._hourMs;

/**
 * @param {Object} userData
 * @param {String[]} userOrgList
 * @param {String} token
 * @returns {Object} user
 */
UserContainer.prototype.saveUser = function(userData, userOrgList, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  var user = {token: token, cookie: cookie, lastUsage: Date.now(), name: userData.login, orgList: userOrgList};
  this._userList.push(user);
  return user;
};

/**
 * @param {String} cookie
 * @returns {Boolean}
 */
UserContainer.prototype.hasUserByCookie = function(cookie) {
  var user = this.getUserByCookie(cookie);
  if (user) {
    user.lastUsage = Date.now();
  }
  return !!user;
};

/**
 * @param {String} cookie
 * @returns {Object}
 */
UserContainer.prototype.getUserByCookie = function(cookie) {
  return _.find(this._userList, function(user) {
    return user.cookie === cookie;
  });
};

/**
 * @param {String} token
 * @returns {Boolean}
 */
UserContainer.prototype.hasUserByToken = function(token) {
  var user = this.getUserByToken(token);
  if (user) {
    user.lastUsage = Date.now();
  }
  return !!user;
};

/**
 * @param {String} token
 * @returns {Object}
 */
UserContainer.prototype.getUserByToken = function(token) {
  return _.find(this._userList, function(user) {
    return user.token === token;
  });
};

UserContainer.prototype._startGarbageCollecting = function() {
  setInterval(function() {
    var now = Date.now();
    this._userList = _.filter(this._userList, function(user) {
      return now - user.lastUsage <= UserContainer._oudatedTimeMs;
    });
  }.bind(this), UserContainer._collectorIntervalMs);
};

module.exports = UserContainer;
