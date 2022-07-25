import { createLogger, format, transports } from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import moment from 'moment-timezone';

const logDir = 'logs';
const { combine, printf } = format;
const logFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const timestamp = format((info, opts) => {
  if (opts.tz) info.timestamp = moment().tz(opts.tz).format();
  return info;
});

const logger = createLogger({
  format: combine(timestamp({ tz: 'Asia/Seoul' }), logFormat),
  transports: [
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `%DATE%.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
    new winstonDaily({
      level: 'warn',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/warn',
      filename: `%DATE%.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
});

if (process.env.NODE_ENV === 'development') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    })
  );
}

export default logger;
