import { logger } from './logger';

const PROXY_URL = typeof window !== 'undefined'
  ? window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : `${window.location.protocol}//${window.location.host}`
  : 'http://localhost:3001';

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

export async function sendMessage(sessionId: string, message: string, debug?: boolean): Promise<AgentMessage> {
  const url = `${PROXY_URL}/api/agent/message${debug ? '?debug=true' : ''}`;
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

    // Server now guarantees agentMessage is already properly parsed
    // (either JSON object when json_mode=True, or plain text object when json_mode=False)
    if (typeof data.agentMessage === 'object' && data.agentMessage !== null) {
      const agentMessage = data.agentMessage as AgentMessage;
      console.log('Agent message parsed as object', { type: agentMessage.type, debug: !!data.raw });
      return agentMessage;
    }

    // Fallback: if for some reason agentMessage is a string, try to parse it
    if (typeof data.agentMessage === 'string') {
      console.log('Agent message is string, attempting parse');
      try {
        const parsed = JSON.parse(data.agentMessage);
        return parsed as AgentMessage;
      } catch {
        // Return as plain text response
        return {
          type: 'text',
          message: data.agentMessage,
          data: null,
          actions: [],
        };
      }
    }

    throw new Error('Unexpected agentMessage format: expected object or string');

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logError(method, url, response.statusText, duration);
    }

    logger.logResponse(method, url, response.status, duration);
  } catch (error) {
    const duration = performance.now() - startTime;
    if (!(error instanceof Error && error.name === 'AbortError')) {
      logger.logError(method, url, error instanceof Error ? error.message : String(error), duration);
    }
  }
}
