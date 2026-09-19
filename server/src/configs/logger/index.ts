import winston, { format, transports } from 'winston';
import { env } from '../env/index.js';

const { combine, timestamp, errors, printf, json } = format;

const devFormat = printf(({ level, message, service, timestamp }: any) => {
  return `${timestamp} ${service} [${level}]: ${message}`;
});

const logFormat = env.NODE_ENV === 'development' ? combine(timestamp(), devFormat) : json();

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'Server' },
  format: combine(logFormat, errors({ stack: true })),
  transports: [new transports.Console()],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

// Handle logger error
logger.on('error', (err: any) => {
  console.error(`Logging Error: ${err}`);
});

logger.info('Logger initialized');
