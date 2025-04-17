// utils/logger.js
const winston = require('winston');
const { format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config/config');

// Create logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'genboleta' },
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    
    // File transport with daily rotation
    new DailyRotateFile({
      dirname: path.dirname(config.LOG_PATH),
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

module.exports = logger;