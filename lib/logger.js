var log4js = require('log4js');
log4js.configure('bin/log4js.json', {reloadSecs: 300});

module.exports = log4js.getLogger();
