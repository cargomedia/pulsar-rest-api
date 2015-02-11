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
 * @param {String} token
 * @returns {Object} user
 */
UserContainer.prototype.saveUser = function(userData, token) {
  var cookie = crypto.randomBytes(32).toString('hex');
  this._userList[cookie] = {token: token, lastUsage: Date.now(), name: userData.login};
  return this._userList[cookie];
};

UserContainer.prototype.hasUserByCookie = function(cookie) {
  var info = this._userList[cookie];
  if (info) {
    info.lastUsage = Date.now();
  }
  return !!info;
};

UserContainer.prototype.extractTokenKeyFromRequest = function(req) {
  return req.cookies.get('userid');
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
