import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/sTierFeatures.css'
import App from './App.jsx'

// Comprehensive silencing for Monaco Editor's internal autocomplete & cancellation noise
const isCancelErr = (err) => {
  if (!err) return false;
  const str = typeof err === 'object' ? (err.message || err.stack || err.name || '') : String(err);
  return str.includes('Canceled') || str.includes('ERR Canceled') || str.includes('cancel');
};

const origConsoleError = console.error;
console.error = function (...args) {
  if (args.some(isCancelErr)) return;
  origConsoleError.apply(console, args);
};

const origConsoleWarn = console.warn;
console.warn = function (...args) {
  const msg = args.map(a => (typeof a === 'object' && a !== null ? a.message || a.stack || '' : String(a))).join(' ');
  if (msg.includes('Banner not shown') || msg.includes('beforeinstallprompt') || isCancelErr(msg)) {
    return;
  }
  origConsoleWarn.apply(console, args);
};

// Return true from window.onerror to suppress uncaught Monaco cancellation exceptions in browser DevTools
window.onerror = function (message, source, lineno, colno, error) {
  if (isCancelErr(message) || isCancelErr(error)) {
    return true;
  }
};

window.addEventListener('error', (event) => {
  if (isCancelErr(event.message) || isCancelErr(event.error)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  if (isCancelErr(event.reason)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

// Purge any old stale service worker caches (e.g. elite-ide-cache-v1) immediately
if (typeof caches !== 'undefined') {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name !== 'elite-ide-v4-realtime') {
        caches.delete(name);
      }
    });
  });
}

// Register Service Worker for PWA installation & auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/compiler/sw.js', { scope: '/compiler/' })
      .then((reg) => {
        // Force check for fresh SW and unblock stale cache immediately
        reg.update();
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

