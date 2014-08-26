var yaml = require('js-yaml');
var fs = require('fs');
var _ = require('underscore');
var log = require('./logger');

module.exports = (function() {
  function Config(path){
    log.info('Config loading');
    this._hash = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    //TODO validate config
    this.processSSL();
    log.info('Config loading success');
    log.debug(this._hash);
  }

  /**
   * @returns {Object}
   */
  Config.prototype.asHash = function(){
    //TODO may be freeze it before return?
    return this._hash;
  };

  Config.prototype.processSSL = function(){
    var ssl = this._hash.ssl;
    var sslOptions = null;
    if (ssl && ssl.key && ssl.cert) {
      sslOptions = {
        key: fs.readFileSync(ssl.key)
      };

      var certFile = fs.readFileSync(ssl.cert).toString();
      var certs = certFile.match(/(-+BEGIN CERTIFICATE-+[\s\S]+?-+END CERTIFICATE-+)/g);
      if (certs && certs.length) {
        sslOptions.cert = certs.shift();
        if (certs.length) {
          sslOptions.ca = certs;
        }
      } else {
        sslOptions.cert = certFile;
      }
    }
    if (ssl.pfx) {
      sslOptions = {
        pfx: fs.readFileSync(ssl.pfx)
      };
    }
    if (sslOptions && ssl.passphrase) {
      sslOptions.passphrase = fs.readFileSync(ssl.passphrase).toString().trim();
    }
    _.extend(ssl, sslOptions);
  };

  return Config;
}());
