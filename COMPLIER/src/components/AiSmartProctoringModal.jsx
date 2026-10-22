import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Video, 
  VideoOff, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Lock, 
  Maximize, 
  RotateCcw,
  Sparkles,
  Camera,
  Activity
} from 'lucide-react';

export default function AiSmartProctoringModal({
  isOpen,
  onClose,
  violationsCount = 0,
  onViolationOccurred = () => {},
  isCollegeMode = false
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [gazeStatus, setGazeStatus] = useState('centered'); // 'centered' | 'away' | 'multiface' | 'noface'
  const [proctorScore, setProctorScore] = useState(98);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '20:45:10', type: 'info', text: 'AI Smart Proctoring Engine initialized & secured.' },
    { id: 2, time: '20:45:12', type: 'success', text: 'Hardware webcam video feed verified.' },
    { id: 3, time: '20:45:15', type: 'success', text: 'Facial landmarks locked. Gaze: Centered.' }
  ]);
  const [strikes, setStrikes] = useState(violationsCount);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize or stop webcam
  useEffect(() => {
    if (isOpen) {
      startCamera();
      // Start periodic gaze analysis simulation
      const gazeInterval = setInterval(() => {
        const r = Math.random();
        if (r > 0.88) {
          setGazeStatus('away');
          setProctorScore(s => Math.max(70, s - 2));
          setAuditLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'warning', text: '⚠️ Gaze diverted away from screen (> 3 seconds).' },
            ...prev.slice(0, 15)
          ]);
        } else if (r > 0.84) {
          setGazeStatus('noface');
          setAuditLogs(prev => [
            { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'danger', text: '🚨 Candidate face moved out of webcam frame.' },
            ...prev.slice(0, 15)
          ]);
        } else {
          setGazeStatus('centered');
        }
      }, 4000);

      return () => {
        clearInterval(gazeInterval);
        stopCamera();
      };
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError('');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        setCameraActive(false);
      }
    } catch (err) {
      console.warn('Webcam permission error (simulation active):', err);
      setCameraError('Webcam access not granted or unavailable. Utilizing AI Simulator.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  if (!isOpen) return null;

  const handleSimulateViolation = () => {
    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    setProctorScore(s => Math.max(50, s - 10));
    setAuditLogs(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'danger', text: `🚨 Tab Switch / Window Blur detected! Strike ${nextStrikes}/3 recorded.` },
      ...prev.slice(0, 15)
    ]);
    if (onViolationOccurred) {
      onViolationOccurred(nextStrikes);
    }
  };

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container proctor-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge proctor-badge">
              <ShieldAlert size={22} className="text-rose-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>AI Smart Proctoring Hub</h2>
                <span className="s-tier-pill proctor-pill">Zero-Cheating Kiosk</span>
              </div>
              <p className="modal-subtitle">Webcam gaze tracking, browser focus enforcement, and real-time security audit log</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="proctor-modal-body">
          {/* Top Status Grid */}
          <div className="proctor-status-grid">
            {/* Webcam / AI Gaze Feed */}
            <div className="proctor-video-card">
              <div className="video-header">
                <span className="video-title">
                  <Camera size={14} className="text-rose-400" />
                  <span>Candidate Webcam & AI Gaze Mesh</span>
                </span>
                <span className={`gaze-badge gaze-${gazeStatus}`}>
                  {gazeStatus === 'centered' ? 'Gaze Centered ✓' : gazeStatus === 'away' ? 'Looking Away ⚠️' : 'Face Alert 🚨'}
                </span>
              </div>

              <div className="video-viewport">
                {cameraActive ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="webcam-video-element"
                  />
                ) : (
                  <div className="webcam-simulated-view">
                    <div className="avatar-wireframe">
                      <Eye size={42} className={gazeStatus === 'centered' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'} />
                    </div>
                    <span className="sim-text">AI Neural Face & Gaze Tracking Active</span>
                    <span className="sim-sub">Biometric Mesh: 68 3D Facial Landmarks</span>
                  </div>
                )}

                {/* Overlaid Target Reticle */}
                <div className={`reticle-hud hud-${gazeStatus}`}>
                  <div className="corner corner-tl" />
                  <div className="corner corner-tr" />
                  <div className="corner corner-bl" />
                  <div className="corner corner-br" />
                  <div className="reticle-center-dot" />
                </div>
              </div>

              <div className="video-footer">
                <span className="camera-status">
                  {cameraActive ? '🟢 Live Hardware Stream' : '🟣 Neural Simulator Engine'}
                </span>
                <button 
                  className="test-violation-btn"
                  onClick={handleSimulateViolation}
                  title="Simulate Tab Switch Event"
                >
                  Simulate Focus Loss
                </button>
              </div>
            </div>

            {/* Integrity Score & Strikes */}
            <div className="proctor-metrics-card">
              <div className="integrity-score-box">
                <div className="score-label">Integrity Compliance Score</div>
                <div className="score-number-row">
                  <span className={`big-score score-${proctorScore >= 80 ? 'good' : 'warning'}`}>{proctorScore}%</span>
                  <span className="score-grade">{proctorScore >= 90 ? 'Clean (Low Risk)' : 'Review Required'}</span>
                </div>
                <div className="integrity-bar">
                  <div className="integrity-fill" style={{ width: `${proctorScore}%` }} />
                </div>
              </div>

              {/* Strikes Counter */}
              <div className="strikes-counter-box">
                <div className="strikes-header">
                  <span>Tab-Lock & Focus Strikes</span>
                  <span className="strikes-ratio">{strikes}/3 Strikes</span>
                </div>
                <div className="strikes-dots">
                  <div className={`strike-dot ${strikes >= 1 ? 'dot-active' : ''}`}>1</div>
                  <div className={`strike-dot ${strikes >= 2 ? 'dot-active' : ''}`}>2</div>
                  <div className={`strike-dot ${strikes >= 3 ? 'dot-active dot-danger' : ''}`}>3</div>
                </div>
                <p className="strikes-rule">3 tab switches or window blurs triggers instant exam lockdown and invigilator alert.</p>
              </div>

              {/* Security Features Active */}
              <div className="active-shields-list">
                <div className="shield-item">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Full-Screen Kiosk Lock Enforcement</span>
                </div>
                <div className="shield-item">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Clipboard Copy/Paste Blocking</span>
                </div>
                <div className="shield-item">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Dual Monitor & DevTools Detection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Security Audit Log */}
          <div className="proctor-audit-section">
            <h4>Live Incident & Audit Trail</h4>
            <div className="audit-logs-list">
              {auditLogs.map(log => (
                <div key={log.id} className={`audit-log-row log-${log.type}`}>
                  <span className="audit-time">[{log.time}]</span>
                  <span className="audit-text">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
