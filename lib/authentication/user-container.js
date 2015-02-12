var crypto = require('crypto');
var _ = require('underscore');

function UserContainer() {
  this._userList = {};
  this._startGarbageCollecting();
}

UserContainer._hourMs = 60 * 60 * 1000;
UserContainer._collectorIntervalMs = 12 * UserContainer._hourMs;
UserContainer._oudatedTimeMs = 48 * UserContainer._hourMs;

/**
 * @param {Object} userData
 * @param {Array} userOrgList
 * @param {String} token
 * @returns {Object} user
 */
UserContainer.prototype.saveUser = function(userData, userOrgList, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._userList[cookie] = {token: token, cookie: cookie, lastUsage: Date.now(), name: userData.login, orgList: userOrgList};
  return this._userList[cookie];
};

UserContainer.prototype.hasUserByCookie = function(cookie) {
  var user = this.getUserByCookie(cookie);
  if (user) {
    user.lastUsage = Date.now();
  }
  return !!user;
};

UserContainer.prototype.getUserByCookie = function(cookie) {
  return this._userList[cookie];
};

UserContainer.prototype.hasUserByToken = function(token) {
  var user = this.getUserByToken(token);
  if (user) {
    user.lastUsage = Date.now();
  }
  return !!user;
};

UserContainer.prototype.getUserByToken = function(token) {
  return _.find(this._userList, function(user) {
    return user.token === token;
  });
};

UserContainer.prototype._startGarbageCollecting = function() {
  setInterval(function() {
    var now = Date.now();
    _.each(this._userList, function(info, cookie, cookies) {
      if (now - info.lastUsage > UserContainer._oudatedTimeMs) {
        delete cookies[cookie];
      }
    });
  }.bind(this), UserContainer._collectorIntervalMs);
};

module.exports = UserContainer;
