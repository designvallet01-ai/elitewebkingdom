import React, { useState, useEffect } from 'react';
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
  School,
  Building2,
  Laptop,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Radio,
  FileCheck2
} from 'lucide-react';
import { 
  getRegisteredColleges, 
  registerCollege, 
  verifyCollegeLogin, 
  registerSystem, 
  getCurrentMachineSystem,
  syncCollegesFromSupabase 
} from '../services/collegeService';

export default function CollegeModeModal({
  isOpen,
  mode = 'setup', // 'setup' | 'unlock' | 'locked_screen' | 'summary'
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
  // Primary Tabs in College Mode: 'register' | 'lock'
  const [primaryTab, setPrimaryTab] = useState('register'); // 'register' | 'lock'
  
  // Sub-tabs under Register: 'college_register' | 'system_register'
  const [registerSubTab, setRegisterSubTab] = useState('college_register');

  // College Register Form Fields
  const [clgName, setClgName] = useState('');
  const [clgId, setClgId] = useState('');
  const [clgDept, setClgDept] = useState('Computer Science & Engineering');
  const [clgEmail, setClgEmail] = useState('');
  const [clgPassword, setClgPassword] = useState('');
  const [clgDefaultPin, setClgDefaultPin] = useState('1234');
  const [clgRegSuccess, setClgRegSuccess] = useState('');

  // System Register Form Fields (For colleges already registered)
  const [sysClgId, setSysClgId] = useState('');
  const [sysClgPassword, setSysClgPassword] = useState('');
  const [sysPcName, setSysPcName] = useState('');
  const [sysLabRoom, setSysLabRoom] = useState('Lab 1 - Ground Floor');
  const [sysRegSuccess, setSysRegSuccess] = useState('');

  // Lock / Exam Setup Fields
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [examName, setExamName] = useState(studentInfo.examName || 'University Lab Practical Exam');
  const [studentRoll, setStudentRoll] = useState(studentInfo.studentRoll || '');
  const [studentName, setStudentName] = useState(studentInfo.studentName || '');
  const [errorMessage, setErrorMessage] = useState('');

  // Current system binding info
  const [boundSystem, setBoundSystem] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentMachineSystem();
      setBoundSystem(current);
      if (current) {
        setSysClgId(current.collegeId);
      }
      syncCollegesFromSupabase();
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

  // 1. Submit College Registration
  const handleCollegeRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setClgRegSuccess('');

    try {
      const created = registerCollege({
        collegeName: clgName,
        collegeId: clgId,
        department: clgDept,
        adminEmail: clgEmail,
        password: clgPassword,
        defaultPin: clgDefaultPin
      });

      setClgRegSuccess(`College "${created.collegeName}" (${created.collegeId}) registered successfully! ID and Password created.`);
      setSysClgId(created.collegeId);
      setSysClgPassword(created.password);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register college.');
    }
  };

  // 2. Submit System (Lab PC) Registration
  const handleSystemRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSysRegSuccess('');

    try {
      const res = registerSystem({
        collegeId: sysClgId,
        password: sysClgPassword,
        systemName: sysPcName,
        labRoom: sysLabRoom
      });

      setBoundSystem(res.system);
      setSysRegSuccess(`✅ This computer is registered as "${res.system.systemName}" under ${res.college.collegeName} (${res.college.collegeId})!`);
    } catch (err) {
      setErrorMessage(err.message || 'System registration failed.');
    }
  };

  // 3. Handle Admin Activating Exam Lockdown
  const handleActivateLock = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!pinInput || pinInput.length < 4) {
      setErrorMessage('Admin Security PIN must be at least 4 digits');
      return;
    }

    if (pinInput !== confirmPinInput) {
      setErrorMessage('Security PIN and Confirm PIN do not match');
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

  // 4. Handle PIN verification for Unlock
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
              <h3 className="college-modal-title">
                {mode === 'setup' && 'College Lab Management & Lockdown'}
                {mode === 'unlock' && 'Admin PIN Required to Exit'}
                {mode === 'locked_screen' && 'SECURITY LOCKDOWN ACTIVATED'}
                {mode === 'summary' && 'Exam Session Completed'}
              </h3>
              <p className="college-modal-subtitle">
                {mode === 'setup' && 'Register College, Bind Lab Systems, or Lock Machine for Exams'}
                {mode === 'unlock' && 'Enter the Invigilator / Admin PIN to end this examination'}
                {mode === 'locked_screen' && 'Potential Cheating or Window Blur Detected!'}
                {mode === 'summary' && 'Exam summary report and student submission details'}
              </p>
            </div>
          </div>

          {mode !== 'locked_screen' && (
            <button className="college-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="college-error-alert">
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==============================================================
            MODE 1: SETUP (Contains 2 Options: Register & Lock)
            ============================================================== */}
        {mode === 'setup' && (
          <div className="college-modal-body">
            {/* Primary Option Switcher: [ 📝 Register ] vs [ 🔒 Lock ] */}
            <div className="college-primary-tabs-nav">
              <button
                type="button"
                className={`clg-primary-tab-btn ${primaryTab === 'register' ? 'active' : ''}`}
                onClick={() => setPrimaryTab('register')}
                id="btn-clg-tab-register"
              >
                <School size={16} />
                <span>1. Register</span>
                <span className="clg-tab-badge">College & System</span>
              </button>

              <button
                type="button"
                className={`clg-primary-tab-btn ${primaryTab === 'lock' ? 'active' : ''}`}
                onClick={() => setPrimaryTab('lock')}
                id="btn-clg-tab-lock"
              >
                <Lock size={16} />
                <span>2. Lock</span>
                <span className="clg-tab-badge">Exam Lockdown</span>
              </button>
            </div>

            {/* OPTION 1: REGISTER (Sub-options: College Register vs System Register) */}
            {primaryTab === 'register' && (
              <div className="college-register-container">
                {/* Segmented Sub-tabs */}
                <div className="clg-subtab-switcher">
                  <button
                    type="button"
                    className={`clg-subtab-btn ${registerSubTab === 'college_register' ? 'active' : ''}`}
                    onClick={() => { setRegisterSubTab('college_register'); setErrorMessage(''); }}
                    id="subtab-college-register"
                  >
                    <Building2 size={14} />
                    <span>College Register</span>
                  </button>

                  <button
                    type="button"
                    className={`clg-subtab-btn ${registerSubTab === 'system_register' ? 'active' : ''}`}
                    onClick={() => { setRegisterSubTab('system_register'); setErrorMessage(''); }}
                    id="subtab-system-register"
                  >
                    <Laptop size={14} />
                    <span>System Register</span>
                  </button>
                </div>

                {/* Sub-Option A: College Register */}
                {registerSubTab === 'college_register' && (
                  <form onSubmit={handleCollegeRegisterSubmit} className="college-form">
                    <div className="clg-info-banner">
                      <School size={15} className="text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>New College Setup:</strong> Register college details and create your College ID & Admin Password.
                      </span>
                    </div>

                    {clgRegSuccess && (
                      <div className="college-success-card">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <div>
                          <div className="success-title">{clgRegSuccess}</div>
                          <div className="success-note">Now you can register lab computers or launch the Admin Portal.</div>
                        </div>
                      </div>
                    )}

                    <div className="college-input-group">
                      <label className="college-label">College / University Name <span className="req-star">*</span></label>
                      <input
                        type="text"
                        className="college-input"
                        placeholder="e.g. Jawaharlal Nehru Technological University"
                        value={clgName}
                        onChange={(e) => setClgName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="college-grid-row">
                      <div className="college-input-group">
                        <label className="college-label">College ID / Code <span className="req-star">*</span></label>
                        <input
                          type="text"
                          className="college-input font-mono font-bold"
                          placeholder="e.g. JNTU-CSE"
                          value={clgId}
                          onChange={(e) => setClgId(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="college-input-group">
                        <label className="college-label">Department / Branch</label>
                        <input
                          type="text"
                          className="college-input"
                          placeholder="e.g. Computer Science"
                          value={clgDept}
                          onChange={(e) => setClgDept(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="college-grid-row">
                      <div className="college-input-group">
                        <label className="college-label">Admin Email</label>
                        <input
                          type="email"
                          className="college-input"
                          placeholder="lab.admin@college.edu.in"
                          value={clgEmail}
                          onChange={(e) => setClgEmail(e.target.value)}
                        />
                      </div>

                      <div className="college-input-group">
                        <label className="college-label">Create Admin Password <span className="req-star">*</span></label>
                        <input
                          type="password"
                          className="college-input font-mono"
                          placeholder="Create password"
                          value={clgPassword}
                          onChange={(e) => setClgPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="college-actions">
                      <button type="submit" className="college-btn primary" id="btn-submit-clg-reg">
                        <CheckCircle2 size={15} />
                        <span>Register College Account</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Sub-Option B: System Register (PC in the lab) */}
                {registerSubTab === 'system_register' && (
                  <form onSubmit={handleSystemRegisterSubmit} className="college-form">
                    <div className="clg-info-banner">
                      <Laptop size={15} className="text-blue-400 flex-shrink-0" />
                      <span>
                        <strong>Lab PC Registration:</strong> For already registered colleges. Enter College ID, Password, and this System Name to register this PC.
                      </span>
                    </div>

                    {sysRegSuccess && (
                      <div className="college-success-card">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <div>
                          <div className="success-title">{sysRegSuccess}</div>
                        </div>
                      </div>
                    )}

                    {boundSystem && !sysRegSuccess && (
                      <div className="current-bound-badge">
                        <Laptop size={14} className="text-amber-400" />
                        <span>Currently Bound: <strong>{boundSystem.systemName}</strong> ({boundSystem.collegeId})</span>
                      </div>
                    )}

                    <div className="college-grid-row">
                      <div className="college-input-group">
                        <label className="college-label">Registered College ID <span className="req-star">*</span></label>
                        <input
                          type="text"
                          className="college-input font-mono font-bold"
                          placeholder="e.g. JNTU-CSE or EWK-COLLEGE-01"
                          value={sysClgId}
                          onChange={(e) => setSysClgId(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="college-input-group">
                        <label className="college-label">College Admin Password <span className="req-star">*</span></label>
                        <input
                          type="password"
                          className="college-input font-mono"
                          placeholder="Enter password"
                          value={sysClgPassword}
                          onChange={(e) => setSysClgPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="college-grid-row">
                      <div className="college-input-group">
                        <label className="college-label">System / PC Name <span className="req-star">*</span></label>
                        <input
                          type="text"
                          className="college-input font-mono font-bold"
                          placeholder="e.g. LAB-1-PC-12 or CSE-SYS-04"
                          value={sysPcName}
                          onChange={(e) => setSysPcName(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="college-input-group">
                        <label className="college-label">Lab Room / Floor</label>
                        <input
                          type="text"
                          className="college-input"
                          placeholder="e.g. Lab 2 - 1st Floor"
                          value={sysLabRoom}
                          onChange={(e) => setSysLabRoom(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="college-actions">
                      <button type="submit" className="college-btn primary" id="btn-submit-sys-reg">
                        <Laptop size={15} />
                        <span>Register & Bind This PC</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* OPTION 2: LOCK (Exam Lockdown & Separate Portal Access) */}
            {primaryTab === 'lock' && (
              <form onSubmit={handleActivateLock} className="college-form">
                {/* System identification card */}
                {boundSystem ? (
                  <div className="clg-system-linked-card">
                    <div className="linked-card-left">
                      <Laptop size={18} className="text-emerald-400" />
                      <div>
                        <div className="linked-sys-name">{boundSystem.systemName}</div>
                        <div className="linked-clg-name">{boundSystem.collegeName} ({boundSystem.collegeId})</div>
                      </div>
                    </div>
                    <span className="linked-status-pill">Ready to Lock</span>
                  </div>
                ) : (
                  <div className="clg-info-banner">
                    <Laptop size={15} className="text-amber-400 flex-shrink-0" />
                    <span>
                      This PC is not yet bound to a registered college. You can still lock it locally with an Admin PIN or register it first.
                    </span>
                  </div>
                )}

                {/* Exam Configuration Form */}
                <div className="college-input-group">
                  <label className="college-label">Examination Title <span className="req-star">*</span></label>
                  <input
                    type="text"
                    className="college-input"
                    placeholder="e.g. B.Tech Computer Science Lab Final Exam"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    required
                  />
                </div>

                <div className="college-grid-row">
                  <div className="college-input-group">
                    <label className="college-label">Student Roll No / ID <span className="req-star">*</span></label>
                    <input
                      type="text"
                      className="college-input font-mono font-bold"
                      placeholder="e.g. 21071A0542"
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

                {/* Admin PIN Setup */}
                <div className="college-pin-box">
                  <div className="pin-box-header">
                    <KeyRound size={16} />
                    <span>Set Invigilator Security PIN (Required to Exit Lock)</span>
                  </div>
                  <div className="college-grid-row">
                    <input
                      type="password"
                      maxLength={6}
                      className="college-input pin-input center-text"
                      placeholder="Enter PIN"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <input
                      type="password"
                      maxLength={6}
                      className="college-input pin-input center-text"
                      placeholder="Confirm PIN"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                {/* Actions Row */}
                <div className="college-actions space-between">
                  {onOpenAdminPortal && (
                    <button
                      type="button"
                      className="college-btn secondary portal-launch-btn"
                      onClick={() => {
                        onClose();
                        onOpenAdminPortal();
                      }}
                      title="Open full separate College Admin Portal"
                    >
                      <Building2 size={15} />
                      <span>Launch College Admin Portal</span>
                      <ExternalLink size={13} />
                    </button>
                  )}

                  <button type="submit" className="college-btn primary" id="btn-activate-lock">
                    <Lock size={15} />
                    <span>🔒 Lock This System Now</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==============================================================
            MODE 2: UNLOCK (PIN prompt to exit)
            ============================================================== */}
        {mode === 'unlock' && (
          <div className="college-modal-body">
            <form onSubmit={handleVerifyPin} className="college-form">
              <div className="college-pin-box">
                <div className="pin-box-header">
                  <KeyRound size={16} />
                  <span>Enter Invigilator / Admin PIN</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  className="college-input pin-input center-text"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <div className="college-actions">
                <button type="button" className="college-btn secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="college-btn primary">
                  <Unlock size={14} />
                  <span>Verify PIN & Exit Exam</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 3: LOCKED SCREEN (Security violation alert)
            ============================================================== */}
        {mode === 'locked_screen' && (
          <div className="college-modal-body">
            <div className="security-violation-banner">
              <ShieldAlert size={28} className="danger-icon" />
              <div>
                <h4>Anti-Cheating Violation Alert!</h4>
                <p>
                  You attempted to exit fullscreen, switch tabs (Alt+Tab), or inspect the browser.
                  This machine is completely locked. Enter the Invigilator PIN to resume.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyPin} className="college-form">
              <div className="college-pin-box">
                <div className="pin-box-header">
                  <KeyRound size={16} />
                  <span>Invigilator PIN Required to Unlock Machine:</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  className="college-input pin-input center-text"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                />
              </div>

              <div className="college-actions">
                <button type="submit" className="college-btn danger">
                  <Unlock size={14} />
                  <span>Unlock System</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==============================================================
            MODE 4: SUMMARY (Exam finished)
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
                  <span className="summary-val">{studentInfo.examName}</span>
                </div>
                <div className="summary-col">
                  <span className="summary-label">Student Roll No:</span>
                  <span className="summary-val">{studentInfo.studentRoll}</span>
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
