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
    console.log('Agent message:', data.agentMessage);

    // Try to parse the agent's message as JSON (when output_format is json)
    try {
      const parsed = JSON.parse(data.agentMessage);
      console.log('Parsed JSON:', parsed);
      return parsed as AgentMessage;
    } catch {
      // Text mode - wrap in our standard format
      console.log('Could not parse as JSON, wrapping as text');
      return {
        type: 'text',
        message: data.agentMessage,
        data: null,
        actions: [],
      };
    }
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
