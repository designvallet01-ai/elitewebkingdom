import React, { useRef, useState, useEffect } from 'react';
import { 
  Globe, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ExternalLink, 
  Lock, 
  Maximize2, 
  Terminal, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function EmbeddedMiniBrowser({
  files = [],
  activeCode = '',
  isRunning = false
}) {
  const iframeRef = useRef(null);
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [url, setUrl] = useState('http://localhost:3000');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showConsoleDrawer, setShowConsoleDrawer] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  // Synthesize bundle from files
  const bundleHtml = () => {
    // 1. Look for index.html or html file
    const htmlFile = files.find(f => f.name.endsWith('.html')) || { code: '' };
    // 2. Look for CSS files
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const combinedCss = cssFiles.map(f => f.code).join('\n');
    // 3. Look for JS/JSX files
    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.jsx'));
    const combinedJs = jsFiles.map(f => f.code).join('\n');

    let baseHtml = htmlFile.code;
    if (!baseHtml && activeCode) {
      if (activeCode.includes('<html') || activeCode.includes('<!DOCTYPE') || activeCode.includes('<div')) {
        baseHtml = activeCode;
      }
    }

    if (!baseHtml) {
      baseHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 28px;
      background: linear-gradient(135deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94a3b8;
      max-width: 420px;
      line-height: 1.5;
    }
    .preview-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 24px;
      margin-top: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #2563eb;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="badge">⚡ Embedded Mini-Browser Sandbox</div>
  <h1>Elite Cloud Sandbox</h1>
  <p>Live hot-reloading preview active. Edit files or HTML/CSS/JS to observe immediate changes.</p>
  <div class="preview-card">
    <button class="btn" onclick="alert('Hello from Elite Sandbox!')">Interactive Demo Button</button>
  </div>
</body>
</html>`;
    }

    // Inject console interceptor
    const consoleInterceptor = `
<script>
(function() {
  const origLog = console.log;
  const origErr = console.error;
  const origWarn = console.warn;
  console.log = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'log', args: args.map(String).join(' ') }, '*');
    origLog.apply(console, args);
  };
  console.error = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'error', args: args.map(String).join(' ') }, '*');
    origErr.apply(console, args);
  };
  console.warn = function(...args) {
    window.parent.postMessage({ type: 'ELITE_PREVIEW_LOG', level: 'warn', args: args.map(String).join(' ') }, '*');
    origWarn.apply(console, args);
  };
})();
</script>
`;

    // Inject styles and scripts if not present
    let finalHtml = baseHtml;
    if (combinedCss) {
      finalHtml = finalHtml.replace('</head>', `<style>${combinedCss}</style></head>`);
    }
    if (combinedJs) {
      finalHtml = finalHtml.replace('</body>', `<script>${combinedJs}</script></body>`);
    }
    finalHtml = finalHtml.replace('<head>', `<head>${consoleInterceptor}`);

    return finalHtml;
  };

  const updatePreview = () => {
    if (!iframeRef.current) return;
    setIsReloading(true);
    const content = bundleHtml();
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(content);
      doc.close();
    }
    setTimeout(() => setIsReloading(false), 300);
  };

  useEffect(() => {
    updatePreview();
  }, [files, activeCode, isRunning]);

  // Listen to postMessages from preview iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'ELITE_PREVIEW_LOG') {
        setConsoleLogs(prev => [...prev.slice(-30), {
          id: Date.now() + Math.random(),
          level: e.data.level,
          text: e.data.args,
          time: new Date().toLocaleTimeString()
        }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleOpenExternal = () => {
    const blob = new Blob([bundleHtml()], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  return (
    <div className="mini-browser-container">
      {/* Browser Chrome Bar */}
      <div className="mini-browser-chrome">
        <div className="chrome-nav-buttons">
          <button className="chrome-btn" title="Back" disabled>
            <ArrowLeft size={13} />
          </button>
          <button className="chrome-btn" title="Forward" disabled>
            <ArrowRight size={13} />
          </button>
          <button 
            className={`chrome-btn ${isReloading ? 'spin-icon' : ''}`}
            onClick={updatePreview}
            title="Reload Hot-Preview"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Address Bar */}
        <div className="chrome-address-bar">
          <Lock size={12} className="text-emerald-400" />
          <input 
            type="text" 
            value={url} 
            onChange={e => setUrl(e.target.value)}
            className="address-input"
            title="Local Sandbox Address"
          />
          <span className="address-badge">PORT 3000</span>
        </div>

        {/* Viewport & Controls */}
        <div className="chrome-controls">
          <div className="viewport-toggle-group">
            <button
              className={`vp-btn ${viewport === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewport('desktop')}
              title="Desktop View (100%)"
            >
              <Monitor size={14} />
            </button>
            <button
              className={`vp-btn ${viewport === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
            >
              <Tablet size={14} />
            </button>
            <button
              className={`vp-btn ${viewport === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewport('mobile')}
              title="Mobile View (375px)"
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button 
            className={`chrome-btn ${showConsoleDrawer ? 'active' : ''}`}
            onClick={() => setShowConsoleDrawer(prev => !prev)}
            title="Toggle Mini DevTools Console"
          >
            <Terminal size={14} />
            {consoleLogs.length > 0 && <span className="dev-log-counter">{consoleLogs.length}</span>}
          </button>

          <button 
            className="chrome-btn"
            onClick={handleOpenExternal}
            title="Open Sandbox in New Window"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Frame Body */}
      <div className="mini-browser-body">
        <div className={`browser-frame-wrapper frame-${viewport}`}>
          <iframe
            ref={iframeRef}
            title="Elite Mini Browser Sandbox"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            className="mini-browser-iframe"
          />
        </div>
      </div>

      {/* Mini DevTools Console Drawer */}
      {showConsoleDrawer && (
        <div className="mini-devtools-drawer">
          <div className="devtools-header">
            <div className="devtools-title">
              <Terminal size={13} className="text-sky-400" />
              <span>Browser Sandbox Console</span>
            </div>
            <div className="devtools-actions">
              <button className="devtools-clear-btn" onClick={() => setConsoleLogs([])}>
                Clear
              </button>
              <button className="devtools-close-btn" onClick={() => setShowConsoleDrawer(false)}>
                ✕
              </button>
            </div>
          </div>
          <div className="devtools-body">
            {consoleLogs.length === 0 ? (
              <div className="devtools-empty">No console output yet. (console.log / warn / error will display here)</div>
            ) : (
              consoleLogs.map(log => (
                <div key={log.id} className={`log-line log-${log.level}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-level">{log.level.toUpperCase()}:</span>
                  <span className="log-text">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
