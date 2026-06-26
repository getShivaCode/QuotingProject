const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels: 0=error, 1=warn, 2=info, 3=debug
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase() || 'info'];

const shouldLog = (level) => LOG_LEVELS[level] <= CURRENT_LOG_LEVEL;

const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}]`;

  if (data) {
    logMessage += ` ${message} ${JSON.stringify(data)}`;
  } else {
    logMessage += ` ${message}`;
  }

  return logMessage;
};

const writeToFile = (level, message, data) => {
  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const allLogFile = path.join(logsDir, 'all.log');

  const logEntry = formatLog(level, message, data) + '\n';

  fs.appendFileSync(logFile, logEntry, { encoding: 'utf-8' });
  fs.appendFileSync(allLogFile, logEntry, { encoding: 'utf-8' });
};

const logger = {
  info: (message, data = null) => {
    if (shouldLog('info')) {
      const log = formatLog('INFO', message, data);
      console.log(log);
    }
    writeToFile('INFO', message, data);
  },

  error: (message, data = null) => {
    if (shouldLog('error')) {
      const log = formatLog('ERROR', message, data);
      console.error(log);
    }
    writeToFile('ERROR', message, data);
  },

  warn: (message, data = null) => {
    if (shouldLog('warn')) {
      const log = formatLog('WARN', message, data);
      console.warn(log);
    }
    writeToFile('WARN', message, data);
  },

  debug: (message, data = null) => {
    if (shouldLog('debug')) {
      const log = formatLog('DEBUG', message, data);
      console.log(log);
    }
    writeToFile('DEBUG', message, data);
  },

  logRequest: (method, path, body = null) => {
    const message = `${method} ${path}`;
    logger.info(message, body ? { body } : null);
  },

  logResponse: (method, path, status, duration, body = null) => {
    const message = `${method} ${path} - ${status} (${duration}ms)`;
    logger.info(message, body ? { body: typeof body === 'string' ? body.substring(0, 200) : body } : null);
  },

  logError: (method, path, error, duration) => {
    const message = `${method} ${path} - Error (${duration}ms)`;
    logger.error(message, { error: error.message || String(error) });
  },

  clearLogs: () => {
    try {
      const files = fs.readdirSync(logsDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(logsDir, file));
      });
      logger.info('Logs cleared');
    } catch (err) {
      logger.error('Failed to clear logs', err);
    }
  },
};

module.exports = logger;
