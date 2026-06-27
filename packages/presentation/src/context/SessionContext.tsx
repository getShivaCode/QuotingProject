import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SessionContextType {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  instanceUrl: string | null;
  setInstanceUrl: (url: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, instanceUrl, setInstanceUrl }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
