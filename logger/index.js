import winston from 'winston';
import morgan from 'morgan';
import json from 'morgan-json';
import moment from 'moment';

const options = {
  file: {
    level: 'info',
    filename: './logs/app.log',
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
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

const format = json({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
});

export const httpLogger = morgan(format, {
  stream: {
    write: (message) => {
      const { method, url, status, responseTime } = JSON.parse(message);
      logger.info({
        timestamp: moment().format('MMMM Do YYYY, h:mm:ss a'),
        method,
        url,
        status: Number(status),
        responseTime: Number(responseTime),
      });
    },
  },
});
