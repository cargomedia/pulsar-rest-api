var UserContainer = require('../lib/authentication/user-container');
var assert = require('chai').assert;

describe('tests of garbage collecting of outdated cookies', function() {

  var responseMock = {
    cookies: {
      set: function() {
      }
    }
  };

  it.only('', function(done) {
    //for the sake of the test
    UserContainer._collectorIntervalMs = 100;
    UserContainer._oudatedTimeMs = UserContainer._collectorIntervalMs + 1;

    var userContainer = new UserContainer();
    userContainer.saveUser(responseMock, 'token');
    var cookies = Object.keys(userContainer._userList);
    assert(cookies.length == 1);

    var cookie = cookies[0];
    setTimeout(function() {
      assert(userContainer.hasUserByCookie(cookie), 'Cookie should be presented');
      setTimeout(function() {
        assert(!userContainer.hasUserByCookie(cookie), 'Cookie should be deleted');
        done();
      }, (UserContainer._oudatedTimeMs + 2 * UserContainer._collectorIntervalMs));
    }, UserContainer._collectorIntervalMs);
  });

});
