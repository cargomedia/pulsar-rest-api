var _ = require('underscore');

function Authorization(config) {
  this._roleUserMap = config;
}

Authorization.prototype.installHandlers = function(app) {
  app.use(this._getHandler());
};

Authorization.prototype.installRestrictions = function(server) {
  require('./restrictions')(server, this);
};

Authorization.prototype.restrictTo = function(role) {
  return function(req, res, next) {
    if (_.contains(req.user.roleList, role)) {
      return next();
    } else {
      return next(new Error('Access denied'));
    }
  }
};

Authorization.prototype._getHandler = function() {
  return function(req, res, next) {
    var url = require('url').parse(req.url, true);
    if (url.pathname == '/web/app/' || url.pathname == '/web/assets/') {
      return next();
    }

    if (!req.user || !req.user.name) {
      return next(new Error('Trying to authorize with no user'));
    }
    req.user.roleList = this._getUserRoleList(req.user);
    return next();
  }.bind(this);
};

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
