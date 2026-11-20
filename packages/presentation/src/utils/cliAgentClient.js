const { execFile } = require('child_process');

const SF_TIMEOUT_MS = 120000;

function orgAlias() {
  return process.env.SF_TARGET_ORG || 'pricing-demo';
}

function agentName() {
  return process.env.SF_AGENT_NAME || 'Quoting_Agent';
}

function parseSfJson(text) {
  const cleaned = String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
  const objects = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== '{') continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let j = i; j < cleaned.length; j++) {
      const char = cleaned[j];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            objects.push(JSON.parse(cleaned.slice(i, j + 1)));
          } catch (parseError) {
            // Plugin warnings print unquoted objects such as {name: '...'}.
          }
          break;
        }
      }
    }
  }
  const parsed = objects.reverse().find((item) => item && Object.prototype.hasOwnProperty.call(item, 'status'));
  if (!parsed) {
    throw new Error(cleaned.trim().slice(0, 500) || 'Empty Salesforce CLI response');
  }
  if (parsed.status !== 0) {
    throw new Error(parsed.message || parsed.name || 'Salesforce CLI command failed');
  }
  return parsed;
}

function sfEnv() {
  const env = { ...process.env };
  delete env.SF_API_VERSION;
  delete env.FORCE_COLOR;
  env.NO_COLOR = '1';
  return env;
}

function runSf(args) {
  return new Promise((resolve, reject) => {
    execFile('sf', args, { timeout: SF_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024, env: sfEnv() }, (error, stdout, stderr) => {
      try {
        resolve(parseSfJson(`${stdout || ''}\n${stderr || ''}`));
      } catch (parseError) {
        reject(error && !stdout ? new Error(stderr || error.message) : parseError);
      }
    });
  });
}

async function initializeSession() {
  const result = await runSf([
    'agent', 'preview', 'start',
    '--json',
    '--api-name', agentName(),
    '--target-org', orgAlias(),
  ]);
  const sessionId = result.result && result.result.sessionId;
  if (!sessionId) {
    throw new Error('Salesforce CLI did not return a session id');
  }
  return sessionId;
}

async function sendMessage(sessionId, message) {
  const result = await runSf([
    'agent', 'preview', 'send',
    '--json',
    '--api-name', agentName(),
    '--session-id', sessionId,
    '--target-org', orgAlias(),
    '--utterance', message,
  ]);
  const messages = (result.result && result.result.messages) || [];
  const agentMessage = (messages[0] && messages[0].message) || '';
  return { messages, agentMessage };
}

async function endSession(sessionId) {
  await runSf([
    'agent', 'preview', 'end',
    '--json',
    '--api-name', agentName(),
    '--session-id', sessionId,
    '--target-org', orgAlias(),
  ]);
  return true;
}

module.exports = {
  initializeSession,
  sendMessage,
  endSession,
};
