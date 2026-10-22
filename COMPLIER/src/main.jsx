import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/sTierFeatures.css'
import App from './App.jsx'

// Silence Monaco Editor's internal autocomplete/blur cancellation noise
const origConsoleError = console.error;
console.error = function (...args) {
  const msg = args.map(a => (typeof a === 'object' && a !== null ? a.message || a.stack || '' : String(a))).join(' ');
  if (msg.includes('ERR Canceled') || msg.includes('Canceled: Canceled')) {
    return;
  }
  origConsoleError.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.message === 'Canceled' || event.reason.name === 'Canceled')) {
    event.preventDefault();
  }
});

// Register Service Worker for PWA installation & standalone performance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/compiler/sw.js', { scope: '/compiler/' })
      .then((reg) => {
        console.log('[Elite IDE] Service Worker active, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Elite IDE] Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
