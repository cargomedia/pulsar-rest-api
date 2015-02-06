var yaml = require('js-yaml');
var fs = require('fs');
var _ = require('underscore');
var Validator = require('jsonschema').Validator;

function Config(path) {
  var content = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
  Config._validate(content);
  this._hash = content;
  if (this._hash.ssl) {
    this._processSSL();
  }
}

/**
 * @returns {Object}
 */
Config.prototype.asHash = function() {
  return this._hash;
};

var validator = new Validator();

validator.attributes.validateSslPfx = function(ssl) {
  if (ssl && (!ssl.key || !ssl.cert) && !ssl.pfx) {
    return 'Ssl options must contain pair of `key` and `cert` or `pfx`';
  }
};

var validScheme = {
  type: 'object',
  properties: {
    port: {
      type: 'number',
      required: true
    },
    logPath: {
      type: 'string',
      required: true
    },
    mongodb: {
      type: 'object',
      required: true,
      properties: {
        host: {
          type: 'string',
          required: true
        },
        db: {
          type: 'string',
          required: true
        },
        port: {
          type: 'number',
          required: true
        }
      }
    },
    pulsar: {
      type: 'object',
      required: true,
      properties: {
        repo: {
          type: 'string',
          required: true
        },
        branch: {type: 'string'}
      }
    },
    auth: {
      type: 'object',
      properties: {
        githubOauthId: {
          type: 'string',
          required: true
        },
        githubOauthSecret: {
          type: 'string',
          required: true
        },
        githubOrg: {
          type: 'string',
          required: true
        },
        baseUrl: {
          type: 'uri',
          required: true
        }
      }
    },
    ssl: {
      type: 'object',
      validateSslPfx: true,
      properties: {
        key: {type: 'string'},
        cert: {type: 'string'},
        pfx: {type: 'string'},
        passphrase: {type: 'string'}
      }
    }
  }
};

/**
 * @param {Object} config
 */
Config._validate = function(config) {
  var result = validator.validate(config, validScheme, {propertyName: 'config'});
  if (result.errors.length) {
    throw new Error(result.errors.join(';\n'));
  }
};

Config.prototype._processSSL = function() {
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

module.exports = Config;
