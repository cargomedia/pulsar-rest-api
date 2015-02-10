var TokenContainer = require('../lib/authentication/token-container');
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
    TokenContainer._collectorIntervalMs = 100;
    TokenContainer._oudatedTimeMs = TokenContainer._collectorIntervalMs + 1;

    var cookieAuthentication = new TokenContainer();
    cookieAuthentication.saveToken(responseMock, 'token');
    var cookies = Object.keys(cookieAuthentication._tokens);
    assert(cookies.length == 1);

    var cookie = cookies[0];
    setTimeout(function() {
      assert(cookieAuthentication.hasToken(cookie), 'Cookie should be presented');
      setTimeout(function() {
        assert(!cookieAuthentication.hasToken(cookie), 'Cookie should be deleted');
        done();
      }, (TokenContainer._oudatedTimeMs + 2 * TokenContainer._collectorIntervalMs));
    }, TokenContainer._collectorIntervalMs);
  });

});
