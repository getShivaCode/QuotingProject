import React, { useState } from 'react';
import Presentation from './components/Presentation';
import HeadlessAgentForce from './components/HeadlessAgentForce';
import { SessionProvider } from './context/SessionContext';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const showPresentation = new URLSearchParams(window.location.search).get('preso') === 'true';

  return (
    <SessionProvider>
      <div className="App">
        {showPresentation ? (
          <Presentation isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        ) : (
          <div className={`presentation-container headless-mode ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <HeadlessAgentForce isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </div>
        )}
      </div>
    </SessionProvider>
  );
}

export default App;
