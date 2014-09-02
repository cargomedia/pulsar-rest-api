var CookieAuth = require('../lib/auth/cookie');
var assert = require('chai').assert;

describe('tests of garbage collecting of outdated cookies', function() {

  var responseMock = {
    setCookie: function() {
    }
  };

  it('', function(done) {
    //for the sake of the test
    CookieAuth._collectorIntervalMs = 100;
    CookieAuth._oudatedTimeMs = CookieAuth._collectorIntervalMs + 1;

    var cookieAuth = new CookieAuth();
    cookieAuth.setCookie(responseMock, 'token');
    var cookies = Object.keys(cookieAuth._cookies);
    assert(cookies.length == 1);

    var cookie = cookies[0];
    setTimeout(function() {
      assert(cookieAuth.hasCookie(cookie), 'Cookie should be presented');
      setTimeout(function() {
        assert(!cookieAuth.hasCookie(cookie), 'Cookie should be deleted');
        done();
      }, (CookieAuth._oudatedTimeMs + 2 * CookieAuth._collectorIntervalMs));
    }, CookieAuth._collectorIntervalMs);
  });

});
