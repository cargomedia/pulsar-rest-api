var log4js = require('log4js');
var path = require('path');
var isConfigured = false;

/**
 * @param {Object} appConfig
 * @param {String} appConfig.logPath path to a log file.
 */
module.exports.configure = function(appConfig) {
  if (!appConfig || !appConfig.logPath) {
    throw new Error('Trying to create log without config');
  }

  log4js.configure({
    "appenders": [
      {
        "type": "logLevelFilter",
        "level": "INFO",
        "appender": {
          "type": "console",
          "layout": {
            "type": "colored"
          }
        }
      },
      {
        "type": "logLevelFilter",
        "level": "DEBUG",
        "appender": {
          "type": "file",
          "filename": appConfig.logPath,
          "layout": {
            "type": "pattern",
            "pattern": "%d %p - %m"
          }
        }
      }
    ]
  });
  isConfigured = true;
};

/**
 * @returns {Logger}
 */
module.exports.getLog = function() {
  if (!isConfigured) {
    throw new Error('You must configure log before using it');
  }
  return log4js.getLogger();
};
