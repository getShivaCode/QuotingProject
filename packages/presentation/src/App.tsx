import React from 'react';
import Presentation from './components/Presentation';
import { SessionProvider } from './context/SessionContext';
import './App.css';

function App() {
  return (
    <SessionProvider>
      <div className="App">
        <Presentation />
      </div>
    </SessionProvider>
  );
}

export default App;
