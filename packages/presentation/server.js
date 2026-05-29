const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    });
    return JSON.parse(result);
  } catch (error) {
    console.error('SF CLI error:', error.message);
    throw error;
  }
}

// Start a new agent session
app.post('/api/agent/session', (req, res) => {
  try {
    const result = runSfCommand(
      `sf agent preview start --json --authoring-bundle ${AGENT_NAME} --use-live-actions --target-org ${ORG_ALIAS}`
    );
    res.json({ sessionId: result.result.sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Send a message to the agent
app.post('/api/agent/message', (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  try {
    const escapedMessage = message.replace(/'/g, "'\\''");
    const result = runSfCommand(
      `sf agent preview send --json --authoring-bundle ${AGENT_NAME} --session-id ${sessionId} --utterance '${escapedMessage}' --target-org ${ORG_ALIAS}`
    );
    const agentMessage = result.result.messages[0]?.message || '';
    res.json({ agentMessage, raw: result.result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// End a session
app.delete('/api/agent/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  try {
    runSfCommand(
      `sf agent preview end --json --authoring-bundle ${AGENT_NAME} --session-id ${sessionId} --target-org ${ORG_ALIAS}`
    );
    res.json({ success: true });
  } catch (error) {
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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using org: ${ORG_ALIAS}, agent: ${AGENT_NAME}`);
  console.log(`Environment: ${IS_PRODUCTION ? 'PRODUCTION (serving static files)' : 'DEVELOPMENT'}`);
});
