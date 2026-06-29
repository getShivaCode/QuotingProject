import React from 'react';
import Presentation from './components/Presentation';
import HeadlessAgentForce from './components/HeadlessAgentForce';
import { SessionProvider } from './context/SessionContext';
import './App.css';

function App() {
  const showPresentation = new URLSearchParams(window.location.search).get('preso') === 'true';

  return (
    <SessionProvider>
      <div className="App">
        {showPresentation ? (
          <Presentation />
        ) : (
          <div style={{ padding: '1em', height: '100%', boxSizing: 'border-box' }}>
            <HeadlessAgentForce />
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

export default App;
