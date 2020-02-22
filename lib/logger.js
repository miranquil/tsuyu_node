const log4js = require('log4js');
const config = require('../config');

log4js.addLayout('json', (config) => {
  return function(logEvent) {
    return JSON.stringify(logEvent) + config.separator;
  };
});
log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: '%[[%d][%p]%] %m',
      },
    },
    json: {
      type: 'file',
      filename: 'log.json',
      layout: {
        type: 'json',
        separator: ',',
      },
    },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: config.stdOutLogLevel,
    },
    json: {
      appenders: ['json'],
      level: config.JSONLogLevel,
    },
  },
});
const _logger = log4js.getLogger();
const _json_logger = log4js.getLogger('json');

const logger = {
  debug: (message) => {
    if (config.loggerType.indexOf('std') !== -1) {
      _logger.debug(message);
    }
    if (config.loggerType.indexOf('json') !== -1) {
      _json_logger.debug(message);
    }
  },
  info: (message) => {
    if (config.loggerType.indexOf('std') !== -1) {
      _logger.info(message);
    }
    if (config.loggerType.indexOf('json') !== -1) {
      _json_logger.info(message);
    }
  },
  warn: (message) => {
    if (config.loggerType.indexOf('std') !== -1) {
      _logger.warn(message);
    }
    if (config.loggerType.indexOf('json') !== -1) {
      _json_logger.warn(message);
    }
  },
  error: (message) => {
    if (config.loggerType.indexOf('std') !== -1) {
      _logger.error(message);
    }
    if (config.loggerType.indexOf('json') !== -1) {
      _json_logger.error(message);
    }
  },
};

module.exports = { logger };
