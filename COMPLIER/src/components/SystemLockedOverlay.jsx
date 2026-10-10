import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

export default function SystemLockedOverlay({
  isLocked,
  correctPin,
  onUnlock
}) {
  const [pinText, setPinText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Focus the PIN input when lock screen appears
  useEffect(() => {
    if (isLocked) {
      setPinText('');
      setErrorMessage('');
      const t = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEntered = pinText.trim();
    const cleanExpected = String(correctPin || '1234').trim();

    if (!cleanEntered) {
      setErrorMessage('Please enter the Security PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (cleanEntered === cleanExpected) {
      setErrorMessage('');
      setPinText('');
      if (onUnlock) {
        onUnlock();
      }
    } else {
      setErrorMessage('Incorrect PIN. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div 
      className="system-kiosk-lock-overlay" 
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        // Prevent clicking behind
        e.stopPropagation();
        if (inputRef.current) inputRef.current.focus();
      }}
    >
      <div className={`system-kiosk-lock-box ${shake ? 'shake-animation' : ''}`}>
        <div className="lock-icon-halo">
          <Lock size={32} />
        </div>

        <h2 className="lock-main-title">SYSTEM LOCKED</h2>
        <p className="lock-sub-title">This system is locked by College Admin</p>

        <form onSubmit={handleSubmit} className="lock-action-form" onClick={(e) => e.stopPropagation()}>
          <div className="lock-input-wrap">
            <input
              ref={inputRef}
              type="password"
              maxLength={8}
              className="lock-pin-field"
              placeholder="Enter PIN"
              value={pinText}
              onChange={(e) => {
                setPinText(e.target.value.replace(/\D/g, ''));
                if (errorMessage) setErrorMessage('');
              }}
              autoFocus
              required
            />
          </div>

          {errorMessage && (
            <div className="lock-error-text">
              {errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="lock-accept-button"
            id="btn-lock-accept"
          >
            Accept
          </button>
        </form>
      </div>
    </div>
  );
}
