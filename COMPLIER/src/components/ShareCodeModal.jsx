import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  MessageCircle, 
  Send, 
  Code2, 
  Link2, 
  Sparkles,
  ExternalLink,
  QrCode
} from 'lucide-react';

export default function ShareCodeModal({
  isOpen,
  onClose,
  code = '',
  language = 'python',
  fileName = 'main.py'
}) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        // Safe base64 utf-8 encoding for URL
        const encodedCode = btoa(encodeURIComponent(code || ''));
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set('lang', language);
        url.searchParams.set('name', fileName);
        url.searchParams.set('code', encodedCode);
        setShareUrl(url.toString());
      } catch (err) {
        // Fallback for large code
        const fallbackUrl = new URL(window.location.origin + window.location.pathname);
        fallbackUrl.searchParams.set('lang', language);
        fallbackUrl.searchParams.set('name', fileName);
        setShareUrl(fallbackUrl.toString());
      }
    }
  }, [isOpen, code, language, fileName]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🔥 Check out this ${language.toUpperCase()} code on Elite Online Compiler & IDE!\n\n${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = encodeURIComponent(`Check out this ${language.toUpperCase()} code on Elite IDE:`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const charCount = code ? code.length : 0;
  const lineCount = code ? code.split('\n').length : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-box share-code-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="modal-title">Share Code Snippet</h3>
              <p className="modal-subtitle">Instant shareable URL permalink with language & code embedded</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          {/* Metadata pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={16} color="#38bdf8" />
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f1f5f9' }}>{fileName}</span>
              <span style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                {language}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {lineCount} lines • {charCount} chars
            </div>
          </div>

          {/* Share Link Input Box */}
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
            Permanent Link:
          </label>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '18px'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              overflow: 'hidden'
            }}>
              <Link2 size={15} color="#64748b" style={{ flexShrink: 0, marginRight: '8px' }} />
              <input 
                type="text" 
                readOnly 
                value={shareUrl}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  textOverflow: 'ellipsis'
                }}
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: copied ? '#10b981' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Quick Sharing Channels */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
              Instant Social Share:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                style={{
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  color: '#25d366',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <MessageCircle size={17} />
                <span>Share to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleTelegramShare}
                style={{
                  background: 'rgba(0, 136, 204, 0.12)',
                  border: '1px solid rgba(0, 136, 204, 0.35)',
                  color: '#38bdf8',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
                <span>Share to Telegram</span>
              </button>
            </div>
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px dashed rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              Anyone with this link will open Elite IDE with your exact code loaded and ready to run in cloud compiler!
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
