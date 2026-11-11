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
  Users,
  Radio,
  Power
} from 'lucide-react';

export default function ShareCodeModal({
  isOpen,
  onClose,
  code = '',
  language = 'python',
  fileName = 'main.py',
  isLiveMode = false,
  liveRoomId = null,
  liveStatus = 'idle',
  livePeers = [],
  onToggleLiveMode,
  onEndLiveSession
}) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      if (isLiveMode && liveRoomId) {
        url.searchParams.set('live', liveRoomId);
      }
      url.searchParams.set('lang', language);
      url.searchParams.set('name', fileName);

      // Include code seed (safe base64 utf-8) if reasonably sized for URLs
      const encodedCode = btoa(encodeURIComponent(code || ''));
      if (!isLiveMode || encodedCode.length < 3600) {
        url.searchParams.set('code', encodedCode);
      }
      setShareUrl(url.toString());
    } catch (err) {
      const fallbackUrl = new URL(window.location.origin + window.location.pathname);
      if (isLiveMode && liveRoomId) {
        fallbackUrl.searchParams.set('live', liveRoomId);
      }
      fallbackUrl.searchParams.set('lang', language);
      fallbackUrl.searchParams.set('name', fileName);
      setShareUrl(fallbackUrl.toString());
    }
  }, [isOpen, code, language, fileName, isLiveMode, liveRoomId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = isLiveMode
      ? encodeURIComponent(
          `⚡ Join my LIVE Interactive Workspace (${language.toUpperCase()}) on Elite IDE — we can edit and run code together in real time!\n\n${shareUrl}`
        )
      : encodeURIComponent(
          `🔥 Check out this ${language.toUpperCase()} code on Elite Online Compiler & IDE!\n\n${shareUrl}`
        );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = isLiveMode
      ? encodeURIComponent(`Join my LIVE Interactive Workspace (${language.toUpperCase()}) on Elite IDE:`)
      : encodeURIComponent(`Check out this ${language.toUpperCase()} code on Elite IDE:`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${text}`, '_blank');
  };

  const charCount = code ? code.length : 0;
  const lineCount = code ? code.split('\n').length : 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-box share-code-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '94%' }}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge" style={{
              background: isLiveMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.15)',
              color: isLiveMode ? '#34d399' : '#38bdf8'
            }}>
              {isLiveMode ? <Radio size={20} /> : <Share2 size={20} />}
            </div>
            <div>
              <h3 className="modal-title">
                {isLiveMode ? 'Live Interactive Workspace' : 'Share Code Workspace'}
              </h3>
              <p className="modal-subtitle">
                {isLiveMode
                  ? 'Real-time co-editing room active • Share link to collaborate live'
                  : 'Share a static snapshot or enable Live Interactive co-editing'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '18px 22px' }}>
          {/* Interactive Live Workspace Toggle Card */}
          <div className={`live-share-toggle-card ${isLiveMode ? 'active' : ''}`}>
            <div className="live-toggle-left">
              <div className="live-toggle-title-row">
                <Users size={16} className={isLiveMode ? 'text-emerald' : 'text-cyan'} />
                <span className="live-toggle-title">Interactive Live Workspace</span>
                <span className={`live-mode-badge ${isLiveMode ? 'on' : 'off'}`}>
                  {isLiveMode ? 'LIVE SYNC ON' : 'SNAPSHOT'}
                </span>
              </div>
              <p className="live-toggle-desc">
                {isLiveMode
                  ? 'Anyone opening this link can edit code, switch languages & see live cursors with you at the same time!'
                  : 'Turn ON to collaborate in real time — anyone with the link can edit live together.'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLiveMode}
              id="toggle-live-share-switch"
              className={`live-toggle-switch ${isLiveMode ? 'on' : ''}`}
              onClick={() => onToggleLiveMode?.(!isLiveMode)}
              title={isLiveMode ? 'Turn OFF Live Interactive Mode' : 'Turn ON Live Interactive Mode'}
            >
              <span className="live-toggle-thumb" />
            </button>
          </div>

          {/* Live Room Status & Collaborators List */}
          {isLiveMode && liveRoomId && (
            <div className="live-room-status-box">
              <div className="live-room-top">
                <div className="live-room-meta">
                  <span className={`live-status-dot ${liveStatus === 'connected' ? 'online' : 'connecting'}`} />
                  <span className="live-room-label">
                    Room: <code>{liveRoomId}</code>
                  </span>
                  <span className="live-peers-count">
                    {Math.max(1, livePeers.length)} Online
                  </span>
                </div>

                {onEndLiveSession && (
                  <button
                    type="button"
                    className="live-stop-btn"
                    onClick={onEndLiveSession}
                    title="Disconnect from Live Workspace"
                  >
                    <Power size={12} />
                    <span>Leave</span>
                  </button>
                )}
              </div>

              {livePeers.length > 0 && (
                <div className="live-peers-strip">
                  {livePeers.map((peer) => (
                    <span
                      key={peer.clientId}
                      className="live-peer-chip"
                      style={{ borderColor: `${peer.color}55`, background: `${peer.color}18` }}
                    >
                      <span className="live-peer-dot" style={{ backgroundColor: peer.color }} />
                      <span>{peer.name}{peer.isSelf ? ' (You)' : ''}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Metadata pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '9px 14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <Code2 size={16} color="#38bdf8" />
              <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName}
              </span>
              <span style={{
                fontSize: '0.7rem',
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
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', flexShrink: 0 }}>
              {lineCount} lines • {charCount} chars
            </div>
          </div>

          {/* Share Link Input Box */}
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
            {isLiveMode ? 'Live Interactive Invite Link:' : 'Permanent Snapshot Link:'}
          </label>
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              flex: 1,
              position: 'relative',
              background: 'rgba(6, 10, 20, 0.8)',
              border: isLiveMode ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              overflow: 'hidden'
            }}>
              <Link2 size={15} color={isLiveMode ? '#34d399' : '#64748b'} style={{ flexShrink: 0, marginRight: '8px' }} />
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
                  textOverflow: 'ellipsis',
                  padding: '9px 0'
                }}
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: copied
                  ? 'linear-gradient(180deg, #10b981, #059669)'
                  : isLiveMode
                  ? 'linear-gradient(180deg, #10b981, #059669)'
                  : 'linear-gradient(180deg, #0ea5e9, #0284c7)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '8px',
                padding: '10px 15px',
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
              <span>{copied ? 'Copied!' : isLiveMode ? 'Copy Live Link' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Quick Sharing Channels */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
              {isLiveMode ? 'Invite Collaborators Instantly:' : 'Instant Social Share:'}
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
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <MessageCircle size={17} />
                <span>WhatsApp</span>
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
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          <div style={{
            background: isLiveMode ? 'rgba(16, 185, 129, 0.07)' : 'rgba(56, 189, 248, 0.05)',
            border: isLiveMode ? '1px dashed rgba(52, 211, 153, 0.32)' : '1px dashed rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color={isLiveMode ? '#34d399' : '#38bdf8'} style={{ flexShrink: 0 }} />
            <span>
              {isLiveMode
                ? 'Live Mode keeps your code, language selection, cursor positions, and run results synchronized across all joined browsers & phones!'
                : 'Anyone with this link opens Elite IDE with a copy of your code ready to run.'}
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '12px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
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
