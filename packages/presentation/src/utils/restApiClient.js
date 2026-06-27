const https = require('https');
const { URL } = require('url');
const logger = require('../../logger');

let cachedToken = null;
let tokenExpirationTime = 0;

// Parse TOKEN_TTL from env, default to 1 hour (3600000ms), minimum 1 minute
const TOKEN_TTL_MS = Math.max(
  parseInt(process.env.TOKEN_TTL_SECONDS || '3600', 10) * 1000,
  60000
);

async function getValidToken() {
  const currentTime = Date.now();

  // Proactive refresh: refresh if no token exists OR within 5 minutes of expiration
  if (!cachedToken || currentTime >= tokenExpirationTime - 300000) {
    logger.debug('[OAUTH] Token refresh triggered', {
      reason: !cachedToken ? 'no_token' : 'expiring_soon',
      ttlSeconds: TOKEN_TTL_MS / 1000
    });
    cachedToken = await acquireToken();
    tokenExpirationTime = currentTime + TOKEN_TTL_MS;
    logger.debug('[OAUTH] Token refreshed', { expiresInSeconds: TOKEN_TTL_MS / 1000 });
  }

  return cachedToken;
}

async function acquireToken() {
  const instanceUrl = process.env.SF_INSTANCE_URL;
  const clientId = process.env.EXTERNAL_APP_KEY;
  const clientSecret = process.env.EXTERNAL_APP_SECRET;

  if (!instanceUrl || !clientId || !clientSecret) {
    throw new Error('Missing OAuth credentials: SF_INSTANCE_URL, EXTERNAL_APP_KEY, or EXTERNAL_APP_SECRET');
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${instanceUrl}/services/oauth2/token`);
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    logger.debug('[OAUTH] Token request', { grantType: 'client_credentials' });

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`Token request failed with status ${res.statusCode}: ${data}`);
          }

          const tokenResponse = JSON.parse(data);
          logger.debug('[OAUTH] Token response', { statusCode: res.statusCode, expiresIn: tokenResponse.expires_in });
          resolve(tokenResponse.access_token);
        } catch (error) {
          reject(new Error(`Failed to parse token response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Token request failed: ${error.message}`));
    });

    req.write(body);
    req.end();
  });
}

async function initializeSession(agentId) {
  const token = await getValidToken();
  const instanceUrl = process.env.SF_INSTANCE_URL;

  return new Promise((resolve, reject) => {
    const url = new URL(
      `https://api.salesforce.com/einstein/ai-agent/v1/agents/${agentId}/sessions`
    );

    const requestBody = JSON.stringify({
      externalSessionKey: generateUUID(),
      instanceConfig: {
        endpoint: instanceUrl,
      },
      streamingCapabilities: {
        chunkTypes: ['Text'],
      },
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 201 && res.statusCode !== 200) {
            throw new Error(`Session init failed with status ${res.statusCode}: ${data}`);
          }

          const sessionResponse = JSON.parse(data);
          const sessionId = sessionResponse.sessionId || sessionResponse.id;
          resolve(sessionId);
        } catch (error) {
          reject(new Error(`Failed to parse session response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Session init request failed: ${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

async function sendMessage(sessionId, message) {
  const token = await getValidToken();

  return new Promise((resolve, reject) => {
    const url = new URL(
      `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${sessionId}/messages`
    );

    const requestBody = JSON.stringify({
      message: {
        sequenceId: Math.floor(Math.random() * 1000000),
        type: 'Text',
        text: message,
      },
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`Message send failed with status ${res.statusCode}: ${data}`);
          }

          const messageResponse = JSON.parse(data);
          const agentMessage = messageResponse.messages?.[0]?.message || '';

          resolve({
            messages: messageResponse.messages || [],
            agentMessage: agentMessage,
          });
        } catch (error) {
          reject(new Error(`Failed to parse message response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Message send request failed: ${error.message}`));
    });

    req.write(requestBody);
    req.end();
  });
}

async function endSession(sessionId) {
  const token = await getValidToken();

  return new Promise((resolve, reject) => {
    const url = new URL(
      `https://api.salesforce.com/einstein/ai-agent/v1/sessions/${sessionId}`
    );

    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-session-end-reason': 'UserRequest',
      },
    };

    const timeout = setTimeout(() => {
      req.abort();
      reject(new Error(`Session end request timed out after 10 seconds`));
    }, 10000);

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          logger.debug('[SESSION_DELETE] Response received', { statusCode: res.statusCode, data });
          if (res.statusCode !== 204 && res.statusCode !== 200) {
            throw new Error(`Session end failed with status ${res.statusCode}: ${data}`);
          }
          resolve(true);
        } catch (error) {
          reject(new Error(`Failed to end session: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Session end request failed: ${error.message}`));
    });

    req.end();
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  initializeSession,
  sendMessage,
  endSession,
};
