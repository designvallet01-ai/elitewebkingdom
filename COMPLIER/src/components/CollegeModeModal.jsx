import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Unlock, 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  User,
  Building2,
  Laptop,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  verifyCollegeLogin, 
  registerSystem, 
  getCurrentMachineSystem,
  syncCollegesFromSupabase 
} from '../services/collegeService';

export default function CollegeModeModal({
  isOpen,
  mode = 'setup', // 'setup' | 'unlock' | 'summary'
  onClose,
  onActivateCollegeMode,
  onDeactivateCollegeMode,
  onOpenAdminPortal,
  currentPin,
  violationsCount = 0,
  studentInfo = {},
  examDuration = 0,
  code = ''
}) {
  // System Login Form Fields (ONLY OPTION on student system - NO Register)
  const [sysClgId, setSysClgId] = useState('EWK-COLLEGE-01');
  const [sysClgPassword, setSysClgPassword] = useState('');
  const [sysPcName, setSysPcName] = useState('LAB-PC-01');
  const [sysLabRoom, setSysLabRoom] = useState('Lab 1 - Ground Floor');
  const [examName, setExamName] = useState(studentInfo.examName || 'University Lab Practical Examination');
  const [studentRoll, setStudentRoll] = useState(studentInfo.studentRoll || '');
  const [studentName, setStudentName] = useState(studentInfo.studentName || '');
  const [errorMessage, setErrorMessage] = useState('');

  // Unlock PIN Field (Only needed when exiting exam)
  const [pinInput, setPinInput] = useState('');

  // Current system binding info
  const [boundSystem, setBoundSystem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentMachineSystem();
      setBoundSystem(current);
      if (current) {
        setSysClgId(current.collegeId || 'EWK-COLLEGE-01');
        setSysPcName(current.systemName || 'LAB-PC-01');
        setSysLabRoom(current.labRoom || 'Lab 1 - Ground Floor');
      }
      syncCollegesFromSupabase();
      setErrorMessage('');
      setPinInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format exam duration (seconds to HH:MM:SS)
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Submit System Login (College ID + Password + System ID - NO PIN needed to start)
  const handleSystemLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const college = verifyCollegeLogin(sysClgId, sysClgPassword);
    if (!college) {
      setErrorMessage('Invalid College ID or Password. Please check with your College Lab Admin.');
      return;
    }

    if (!sysPcName.trim()) {
      setErrorMessage('Please enter System ID (e.g. LAB-PC-01).');
      return;
    }

    try {
      // Bind this machine as the specified System ID under the college
      const res = registerSystem({
        collegeId: college.collegeId,
        password: college.password,
        systemName: sysPcName.trim().toUpperCase(),
        labRoom: sysLabRoom || 'Computer Lab'
      });

      // Activate College Exam mode on student machine
      // Admin/College master PIN is set for exit lock
      onActivateCollegeMode({
        collegeId: college.collegeId,
        systemId: res.system.systemId,
        systemName: res.system.systemName,
        examName: examName || `${college.collegeName} Lab Practical Exam`,
        studentRoll: studentRoll.trim().toUpperCase() || 'STUDENT',
        studentName: studentName.trim() || 'Student',
        pin: college.defaultPin || '1234'
      });
    } catch (err) {
      setErrorMessage(err.message || 'System Login failed.');
    }
  };

  // 2. Verify Invigilator PIN to Exit Exam Session
  const handleVerifyExitPin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (pinInput.trim() === String(currentPin || '1234').trim()) {
      setPinInput('');
      onDeactivateCollegeMode();
    } else {
      setErrorMessage('Incorrect Invigilator Security PIN. Please contact the Lab Incharge.');
    }
  };

  return (
    <div className="college-modal-overlay">
      <div className="college-modal-card">
        {/* Modal Header */}
        <div className="college-modal-header">
          <div className="college-modal-title">
            <div className="college-icon-badge">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3>
                {mode === 'setup' && 'College Lab System Login'}
                {mode === 'unlock' && 'Exit Exam Session'}
                {mode === 'summary' && 'Exam Session Completed'}
              </h3>
              <p>
                {mode === 'setup' && 'Enter College ID, Password, and System ID to start your session'}
                {mode === 'unlock' && 'Invigilator Security PIN is required to exit exam lockdown'}
                {mode === 'summary' && 'Your examination details and session analytics summary'}
              </p>
            </div>
          </div>

          {mode === 'setup' && (
            <button className="college-close-btn" onClick={onClose} title="Close window">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="college-error-banner">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==============================================================
            MODE 1: SETUP - ONLY SYSTEM LOGIN (NO REGISTER TABS)
            ============================================================== */}
        {mode === 'setup' && (
          <div className="college-modal-body">
            <form onSubmit={handleSystemLoginSubmit} className="college-form">
              <div className="clg-info-banner">
                <Laptop size={16} className="text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Student System Login:</strong> Connect this PC to your College Lab session. PIN is only needed by Admin to exit.
                </span>
              </div>

              {/* College Credentials */}
              <div className="college-grid-row">
                <div className="college-input-group">
                  <label className="college-label">
                    College ID / Code <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="college-input font-mono font-bold"
                    placeholder="e.g. EWK-COLLEGE-01"
                    value={sysClgId}
                    onChange={(e) => setSysClgId(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="college-input-group">
                  <label className="college-label">
                    College Password
                  </label>
                  <input
                    type="password"
                    className="college-input"
                    placeholder="Leave empty if not required"
                    value={sysClgPassword}
                    onChange={(e) => setSysClgPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* System ID & Room */}
              <div className="college-grid-row">
                <div className="college-input-group">
                  <label className="college-label">
                    System ID / Lab PC Name <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="college-input font-mono font-bold text-amber-300"
                    placeholder="e.g. LAB-PC-01"
                    value={sysPcName}
                    onChange={(e) => setSysPcName(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="college-input-group">
                  <label className="college-label">
                    Lab Room / Floor
                  </label>
                  <input
                    type="text"
                    className="college-input"
                    placeholder="e.g. Lab 1 - Ground Floor"
                    value={sysLabRoom}
                    onChange={(e) => setSysLabRoom(e.target.value)}
                  />
                </div>
              </div>

              {/* Student Details */}
              <div className="college-grid-row">
                <div className="college-input-group">
                  <label className="college-label">
                    Student Roll No / ID <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="college-input font-mono font-bold"
                    placeholder="e.g. 21071A0501"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="college-input-group">
                  <label className="college-label">Student Name</label>
                  <input
                    type="text"
                    className="college-input"
                    placeholder="e.g. Rahul Sharma"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
              </div>

              {/* Exam Title */}
              <div className="college-input-group">
                <label className="college-label">Examination Title</label>
                <input
                  type="text"
                  className="college-input"
                  placeholder="e.g. Data Structures & Algorithms Lab Exam"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="college-actions space-between">
                {onOpenAdminPortal && (
                  <button
                    type="button"
                    className="college-btn secondary portal-launch-btn"
                    onClick={() => onOpenAdminPortal()}
                    title="Open College Admin Portal to manage PIN and lock systems"
                    id="btn-launch-college-portal"
                  >
                    <Building2 size={15} />
                    <span>College Admin Portal</span>
                    <ExternalLink size={13} />
                  </button>
                )}

                <button type="submit" className="college-btn primary" id="btn-system-login-submit">
                  <Laptop size={15} />
                  <span>Login to System & Start</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 2: UNLOCK - INVIGILATOR PIN TO EXIT (PIN IS ONLY FOR EXIT)
            ============================================================== */}
        {mode === 'unlock' && (
          <div className="college-modal-body">
            <form onSubmit={handleVerifyExitPin} className="college-form">
              <div className="clg-info-banner">
                <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Exit Security:</strong> College Password is for login. To exit or end this exam session, enter the Invigilator Security PIN set by the College Admin.
                </span>
              </div>

              <div className="college-pin-box">
                <div className="pin-box-header">
                  <KeyRound size={16} />
                  <span>Enter Invigilator Security PIN to Exit:</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  className="college-input pin-input center-text font-mono font-bold text-amber-400"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <div className="college-actions">
                <button type="button" className="college-btn secondary" onClick={onClose}>
                  Cancel / Return to Exam
                </button>
                <button type="submit" className="college-btn primary" id="btn-verify-exit-pin">
                  <Unlock size={14} />
                  <span>Verify PIN & Exit</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 3: SUMMARY - EXAM SESSION COMPLETED
            ============================================================== */}
        {mode === 'summary' && (
          <div className="college-modal-body">
            <div className="college-summary-view">
              <div className="summary-badge-header">
                <CheckCircle2 size={36} className="text-emerald-400" />
                <h3>Examination Session Completed</h3>
              </div>

              <div className="exam-summary-card">
                <div className="summary-col">
                  <span className="summary-label">Exam Name:</span>
                  <span className="summary-val">{studentInfo.examName || 'Lab Exam'}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Student Roll No:</span>
                  <span className="summary-val">{studentInfo.studentRoll || 'N/A'}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Time Taken:</span>
                  <span className="summary-val">{formatTime(examDuration)}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Violations Flagged:</span>
                  <span className="summary-val">{violationsCount} Alert(s)</span>
                </div>
              </div>

              <div className="college-actions">
                <button type="button" className="college-btn primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
