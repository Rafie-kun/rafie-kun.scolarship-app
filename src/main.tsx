import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Safely suppress expected websocket connection failures inside our sandboxed environment
if (typeof window !== 'undefined') {
  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (reason && (
      String(reason).includes('WebSocket') || 
      String(reason).includes('websocket') || 
      (reason.message && String(reason.message).includes('WebSocket'))
    )) {
      event.preventDefault();
      console.debug('Silenced expected development environment WebSocket rejection.');
    }
  };

  const handleError = (event: ErrorEvent) => {
    if (event.message && (
      event.message.includes('WebSocket') ||
      event.message.includes('websocket')
    )) {
      event.preventDefault();
      console.debug('Silenced expected development environment WebSocket error.');
    }
  };

  window.addEventListener('unhandledrejection', handleRejection);
  window.addEventListener('error', handleError);
}

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
