var CookieAuth = require('../lib/auth/cookie');
var assert = require('chai').assert;

describe('tests of garbage collecting of outdated cookies', function() {

  var responseMock = {
    setCookie: function() {
    }
  };

  it('', function(done) {
    var cookieAuth = new CookieAuth();
    //for the sake of the test
    cookieAuth._collectorIntervalMs = 100;
    cookieAuth._oudatedTimeMs = cookieAuth._collectorIntervalMs + 1;

    cookieAuth.setCookie(responseMock, 'token');
    var cookies = Object.keys(cookieAuth._cookies);
    assert(cookies.length == 1);

    var cookie = cookies[0];
    setTimeout(function() {
      assert(cookieAuth.hasCookie(cookie), 'Cookie should be presented');
      setTimeout(function() {
        assert(!cookieAuth.hasCookie(cookie), 'Cookie should be deleted');
        done();
      }, (cookieAuth._oudatedTimeMs + 2 * cookieAuth._collectorIntervalMs));
    }, cookieAuth._collectorIntervalMs);
  });

});
