const express = require('express');
const cors = require('cors');
const { execSync } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_DIR = path.resolve(__dirname, '../..');
const ORG_ALIAS = 'demo-org';
const AGENT_NAME = 'Quoting_Agent';

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Agent proxy server running on http://localhost:${PORT}`);
  console.log(`Using org: ${ORG_ALIAS}, agent: ${AGENT_NAME}`);
});
