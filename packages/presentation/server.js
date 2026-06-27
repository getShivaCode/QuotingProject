require('dotenv').config({ path: '.env.local', override: false });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const serverLogger = require('./src/utils/serverLogger');
const restApiClient = require('./src/utils/restApiClient');

const app = express();
app.use(cors());
app.use(express.json());

const BUILD_DIR = path.join(__dirname, 'build');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PRODUCTION ? 'warn' : 'info');

// Parse agent message - with deterministic Phase 1 enforcement, agent guarantees pure JSON when json_mode=True
function parseAgentResponse(agentMessage) {
  try {
    const parsed = JSON.parse(agentMessage);
    logger.info('parseAgentResponse: JSON parse succeeded', { type: parsed.type });
    return parsed;
  } catch (error) {
    // If json_mode is enabled, parsing should never fail. If it does, log and fail fast.
    logger.error('parseAgentResponse: Failed to parse agent response', {
      error: error.message,
      messagePreview: agentMessage.substring(0, 200),
    });
    // Return as plain text response (agent may be in text mode or error state)
    return {
      type: 'text',
      message: agentMessage,
      data: null,
      actions: [],
    };
  }
}

// Start a new agent session
app.post('/api/agent/session', async (req, res) => {
  const method = 'POST';
  const endpoint = '/api/agent/session';
  const startTime = Date.now();

  logger.info('>>> POST /api/agent/session - Creating new session');

  logger.logRequest(method, endpoint);

  // HACK: Wake up MCP server that goes to sleep if idle - fire and forget
  logger.debug('Waking up MCP server...');
  fetch('https://pricingmcp.onrender.com/')
    .then(() => logger.debug('MCP server wake-up call successful'))
    .catch((err) => logger.debug('MCP server wake-up call failed', { error: err.message }));

  try {
    const agentId = process.env.SF_AGENT_ID;
    logger.debug('[REST_API] Session init request', { agentId });
    const sessionId = await restApiClient.initializeSession(agentId);
    logger.info('>>> Session created', { sessionId });
    logger.debug('[REST_API] Session init response', { sessionId });

    // Initialize JSON mode for REST API
    serverLogger.clientRequest('/api/agent/message (set_json_format)', { sessionId, message: 'set_json_format', debug: false });
    const jsonModeResponse = await restApiClient.sendMessage(sessionId, 'set_json_format');
    serverLogger.clientResponse('/api/agent/message (set_json_format)', { agentMessage: jsonModeResponse });
    logger.debug('>>> JSON mode initialized', { sessionId });

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
app.post('/api/agent/message', async (req, res) => {
  const method = 'POST';
  const endpoint = '/api/agent/message';
  const startTime = Date.now();
  const { sessionId, message } = req.body;
  const debug = req.query.debug === 'true';

  logger.info('>>> POST /api/agent/message', { sessionId, message });

  logger.logRequest(method, endpoint, { sessionId, messageLength: message?.length });

  // Server logger: log client request
  serverLogger.clientRequest(endpoint, { sessionId, message, debug });

  if (!sessionId || !message) {
    const duration = Date.now() - startTime;
    logger.warn(`${method} ${endpoint} - Missing required params (${duration}ms)`, { sessionId: !!sessionId, message: !!message });
    serverLogger.warning('VALIDATION', 'Missing required parameters', { sessionId: !!sessionId, message: !!message });
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    const restResult = await restApiClient.sendMessage(sessionId, message);
    const agentMessage = restResult.agentMessage || '';
    const rawResult = restResult;

    const duration = Date.now() - startTime;

    const parsedMessage = parseAgentResponse(agentMessage);

    logger.logResponse(method, endpoint, 200, duration, { sessionId, responseLength: agentMessage.length });

    // Build response
    const response = { agentMessage: parsedMessage };

    // Only include raw if debug param is true
    if (debug) {
      response.raw = rawResult;
    }

    serverLogger.clientResponse(endpoint, response);
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError(method, endpoint, error, duration);
    serverLogger.cliError('REST_API', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// End a session
app.delete('/api/agent/session/:sessionId', async (req, res) => {
  const method = 'DELETE';
  const endpoint = `/api/agent/session/:sessionId`;
  const startTime = Date.now();
  const { sessionId } = req.params;

  logger.logRequest(method, endpoint, { sessionId });

  try {
    logger.debug('[REST_API] Session end request', { sessionId });
    await restApiClient.endSession(sessionId);
    logger.info('>>> Session ended', { sessionId });

    const duration = Date.now() - startTime;

    const response = { success: true, sessionId };
    logger.logResponse(method, endpoint, 200, duration, response);
    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('>>> Failed to end session', { sessionId, error: error.message });
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
const TOKEN_TTL_SECONDS = Math.max(
  parseInt(process.env.TOKEN_TTL_SECONDS || '3600', 10),
  60
);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`, {
    environment: IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT',
    logLevel: LOG_LEVEL,
    tokenTtlSeconds: TOKEN_TTL_SECONDS
  });
});
