var log4js = require('log4js');
var path = require('path');

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
            "pattern": "%r %p - %m"
          }
        }
      }
    ]
  });
};

/**
 * @returns {Logger}
 */
module.exports.getLog = function() {
  return log4js.getLogger();
};
