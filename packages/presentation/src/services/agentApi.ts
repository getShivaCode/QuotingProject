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
  const response = await fetch(`${PROXY_URL}/api/agent/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to start session: ${response.statusText}`);
  }
  return response.json();
}

export async function sendMessage(sessionId: string, message: string): Promise<AgentMessage> {
  const response = await fetch(`${PROXY_URL}/api/agent/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
  const data = await response.json();

  // Try to parse the agent's message as JSON (when output_format is json)
  try {
    const parsed = JSON.parse(data.agentMessage);
    return parsed as AgentMessage;
  } catch {
    // Text mode - wrap in our standard format
    return {
      type: 'text',
      message: data.agentMessage,
      data: null,
      actions: [],
    };
  }
}

export async function endSession(sessionId: string): Promise<void> {
  await fetch(`${PROXY_URL}/api/agent/session/${sessionId}`, {
    method: 'DELETE',
  });
}
