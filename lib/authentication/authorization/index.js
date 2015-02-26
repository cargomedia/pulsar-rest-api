var _ = require('underscore');

/**
 * @param {Object} config
 */
function Authorization(config) {
  this._roleUserMap = config;
}

/**
 * @param {Object} app - express app.
 */
Authorization.prototype.installHandlers = function(app) {
  app.use(this._getHandler());
};

/**
 * @param {String} role
 * @returns {Function} express handler
 */
Authorization.prototype.restrictTo = function(role) {
  return function(req, res, next) {
    if (_.contains(req.user.roleList, role)) {
      return next();
    } else {
      return next(new AuthorizationError('Access denied'));
    }
  }
};

Authorization.prototype._getHandler = function() {
  return function(req, res, next) {
    if (!req.user || !req.user.name) {
      return next(new AuthorizationError('Trying to authorize with no user'));
    }
    req.user.roleList = this._getUserRoleList(req.user);
    return next();
  }.bind(this);
};

/**
 * @param {Object} user
 * @returns {String[]}
 */
Authorization.prototype._getUserRoleList = function(user) {
  var roleList = [];
  _.each(this._roleUserMap, function(userList, role) {
    if (_.contains(userList, user.name) || _.intersection(userList, user.orgList).length > 0) {
      roleList.push(role);
    }
  }, this);
  return roleList;
};

module.exports = Authorization;
