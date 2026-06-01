export interface ApiLog {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration: number;
  error?: string;
  requestBody?: any;
  responseBody?: any;
}

const logs: ApiLog[] = [];

export const logger = {
  logRequest: (method: string, url: string, body?: any) => {
    console.log(`[API] ${method} ${url}`, body ? `Body: ${JSON.stringify(body)}` : '');
  },

  logResponse: (method: string, url: string, status: number, duration: number, body?: any) => {
    console.log(
      `[API] ${method} ${url} - ${status} (${duration}ms)`,
      body ? `Response: ${JSON.stringify(body).substring(0, 200)}...` : ''
    );

    logs.push({
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration,
      responseBody: body,
    });
  },

  logError: (method: string, url: string, error: string, duration: number) => {
    console.error(`[API] ${method} ${url} - Error: ${error} (${duration}ms)`);
    logs.push({
      timestamp: new Date().toISOString(),
      method,
      url,
      duration,
      error,
    });
  },

  getLogs: (): ApiLog[] => logs,

  clearLogs: () => {
    logs.length = 0;
  },

  exportLogs: (): string => {
    return JSON.stringify(logs, null, 2);
  },
};
