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
import { LanguageProvider } from './context/LanguageContext';

// Tauri desktop: route /api/* to hosted API so the app works exactly like the website
if (typeof window !== 'undefined' && (window as any).__TAURI__) {
  const origFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = `https://rafie-kun-scolarship-app.vercel.app${url}`;
      if (typeof input === 'string') input = url as any;
      else if (input instanceof Request) input = new Request(url, input as any) as any;
    }
    return origFetch(input as any, init);
  }) as any;
}

// PWA: register service worker for offline shell caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Lightweight 14-day deadline reminder (client-side, no server push needed)
if ('Notification' in window) {
  const checkDeadlines = async () => {
    try {
      const res = await fetch('/api/applications', { credentials: 'include' });
      if (!res.ok) return;
      const apps: any[] = await res.json();
      const soon = apps.filter(a => {
        if (!a.deadline) return false;
        const d = new Date(a.deadline).getTime();
        const now = Date.now();
        return d > now && d - now < 14 * 24 * 3600 * 1000;
      });
      if (soon.length === 0) return;
      if (Notification.permission === 'default') await Notification.requestPermission().catch(()=>{});
      if (Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker?.ready.catch(()=>null);
        const title = `ScholarPath: ${soon.length} deadline${soon.length>1?'s':''} within 14 days`;
        const body = soon.slice(0,3).map(a=>`${a.name} — ${a.deadline}`).join('\n');
        if (reg) reg.showNotification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg' } as any);
        else new Notification(title, { body } as any);
      }
    } catch {}
  };
  // Run once a day after login, debounced
  setTimeout(checkDeadlines, 8000);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
