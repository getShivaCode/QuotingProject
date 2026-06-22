/**
 * Server-side logger with configurable levels
 * Environment: LOG_LEVEL=error|warning|info|debug (default: warning)
 * Output: stdout
 */

const LogLevel = {
  ERROR: 0,
  WARNING: 1,
  INFO: 2,
  DEBUG: 3,
};

const levelNames = {
  0: 'ERROR',
  1: 'WARNING',
  2: 'INFO',
  3: 'DEBUG',
};

function getLogLevel() {
  const envLevel = (process.env.LOG_LEVEL || 'warning').toLowerCase();
  return LogLevel[envLevel.toUpperCase()] ?? LogLevel.WARNING;
}

function formatTimestamp() {
  return new Date().toISOString();
}

function formatPayload(payload, maxLength = 500) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + `... (truncated, total: ${str.length} chars)`;
  }
  return str;
}

function log(level, stage, message, payload = null) {
  const currentLevel = getLogLevel();

  if (level > currentLevel) {
    return; // Don't log if level is higher than current setting
  }

  const timestamp = formatTimestamp();
  const levelName = levelNames[level];
  const stageStr = stage ? `[${stage}]` : '';

  let output = `${timestamp} ${levelName} ${stageStr} ${message}`;

  if (payload !== null && payload !== undefined) {
    output += '\n' + formatPayload(payload);
  }

  console.log(output);
}

module.exports = {
  error: (stage, message, payload) => log(LogLevel.ERROR, stage, message, payload),
  warning: (stage, message, payload) => log(LogLevel.WARNING, stage, message, payload),
  info: (stage, message, payload) => log(LogLevel.INFO, stage, message, payload),
  debug: (stage, message, payload) => log(LogLevel.DEBUG, stage, message, payload),

  // Specialized logging for request/response flow
  clientRequest: (endpoint, body) => {
    log(LogLevel.INFO, 'CLIENT', `Request to ${endpoint}`, body);
  },

  cliCommand: (command, result) => {
    log(LogLevel.DEBUG, 'SF_CLI', `Command: ${command}`, result);
  },

  cliError: (command, error) => {
    log(LogLevel.ERROR, 'SF_CLI', `Command failed: ${command}`, error);
  },

  clientResponse: (endpoint, body) => {
    log(LogLevel.INFO, 'RESPONSE', `Sending to ${endpoint}`, body);
  },
};
