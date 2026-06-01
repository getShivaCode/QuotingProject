const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_DIR = path.resolve(__dirname, '../..');
const ORG_ALIAS = 'demo-org';
const AGENT_NAME = 'Quoting_Agent';
const BUILD_DIR = path.join(__dirname, 'build');
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || fs.existsSync(BUILD_DIR);

function runSfCommand(command) {
  try {
    const result = execSync(command, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env, NO_COLOR: '1', SF_DISABLE_TELEMETRY: 'true' },
    });
    // Strip ANSI escape codes from output
    const cleanedResult = result.replace(/\[[0-9;]*m/g, '').trim();
    return JSON.parse(cleanedResult);
  } catch (error) {
    logger.error('SF CLI error:', { command, error: error.message });
    throw error;
  }
}

// Start a new agent session
app.post('/api/agent/session', (req, res) => {
  const method = 'POST';
  const endpoint = '/api/agent/session';
  const startTime = Date.now();

  logger.logRequest(method, endpoint);

  // HACK: Wake up MCP server that goes to sleep if idle - fire and forget
  logger.debug('Waking up MCP server...');
  fetch('https://pricingmcp.onrender.com/')
    .then(() => logger.debug('MCP server wake-up call successful'))
    .catch((err) => logger.debug('MCP server wake-up call failed', { error: err.message }));

  try {
    const result = runSfCommand(
      `sf agent preview start --json --authoring-bundle ${AGENT_NAME} --use-live-actions --target-org ${ORG_ALIAS}`
    );
    const sessionId = result.result.sessionId;
    const duration = Date.now() - startTime;

    logger.logResponse(method, endpoint, 200, duration, { sessionId });
    res.json({ sessionId });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(method, endpoint, error, duration);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Send a message to the agent
app.post('/api/agent/message', (req, res) => {
  const method = 'POST';
  const endpoint = '/api/agent/message';
  const startTime = Date.now();
  const { sessionId, message } = req.body;

  logger.logRequest(method, endpoint, { sessionId, messageLength: message?.length });

  if (!sessionId || !message) {
    const duration = Date.now() - startTime;
    logger.warn(`${method} ${endpoint} - Missing required params (${duration}ms)`, { sessionId: !!sessionId, message: !!message });
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    const escapedMessage = message.replace(/'/g, "'\\''");
    const result = runSfCommand(
      `sf agent preview send --json --authoring-bundle ${AGENT_NAME} --session-id ${sessionId} --utterance '${escapedMessage}' --target-org ${ORG_ALIAS}`
    );
    const agentMessage = result.result.messages[0]?.message || '';
    const duration = Date.now() - startTime;

    logger.logResponse(method, endpoint, 200, duration, { sessionId, responseLength: agentMessage.length });
    res.json({ agentMessage, raw: result.result });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(method, endpoint, error, duration);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// End a session
app.delete('/api/agent/session/:sessionId', (req, res) => {
  const method = 'DELETE';
  const endpoint = `/api/agent/session/:sessionId`;
  const startTime = Date.now();
  const { sessionId } = req.params;

  logger.logRequest(method, endpoint, { sessionId });

  try {
    runSfCommand(
      `sf agent preview end --json --authoring-bundle ${AGENT_NAME} --session-id ${sessionId} --target-org ${ORG_ALIAS}`
    );
    const duration = Date.now() - startTime;

    logger.logResponse(method, endpoint, 200, duration, { sessionId });
    res.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(method, endpoint, error, duration);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Serve static React files in production
if (IS_PRODUCTION) {
  app.use(express.static(BUILD_DIR));

  // SPA fallback: serve index.html for unmatched routes
  app.get(/^(?!\/api\/)/, (req, res) => {
    res.sendFile(path.join(BUILD_DIR, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, { org: ORG_ALIAS, agent: AGENT_NAME, environment: IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT' });
});
