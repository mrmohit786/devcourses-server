import winston from 'winston';
import morgan from 'morgan';
import json from 'morgan-json';
import moment from 'moment';

// winston options for error logging
const errorOptions = {
  file: {
    level: 'info',
    filename: './logs/devcourses-api-error.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

export const logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.File(errorOptions.file),
    new winston.transports.Console(errorOptions.console),
  ],
  exitOnError: false,
});


// winston options for api logging
const infoOptions = {
  file: {
    level: 'info',
    filename: './logs/devcourses-api-info.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

export const apiLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.File(infoOptions.file),
    new winston.transports.Console(infoOptions.console),
  ],
  exitOnError: false,
});
const format = json({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
});

export const morganLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, responseTime } = JSON.parse(message);
      apiLogger.info({
        timestamp: moment().format('MMMM Do YYYY, h:mm:ss a'),
        method,
        url,
        status: Number(status),
        responseTime: Number(responseTime),
      });
    },
  },
});
