import React, { useRef, useEffect } from 'react';
import { Globe, RefreshCw, Smartphone, Tablet, Monitor } from 'lucide-react';

export default function WebPreview({ code, isRunning }) {
  const iframeRef = useRef(null);
  const [viewport, setViewport] = React.useState('desktop'); // desktop, tablet, mobile

  const updatePreview = () => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(code || '<div style="color:#666;padding:20px;font-family:sans-serif;">No HTML content to render</div>');
      doc.close();
    }
  };

  useEffect(() => {
    updatePreview();
  }, [code, isRunning]);

  return (
    <div className="web-preview-container">
      <div className="web-preview-header">
        <div className="preview-title">
          <Globe size={15} />
          <span>Web Viewport Sandbox</span>
        </div>

        <div className="viewport-controls">
          <button
            className={`viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
            onClick={() => setViewport('desktop')}
            title="Desktop View (100%)"
          >
            <Monitor size={14} />
          </button>
          <button
            className={`viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
            onClick={() => setViewport('tablet')}
            title="Tablet View (768px)"
          >
            <Tablet size={14} />
          </button>
          <button
            className={`viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewport('mobile')}
            title="Mobile View (375px)"
          >
            <Smartphone size={14} />
          </button>
          <button
            className="viewport-btn"
            onClick={updatePreview}
            title="Reload Preview"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="web-preview-body">
        <div className={`preview-viewport-frame viewport-${viewport}`}>
          <iframe
            ref={iframeRef}
            title="Web Preview Sandbox"
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="preview-iframe"
          />
        </div>
      </div>
    </div>
  );
}
