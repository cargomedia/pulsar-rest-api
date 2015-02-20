var _ = require('underscore');
var UserContainer = require('../../lib/authentication/user-container');
var assert = require('chai').assert;

describe('tests of garbage collecting of outdated cookies', function() {

  var responseMock = {
    cookies: {
      set: function() {
      }
    }
  };

  it('', function(done) {
    //for the sake of the test
    UserContainer._collectorIntervalMs = 100;
    UserContainer._oudatedTimeMs = UserContainer._collectorIntervalMs + 10;

    var userContainer = new UserContainer();
    userContainer.saveUser(responseMock, 'token');
    assert(_.size(userContainer._userList) == 1);

    var user = userContainer._userList[0];
    setTimeout(function() {
      assert(userContainer.hasUserByCookie(user.cookie), 'Cookie should be presented');
      assert(userContainer.hasUserByToken(user.token), 'Token should be presented');
      setTimeout(function() {
        assert(!userContainer.hasUserByCookie(user), 'User should be deleted');
        assert(!userContainer.hasUserByToken(user), 'User should be deleted');
        done();
      }, (UserContainer._oudatedTimeMs + 2 * UserContainer._collectorIntervalMs));
    }, UserContainer._collectorIntervalMs);
  });

});
