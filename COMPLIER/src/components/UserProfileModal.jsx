import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  Terminal,
  Zap,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { getUserProfile, saveUserProfile, getOrCreateUserId } from '../services/compilerTelemetryService';

export default function UserProfileModal({
  isOpen,
  onClose,
  onProfileUpdated
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentId = getOrCreateUserId();
      setUserId(currentId);
      const existing = getUserProfile();
      if (existing) {
        setName(existing.name || '');
        setMobile(existing.mobile || '');
        setEmail(existing.email || '');
      }
      setSaveSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate dynamic initials for the avatar preview
  const getInitials = (str) => {
    if (!str || !str.trim()) return 'DEV';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopyId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const cleanName = (name || '').trim();
    const cleanMobile = (mobile || '').trim();
    const cleanEmail = (email || '').trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name or developer alias.');
      return;
    }

    if (!cleanMobile) {
      setErrorMessage('Please enter your active mobile or WhatsApp number.');
      return;
    }

    const digitsOnly = cleanMobile.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number (e.g. 9876543210).');
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address (e.g. name@example.com).');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveUserProfile({
        name: cleanName,
        mobile: cleanMobile,
        email: cleanEmail
      });

      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(saved);
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage('Failed to save profile: ' + (err.message || 'Network error'));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem('ewk_user_profile');
      setName('');
      setMobile('');
      setEmail('');
      setSaveSuccess(false);
      if (onProfileUpdated) {
        onProfileUpdated(null);
      }
    } catch (e) {}
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 9, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="user-profile-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(165deg, #0e172a 0%, #090e1a 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(0, 242, 254, 0.28)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 45px rgba(0, 242, 254, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Decorative Ambient Glow Bar */}
        <div 
          style={{
            height: '3px',
            width: '100%',
            background: 'linear-gradient(90deg, #00f2fe, #4f46e5, #ec4899, #00f2fe)',
            backgroundSize: '200% 100%'
          }} 
        />

        {/* Modal Header */}
        <div 
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(0, 242, 254, 0.06), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Dynamic Animated Avatar */}
            <div 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #4f46e5 60%, #7c3aed 100%)',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.5px',
                flexShrink: 0
              }}
            >
              {getInitials(name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700, letterSpacing: '-0.3px' }}>
                  Developer Profile
                </h3>
                <span 
                  style={{ 
                    fontSize: '0.66rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: '20px', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#34d399', 
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    letterSpacing: '0.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  VERIFIED
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Connect your identity to real-time compilation telemetry
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            aria-label="Close Modal"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} style={{ padding: '20px 24px 24px 24px' }}>
          {/* Developer System Identifier Badge */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              marginBottom: '20px',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} style={{ color: '#00f2fe' }} />
              Developer Node ID: <code style={{ color: '#f1f5f9', fontWeight: 700, fontFamily: 'monospace' }}>{userId}</code>
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              style={{
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '6px',
                padding: '3px 8px',
                color: copiedId ? '#34d399' : '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              {copiedId ? <Check size={12} /> : <Copy size={12} />}
              {copiedId ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.84rem',
                marginBottom: '16px',
                animation: 'shake 0.3s'
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0, color: '#f87171' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {saveSuccess && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6ee7b7',
                fontSize: '0.84rem',
                marginBottom: '16px'
              }}
            >
              <Check size={17} style={{ flexShrink: 0, color: '#34d399' }} />
              <span>Profile synchronized successfully with Real-time Admin Telemetry!</span>
            </div>
          )}

          {/* Field 1: Full Name */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label 
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  letterSpacing: '0.2px'
                }}
              >
                Developer Name / Full Name
              </label>
              <span style={{ fontSize: '0.68rem', color: '#00f2fe', fontWeight: 600, textTransform: 'uppercase' }}>Required</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#00f2fe',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <User size={16} />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson or Hacker-8978"
                maxLength={60}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00f2fe';
                  e.target.style.boxShadow = '0 0 16px rgba(0, 242, 254, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Field 2: Mobile Number */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label 
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  letterSpacing: '0.2px'
                }}
              >
                Mobile Number (WhatsApp Enabled)
              </label>
              <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Required</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10b981',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Phone size={16} />
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                maxLength={20}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Field 3: Email ID */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label 
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  letterSpacing: '0.2px'
                }}
              >
                Email Address
              </label>
              <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase' }}>Required</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#818cf8',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. developer@gmail.com"
                maxLength={100}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#818cf8';
                  e.target.style.boxShadow = '0 0 16px rgba(129, 140, 248, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Privacy & Admin Sync Guarantee Banner */}
          <div 
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.06), rgba(79, 70, 229, 0.08))',
              border: '1px solid rgba(0, 242, 254, 0.18)',
              marginBottom: '22px',
              fontSize: '0.78rem',
              color: '#94a3b8',
              lineHeight: 1.5,
              display: 'flex',
              gap: '10px'
            }}
          >
            <ShieldCheck size={18} style={{ color: '#00f2fe', flexShrink: 0, marginTop: '1px' }} />
            <span>
              Your profile is stored locally and securely streamed with your compilation telemetry, tagging your runs with a <strong style={{ color: '#38bdf8' }}>Verified Developer</strong> badge in the Admin Command Center.
            </span>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {(name || mobile || email) && (
              <button
                type="button"
                onClick={handleClear}
                title="Reset local profile"
                style={{
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                flex: 2,
                padding: '12px 18px',
                background: saveSuccess 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #00f2fe 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: saveSuccess 
                  ? '0 0 25px rgba(16, 185, 129, 0.45)' 
                  : '0 0 25px rgba(0, 242, 254, 0.38)',
                transition: 'all 0.2s',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 0 32px rgba(0, 242, 254, 0.55)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = saveSuccess 
                  ? '0 0 25px rgba(16, 185, 129, 0.45)' 
                  : '0 0 25px rgba(0, 242, 254, 0.38)';
              }}
            >
              {isSaving ? (
                <>
                  <span 
                    className="spinner" 
                    style={{ 
                      width: '15px', 
                      height: '15px', 
                      border: '2px solid rgba(255, 255, 255, 0.4)', 
                      borderTopColor: '#ffffff', 
                      borderRadius: '50%', 
                      display: 'inline-block', 
                      animation: 'spin 0.8s linear infinite' 
                    }} 
                  />
                  <span>Saving Profile...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={17} />
                  <span>Saved &amp; Synced!</span>
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
            <a 
              href="/verify-certificate.html" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: '0.8rem',
                color: '#fbbf24',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600
              }}
            >
              <span>🎓 Awarded an Official Certificate? Verify Credential in Registry ↗</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
