import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { config } from './config';

// Create the logger instance
export const logger = createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // Console transport with different formats for dev/prod
    new transports.Console({
      format: config.isDevelopment 
        ? format.combine(
            format.colorize(),
            format.simple(),
            format.printf((info) => {
              const { level, message, timestamp, ...metadata } = info;
              return `${timestamp} ${level}: ${message} ${
                Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
              }`;
            })
          )
        : format.json()
    }),
    // File transports only in production
    ...(config.isDevelopment ? [] : [
      new transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ])
  ]
});

// Export a type for the logger
export type Logger = WinstonLogger; 