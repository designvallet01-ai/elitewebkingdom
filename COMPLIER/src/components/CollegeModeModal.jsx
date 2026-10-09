import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  KeyRound, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  User,
  School
} from 'lucide-react';

export default function CollegeModeModal({
  isOpen,
  mode = 'setup', // 'setup' | 'unlock' | 'locked_screen' | 'summary'
  onClose,
  onActivateCollegeMode,
  onDeactivateCollegeMode,
  currentPin,
  violationsCount = 0,
  studentInfo = {},
  examDuration = 0,
  code = ''
}) {
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [examName, setExamName] = useState(studentInfo.examName || 'University Lab Practical Exam');
  const [studentRoll, setStudentRoll] = useState(studentInfo.studentRoll || '');
  const [studentName, setStudentName] = useState(studentInfo.studentName || '');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Format exam duration (seconds to HH:MM:SS)
  const formatTime = (secs) => {
    const h = Math.floor(secs / 360);
    const m = Math.floor((secs % 360) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Admin activating College Mode
  const handleActivate = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!pinInput || pinInput.length < 4) {
      setErrorMessage('Admin PIN must be at least 4 digits');
      return;
    }

    if (pinInput !== confirmPinInput) {
      setErrorMessage('PIN and Confirm PIN do not match');
      return;
    }

    if (!studentRoll.trim()) {
      setErrorMessage('Please enter Student Roll Number / ID');
      return;
    }

    onActivateCollegeMode({
      pin: pinInput,
      examName: examName.trim() || 'College Lab Exam',
      studentRoll: studentRoll.trim(),
      studentName: studentName.trim() || 'Student'
    });
    setPinInput('');
    setConfirmPinInput('');
  };

  // Handle unlocking / deactivating with PIN
  const handleVerifyPin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (pinInput === currentPin) {
      onDeactivateCollegeMode();
      setPinInput('');
    } else {
      setErrorMessage('Incorrect Admin PIN. Please contact your College Invigilator.');
      setPinInput('');
    }
  };

  return (
    <div className={`college-modal-backdrop ${mode === 'locked_screen' ? 'lockdown-active' : ''}`}>
      <div className={`college-modal-card ${mode === 'locked_screen' ? 'card-security-alert' : ''}`}>
        
        {/* Modal Header */}
        <div className="college-modal-header">
          <div className="modal-title-group">
            <div className={`college-icon-badge ${mode === 'locked_screen' ? 'danger' : 'primary'}`}>
              {mode === 'locked_screen' ? (
                <ShieldAlert size={22} className="alert-pulse" />
              ) : (
                <GraduationCap size={22} />
              )}
            </div>
            <div>
              <h2 className="college-modal-title">
                {mode === 'setup' && 'Activate College Exam Mode'}
                {mode === 'unlock' && 'Exit College Exam Mode'}
                {mode === 'locked_screen' && 'EXAM LOCKDOWN TRIGGERED'}
                {mode === 'summary' && 'Exam Session Completed'}
              </h2>
              <p className="college-modal-subtitle">
                {mode === 'setup' && 'Lockdown IDE with Fullscreen & Anti-Cheating Monitoring'}
                {mode === 'unlock' && 'Faculty / Admin PIN required to end or pause exam session'}
                {mode === 'locked_screen' && 'Fullscreen exited or Tab-switch detected! Invigilator PIN required.'}
                {mode === 'summary' && 'Exam submitted successfully with session statistics'}
              </p>
            </div>
          </div>

          {mode === 'setup' && (
            <button className="college-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="college-modal-body">
          {errorMessage && (
            <div className="college-error-alert" role="alert">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE 1: SETUP & ACTIVATE */}
          {mode === 'setup' && (
            <form onSubmit={handleActivate} className="college-form">
              <div className="college-input-group">
                <label className="college-label">
                  <School size={14} /> Exam / Subject Name
                </label>
                <input
                  type="text"
                  className="college-input"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms Lab Exam"
                  required
                />
              </div>

              <div className="college-grid-row">
                <div className="college-input-group">
                  <label className="college-label">
                    <User size={14} /> Student Roll No / ID <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="college-input"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    placeholder="e.g. 21B91A0501"
                    required
                  />
                </div>

                <div className="college-input-group">
                  <label className="college-label">
                    <User size={14} /> Student Name
                  </label>
                  <input
                    type="text"
                    className="college-input"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
              </div>

              <div className="college-pin-box">
                <div className="pin-box-header">
                  <KeyRound size={16} className="text-accent" />
                  <span>College Admin / Faculty Secret PIN (4-6 digits)</span>
                </div>
                <p className="pin-box-note">
                  This PIN will be required by the faculty to unlock or exit the exam. Students cannot exit without this PIN!
                </p>

                <div className="college-grid-row">
                  <div className="college-input-group">
                    <label className="college-label">Set Admin PIN <span className="req-star">*</span></label>
                    <input
                      type="password"
                      maxLength={8}
                      className="college-input pin-input"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="e.g. 1234"
                      required
                    />
                  </div>

                  <div className="college-input-group">
                    <label className="college-label">Confirm PIN <span className="req-star">*</span></label>
                    <input
                      type="password"
                      maxLength={8}
                      className="college-input pin-input"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      placeholder="Repeat PIN"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="college-features-list">
                <div className="feature-item">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Forces Fullscreen & locks browser navigation</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Detects Tab-switching and window minimize violations</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Disables DevTools (F12, Inspect, Ctrl+Shift+I) and shortcut bypasses</span>
                </div>
              </div>

              <div className="college-actions">
                <button type="button" className="college-btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="college-btn primary">
                  <Lock size={15} />
                  <span>Activate & Enter Fullscreen Exam</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 2 & 3: UNLOCK OR SECURITY LOCKDOWN */}
          {(mode === 'unlock' || mode === 'locked_screen') && (
            <form onSubmit={handleVerifyPin} className="college-form">
              {mode === 'locked_screen' && (
                <div className="security-violation-banner">
                  <ShieldAlert size={28} className="danger-icon" />
                  <div>
                    <h4>Exam Security Violation Detected!</h4>
                    <p>
                      The student attempted to exit fullscreen or switch away from the exam tab.
                      <br />
                      <strong>Total Violations Logged: {violationsCount}</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="exam-summary-card">
                <div className="summary-col">
                  <span className="summary-label">Student Roll No:</span>
                  <span className="summary-val">{studentInfo.studentRoll || 'N/A'}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Student Name:</span>
                  <span className="summary-val">{studentInfo.studentName || 'Student'}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Exam Duration:</span>
                  <span className="summary-val">{formatTime(examDuration)}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Violations Count:</span>
                  <span className={`summary-val ${violationsCount > 0 ? 'text-danger' : 'text-success'}`}>
                    {violationsCount} {violationsCount > 2 ? '⚠️ High Risk' : ''}
                  </span>
                </div>
              </div>

              <div className="college-input-group pin-verify-group">
                <label className="college-label">
                  <KeyRound size={15} /> Enter Faculty / Admin PIN to {mode === 'locked_screen' ? 'Resume Exam' : 'End Exam'}
                </label>
                <input
                  type="password"
                  maxLength={8}
                  className="college-input pin-input center-text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN"
                  autoFocus
                  required
                />
              </div>

              <div className="college-actions">
                {mode === 'unlock' && (
                  <button type="button" className="college-btn secondary" onClick={onClose}>
                    Resume Exam (Stay in Fullscreen)
                  </button>
                )}
                <button type="submit" className={`college-btn ${mode === 'locked_screen' ? 'danger' : 'primary'}`}>
                  <Unlock size={15} />
                  <span>Verify PIN & {mode === 'locked_screen' ? 'Unlock Screen' : 'Exit Exam'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: SUMMARY REPORT */}
          {mode === 'summary' && (
            <div className="college-summary-view">
              <div className="summary-badge-header">
                <CheckCircle2 size={36} className="text-success" />
                <h3>Exam Submitted Successfully</h3>
              </div>

              <div className="exam-summary-card">
                <div className="summary-col">
                  <span className="summary-label">Exam:</span>
                  <span className="summary-val">{studentInfo.examName}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Roll No:</span>
                  <span className="summary-val">{studentInfo.studentRoll}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-val">{formatTime(examDuration)}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Integrity Violations:</span>
                  <span className={`summary-val ${violationsCount === 0 ? 'text-success' : 'text-danger'}`}>
                    {violationsCount} violation(s)
                  </span>
                </div>
              </div>

              <div className="college-actions">
                <button type="button" className="college-btn primary" onClick={onClose}>
                  Done & Return to IDE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
