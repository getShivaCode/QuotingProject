import { logger } from './logger';

const PROXY_URL = 'http://localhost:3001';

export interface AgentMessage {
  type: string;
  message: string;
  data: any;
  actions: string[];
}

export interface AgentSession {
  sessionId: string;
}

export async function startSession(): Promise<AgentSession> {
  const url = `${PROXY_URL}/api/agent/session`;
  const method = 'POST';
  const startTime = performance.now();

  logger.logRequest(method, url);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
    });

    const duration = performance.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      logger.logError(method, url, response.statusText, duration);
      throw new Error(`Failed to start session: ${response.statusText}`);
    }

    logger.logResponse(method, url, response.status, duration, data);
    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.logError(method, url, error instanceof Error ? error.message : String(error), duration);
    throw error;
  }
}

export async function sendMessage(sessionId: string, message: string): Promise<AgentMessage> {
  const url = `${PROXY_URL}/api/agent/message`;
  const method = 'POST';
  const requestBody = { sessionId, message };
  const startTime = performance.now();

  logger.logRequest(method, url, requestBody);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const duration = performance.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      logger.logError(method, url, response.statusText, duration);
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    logger.logResponse(method, url, response.status, duration, data);

    console.log('Agent response:', data);

    // Handle pre-parsed JSON from server
    if (typeof data.agentMessage === 'object' && data.agentMessage !== null) {
      console.log('Agent message is already parsed JSON');
      return data.agentMessage as AgentMessage;
    }

    // Handle string - try direct parse first
    if (typeof data.agentMessage === 'string') {
      try {
        const parsed = JSON.parse(data.agentMessage);
        console.log('Parsed JSON from string');
        return parsed as AgentMessage;
      } catch {
        // Agent outputs text + JSON together - extract JSON from end of message
        const jsonMatch = data.agentMessage.match(/\{[\s\S]*\}$/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('Extracted JSON from message');
            return extracted as AgentMessage;
          } catch (e) {
            console.log('Failed to extract JSON');
          }
        }

        // Just plain text, wrap it
        console.log('Plain text response');
        return {
          type: 'text',
          message: data.agentMessage,
          data: null,
          actions: [],
        };
      }
    }

    throw new Error('Unexpected agentMessage format');

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.logError(method, url, error instanceof Error ? error.message : String(error), duration);
    throw error;
  }
}

export async function endSession(sessionId: string): Promise<void> {
  const url = `${PROXY_URL}/api/agent/session/${sessionId}`;
  const method = 'DELETE';
  const startTime = performance.now();

  logger.logRequest(method, url);

  try {
    const response = await fetch(url, {
      method,
    });

    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logError(method, url, response.statusText, duration);
    } else {
      logger.logResponse(method, url, response.status, duration);
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.logError(method, url, error instanceof Error ? error.message : String(error), duration);
  }
}
