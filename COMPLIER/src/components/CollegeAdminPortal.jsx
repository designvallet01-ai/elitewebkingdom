import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Laptop, 
  Users, 
  Radio, 
  RefreshCw, 
  LogOut, 
  Plus, 
  Trash2, 
  KeyRound, 
  Clock, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  ArrowLeft, 
  ShieldCheck,
  Building2,
  Mail,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  getRegisteredColleges, 
  registerCollege, 
  verifyCollegeLogin, 
  getRegisteredSystems, 
  registerSystem, 
  unregisterSystem, 
  updateSystemStatus, 
  broadcastMessage, 
  subscribeToCollegeEvents,
  getCurrentMachineSystem,
  syncCollegesFromSupabase,
  syncSystemsFromSupabase,
  reportIncidentLog
} from '../services/collegeService';

export default function CollegeAdminPortal({
  isOpen,
  onClose,
  onLockSystemFromPortal,
  onUnlockSystemFromPortal
}) {
  const [colleges, setColleges] = useState([]);
  const [activeCollege, setActiveCollege] = useState(null);
  const [systems, setSystems] = useState([]);
  const [activeTab, setActiveTab] = useState('systems'); // 'systems' | 'broadcast' | 'logs' | 'register_sys'
  
  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showRegisterCollegeModal, setShowRegisterCollegeModal] = useState(false);

  // New College Register Form State
  const [regCollegeName, setRegCollegeName] = useState('');
  const [regCollegeId, setRegCollegeId] = useState('');
  const [regDept, setRegDept] = useState('Computer Science & Engineering');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('1234');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // New System Register Form State
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemRoom, setNewSystemRoom] = useState('Lab 1 - Ground Floor');
  const [systemRegMsg, setSystemRegMsg] = useState('');

  // Broadcast Lock Form State
  const [broadcastExamName, setBroadcastExamName] = useState('University Lab Practical Examination');
  const [broadcastPin, setBroadcastPin] = useState('1234');
  const [broadcastDuration, setBroadcastDuration] = useState('90');
  const [broadcastAlert, setBroadcastAlert] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Security Incident Logs
  const [incidentLogs, setIncidentLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('elite_college_incident_logs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Load registered colleges from local cache and sync with Supabase Cloud
  useEffect(() => {
    const list = getRegisteredColleges();
    setColleges(list);

    // Background sync from Supabase Cloud
    syncCollegesFromSupabase().then((cloudColleges) => {
      if (cloudColleges && cloudColleges.length > 0) {
        setColleges(cloudColleges);
      }
    });

    try {
      const savedSession = localStorage.getItem('elite_college_active_admin_session_v1');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const valid = list.find(c => c.collegeId === parsed.collegeId);
        if (valid) {
          setActiveCollege(valid);
        }
      }
    } catch (e) {}
  }, []);

  // Load systems for active college and sync with Supabase Cloud
  const refreshSystems = () => {
    if (activeCollege) {
      const sysList = getRegisteredSystems(activeCollege.collegeId);
      setSystems(sysList);

      // Background sync from Supabase
      syncSystemsFromSupabase(activeCollege.collegeId).then((cloudSystems) => {
        if (cloudSystems) {
          setSystems(cloudSystems);
        }
      });
    }
  };

  useEffect(() => {
    refreshSystems();
  }, [activeCollege]);

  // Subscribe to realtime broadcast events across tabs/network and Supabase
  useEffect(() => {
    const unsubscribe = subscribeToCollegeEvents((msg) => {
      if (!msg) return;

      if (msg.type === 'SYSTEM_REGISTERED' || msg.type === 'SYSTEM_STATUS_UPDATED' || msg.type === 'SYSTEM_DELETED') {
        refreshSystems();
      }

      if (msg.type === 'VIOLATION_REPORTED') {
        const newLog = {
          id: 'log-' + Date.now(),
          collegeId: activeCollege?.collegeId || '',
          systemId: msg.systemId || '',
          systemName: msg.systemName || 'Lab PC',
          studentRoll: msg.studentRoll || 'Unknown',
          reason: msg.reason || 'Security Violation',
          timestamp: new Date().toLocaleTimeString()
        };
        reportIncidentLog(newLog);
        setIncidentLogs(prev => {
          const updated = [newLog, ...prev.slice(0, 49)];
          try { localStorage.setItem('elite_college_incident_logs_v1', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, [activeCollege]);

  if (!isOpen) return null;

  // Handle Admin Login
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const college = verifyCollegeLogin(loginId, loginPassword);
    if (!college) {
      setLoginError('Invalid College ID or Password. Please try again or register.');
      return;
    }

    setActiveCollege(college);
    try {
      localStorage.setItem('elite_college_active_admin_session_v1', JSON.stringify({
        collegeId: college.collegeId,
        loginTime: Date.now()
      }));
    } catch (e) {}
  };

  // Handle Logout
  const handleLogout = () => {
    setActiveCollege(null);
    try {
      localStorage.removeItem('elite_college_active_admin_session_v1');
    } catch (e) {}
  };

  // Handle Registering a New College
  const handleRegisterCollege = (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    try {
      const created = registerCollege({
        collegeName: regCollegeName,
        collegeId: regCollegeId,
        department: regDept,
        adminEmail: regEmail,
        password: regPassword,
        defaultPin: regPin
      });

      setRegSuccess(`College "${created.collegeName}" (${created.collegeId}) registered successfully!`);
      setColleges(getRegisteredColleges());
      setActiveCollege(created);
      setShowRegisterCollegeModal(false);
      setRegCollegeName('');
      setRegCollegeId('');
      setRegPassword('');
    } catch (err) {
      setRegError(err.message || 'Failed to register college.');
    }
  };

  // Handle Registering a System from Portal
  const handleAddSystem = (e) => {
    e.preventDefault();
    if (!activeCollege || !newSystemName.trim()) return;

    try {
      registerSystem({
        collegeId: activeCollege.collegeId,
        password: activeCollege.password,
        systemName: newSystemName.trim(),
        labRoom: newSystemRoom.trim()
      });
      setSystemRegMsg(`System "${newSystemName.toUpperCase()}" registered successfully!`);
      setNewSystemName('');
      refreshSystems();
      setTimeout(() => setSystemRegMsg(''), 3000);
    } catch (err) {
      setSystemRegMsg('Error: ' + err.message);
    }
  };

  // Handle Unregister System
  const handleDeleteSystem = (systemId) => {
    if (window.confirm('Are you sure you want to unregister this lab machine?')) {
      unregisterSystem(systemId);
      refreshSystems();
    }
  };

  // Handle Single System Lockdown with Direct Fullscreen
  const handleLockSingleSystem = (sys) => {
    const pin = activeCollege?.defaultPin || '1234';
    const examName = sys.currentExamName || `${activeCollege?.collegeName || 'College'} Lab Practical Exam`;

    // 1. Broadcast targeted lock message to this system
    broadcastMessage({
      type: 'TARGET_LOCKDOWN',
      targetSystemId: sys.systemId,
      collegeId: activeCollege.collegeId,
      systemName: sys.systemName,
      examName: examName,
      pin: pin,
      forceFullscreen: true
    });

    // 2. Update status in local storage
    updateSystemStatus(sys.systemId, {
      status: 'locked',
      currentExamName: examName,
      examStartTime: Date.now()
    });

    refreshSystems();
    setBroadcastAlert(`🔒 Fullscreen Lockdown signal sent to ${sys.systemName}!`);
    setTimeout(() => setBroadcastAlert(''), 3500);

    // 3. If current machine is this system, enter lockdown & fullscreen immediately!
    const bound = getCurrentMachineSystem();
    if (bound && (bound.systemId === sys.systemId || bound.systemName === sys.systemName)) {
      onClose();
      if (onLockSystemFromPortal) {
        onLockSystemFromPortal({
          pin: pin,
          examName: examName,
          studentRoll: sys.currentStudentRoll || 'LAB-STUDENT',
          studentName: sys.currentStudentName || 'Student'
        });
      }
    }
  };

  // Handle Single System Unlock
  const handleUnlockSingleSystem = (sys) => {
    broadcastMessage({
      type: 'TARGET_UNLOCK',
      targetSystemId: sys.systemId,
      collegeId: activeCollege.collegeId,
      systemName: sys.systemName
    });

    updateSystemStatus(sys.systemId, {
      status: 'idle',
      currentExamName: '',
      examStartTime: null
    });

    refreshSystems();
    setBroadcastAlert(`🔓 Unlock command sent to ${sys.systemName}.`);
    setTimeout(() => setBroadcastAlert(''), 3000);

    const bound = getCurrentMachineSystem();
    if (bound && (bound.systemId === sys.systemId || bound.systemName === sys.systemName)) {
      if (onUnlockSystemFromPortal) {
        onUnlockSystemFromPortal();
      }
    }
  };

  // Handle Broadcast Lockdown
  const handleBroadcastLock = () => {
    if (!broadcastPin || broadcastPin.length < 4) {
      setBroadcastAlert('Please set a valid 4-6 digit Admin PIN.');
      return;
    }

    if (window.confirm(`BROADCAST LOCKDOWN: Are you sure you want to lock all ${systems.length} registered lab machines into Exam Kiosk Mode with PIN ${broadcastPin}? Direct fullscreen will be activated on all systems.`)) {
      broadcastMessage({
        type: 'BROADCAST_LOCKDOWN',
        collegeId: activeCollege.collegeId,
        examName: broadcastExamName.trim(),
        pin: broadcastPin.trim(),
        durationMins: Number(broadcastDuration) || 90,
        forceFullscreen: true
      });

      // Update all systems in local storage
      systems.forEach(s => {
        updateSystemStatus(s.systemId, {
          status: 'locked',
          currentExamName: broadcastExamName.trim(),
          examStartTime: Date.now()
        });
      });

      refreshSystems();
      setBroadcastAlert(`✅ Direct Fullscreen Lockdown signal broadcasted to all ${systems.length} registered PCs!`);
      setTimeout(() => setBroadcastAlert(''), 4000);

      // If current machine belongs to this college, activate lockdown & fullscreen immediately
      const bound = getCurrentMachineSystem();
      if (!bound || bound.collegeId === activeCollege.collegeId) {
        onClose();
        if (onLockSystemFromPortal) {
          onLockSystemFromPortal({
            pin: broadcastPin.trim(),
            examName: broadcastExamName.trim(),
            studentRoll: bound?.currentStudentRoll || 'LAB-STUDENT',
            studentName: bound?.currentStudentName || 'Student'
          });
        }
      }
    }
  };

  // Handle Broadcast Unlock
  const handleBroadcastUnlock = () => {
    if (window.confirm('Are you sure you want to unlock all lab systems?')) {
      broadcastMessage({
        type: 'BROADCAST_UNLOCK',
        collegeId: activeCollege.collegeId
      });

      systems.forEach(s => {
        updateSystemStatus(s.systemId, {
          status: 'idle',
          currentExamName: '',
          examStartTime: null
        });
      });

      refreshSystems();
      setBroadcastAlert('✅ Unlock signal broadcasted to all systems.');
      setTimeout(() => setBroadcastAlert(''), 3000);

      if (onUnlockSystemFromPortal) {
        onUnlockSystemFromPortal();
      }
    }
  };

  // Filtered Systems List
  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return systems;
    const q = searchQuery.toLowerCase();
    return systems.filter(s => 
      s.systemName.toLowerCase().includes(q) ||
      s.labRoom.toLowerCase().includes(q) ||
      (s.currentStudentRoll && s.currentStudentRoll.toLowerCase().includes(q))
    );
  }, [systems, searchQuery]);

  // Quick stats
  const activeExamCount = systems.filter(s => s.status === 'locked').length;
  const violationCount = systems.reduce((acc, s) => acc + (s.violationsCount || 0), 0);

  return (
    <div className="college-portal-fullscreen-backdrop">
      <div className="college-portal-container">
        {/* Top Portal Navigation Bar */}
        <header className="college-portal-navbar">
          <div className="portal-nav-brand">
            <div className="portal-badge-icon">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="portal-brand-title">Elite College Lab Exam Portal</h2>
              <span className="portal-brand-sub">Centralized Proctoring & Lab Kiosk Network</span>
            </div>
          </div>

          <div className="portal-nav-actions">
            <div className="portal-cloud-chip" title="Connected to Supabase Cloud Database for Worldwide Access">
              <span className="cloud-dot-pulse"></span>
              <span>⚡ SUPABASE CLOUD</span>
            </div>

            {activeCollege && (
              <div className="portal-user-chip">
                <Building2 size={15} className="text-amber-400" />
                <span className="user-clg-name">{activeCollege.collegeName}</span>
                <span className="user-clg-code">{activeCollege.collegeId}</span>
              </div>
            )}

            {activeCollege && (
              <button 
                type="button" 
                className="portal-logout-btn" 
                onClick={handleLogout}
                title="Log out of College Portal"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}

            <button 
              type="button" 
              className="portal-back-btn" 
              onClick={onClose}
              title="Return to Compiler IDE"
            >
              <ArrowLeft size={14} />
              <span>Back to IDE</span>
            </button>
          </div>
        </header>

        {/* ==============================================================
            SCREEN 1: LOGIN / REGISTRATION (When no active college session)
            ============================================================== */}
        {!activeCollege ? (
          <div className="portal-auth-layout">
            <div className="portal-login-card">
              <div className="login-card-header">
                <div className="login-header-icon">
                  <ShieldCheck size={28} />
                </div>
                <h3>College Admin Portal Login</h3>
                <p>Enter your College ID and Admin Password to access your lab proctoring dashboard and system controls.</p>
              </div>

              {loginError && (
                <div className="portal-alert danger">
                  <AlertTriangle size={15} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="portal-form">
                <div className="portal-input-group">
                  <label>College ID / Code</label>
                  <input
                    type="text"
                    className="portal-text-input"
                    placeholder="e.g. EWK-COLLEGE-01 or JNTU-CSE"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                    required
                    autoFocus
                  />
                </div>

                <div className="portal-input-group">
                  <label>Admin Password (Optional / Leave Empty)</label>
                  <input
                    type="password"
                    className="portal-text-input"
                    placeholder="Leave empty if not set"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="portal-primary-btn" id="btn-college-login">
                  <Lock size={15} />
                  <span>Access College Portal</span>
                </button>
              </form>

              {/* Demo Quick Fill Helper */}
              {colleges.length > 0 && (
                <div className="portal-quick-creds-box">
                  <span className="quick-creds-title">⚡ Registered Demo Credentials:</span>
                  <div className="creds-pill-row">
                    {colleges.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className="cred-pill-btn"
                        onClick={() => {
                          setLoginId(c.collegeId);
                          setLoginPassword(c.password);
                        }}
                      >
                        <code>{c.collegeId}</code> / <code>{c.password}</code>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="portal-auth-footer">
                <span>New College or University?</span>
                <button 
                  type="button" 
                  className="portal-link-btn"
                  onClick={() => setShowRegisterCollegeModal(true)}
                >
                  Register College Account ➔
                </button>
              </div>
            </div>

            {/* Modal to Register a Brand New College */}
            {showRegisterCollegeModal && (
              <div className="portal-submodal-backdrop">
                <div className="portal-submodal-card">
                  <div className="submodal-header">
                    <div className="submodal-title-group">
                      <GraduationCap size={20} className="text-amber-400" />
                      <h4>Register New College / Institution</h4>
                    </div>
                    <button 
                      type="button" 
                      className="submodal-close-btn"
                      onClick={() => setShowRegisterCollegeModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {regError && <div className="portal-alert danger">{regError}</div>}
                  {regSuccess && <div className="portal-alert success">{regSuccess}</div>}

                  <form onSubmit={handleRegisterCollege} className="portal-form">
                    <div className="portal-input-group">
                      <label>College / University Full Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className="portal-text-input"
                        placeholder="e.g. Sri Krishna Devaraya University"
                        value={regCollegeName}
                        onChange={(e) => setRegCollegeName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="portal-grid-two">
                      <div className="portal-input-group">
                        <label>College Code / ID (Unique) <span className="req">*</span></label>
                        <input
                          type="text"
                          className="portal-text-input"
                          placeholder="e.g. SKDU-CSE-01"
                          value={regCollegeId}
                          onChange={(e) => setRegCollegeId(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="portal-input-group">
                        <label>Department / Branch</label>
                        <input
                          type="text"
                          className="portal-text-input"
                          placeholder="e.g. Computer Science"
                          value={regDept}
                          onChange={(e) => setRegDept(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="portal-input-group">
                      <label>Official Admin Email</label>
                      <input
                        type="email"
                        className="portal-text-input"
                        placeholder="e.g. lab.admin@college.edu.in"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>

                    <div className="portal-grid-two">
                      <div className="portal-input-group">
                        <label>Admin Password (Optional / Empty)</label>
                        <input
                          type="password"
                          className="portal-text-input"
                          placeholder="Leave empty or set password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                      </div>

                      <div className="portal-input-group">
                        <label>Default Security PIN (4-6 digits)</label>
                        <input
                          type="password"
                          maxLength={6}
                          className="portal-text-input"
                          placeholder="e.g. 1234"
                          value={regPin}
                          onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    <div className="submodal-actions">
                      <button 
                        type="button" 
                        className="portal-secondary-btn"
                        onClick={() => setShowRegisterCollegeModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="portal-primary-btn">
                        <CheckCircle2 size={15} />
                        <span>Create College Account</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ==============================================================
             SCREEN 2: LOGGED-IN COLLEGE ADMIN DASHBOARD
             ============================================================== */
          <div className="portal-dashboard-layout">
            {/* Quick Metrics Bar */}
            <section className="portal-metrics-row">
              <div className="metric-card">
                <div className="metric-icon-box bg-blue">
                  <Laptop size={18} />
                </div>
                <div>
                  <div className="metric-num">{systems.length}</div>
                  <div className="metric-label">Registered Lab PCs</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box bg-amber">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="metric-num">{activeExamCount}</div>
                  <div className="metric-label">In Active Exam Lockdown</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-box bg-emerald">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="metric-num">{systems.length - activeExamCount}</div>
                  <div className="metric-label">Idle / Ready Systems</div>
                </div>
              </div>

              <div className="metric-card">
                <div className={`metric-icon-box ${violationCount > 0 ? 'bg-rose animate-pulse' : 'bg-slate'}`}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <div className="metric-num">{violationCount}</div>
                  <div className="metric-label">Cheating Violations</div>
                </div>
              </div>
            </section>

            {/* Portal Tab Navigation */}
            <div className="portal-tabs-nav">
              <button 
                className={`portal-tab-pill ${activeTab === 'systems' ? 'active' : ''}`}
                onClick={() => setActiveTab('systems')}
              >
                <Laptop size={15} />
                <span>Registered Lab PCs ({systems.length})</span>
              </button>

              <button 
                className={`portal-tab-pill ${activeTab === 'broadcast' ? 'active' : ''}`}
                onClick={() => setActiveTab('broadcast')}
              >
                <Radio size={15} />
                <span>Broadcast Lockdown Control</span>
              </button>

              <button 
                className={`portal-tab-pill ${activeTab === 'register_sys' ? 'active' : ''}`}
                onClick={() => setActiveTab('register_sys')}
              >
                <Plus size={15} />
                <span>Register New System PC</span>
              </button>

              <button 
                className={`portal-tab-pill ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <ShieldAlert size={15} />
                <span>Live Security Incident Log ({incidentLogs.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: REGISTERED SYSTEMS LIST */}
            {activeTab === 'systems' && (
              <div className="portal-tab-content">
                <div className="tab-header-row">
                  <div className="search-input-wrapper">
                    <Search size={15} className="search-icon" />
                    <input
                      type="text"
                      className="portal-search-field"
                      placeholder="Search PCs by system name, room, or student roll..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="header-action-group">
                    <button 
                      type="button" 
                      className="refresh-btn" 
                      onClick={refreshSystems}
                      title="Refresh systems status"
                    >
                      <RefreshCw size={14} />
                      <span>Refresh</span>
                    </button>
                    <button 
                      type="button" 
                      className="add-system-quick-btn"
                      onClick={() => setActiveTab('register_sys')}
                    >
                      <Plus size={14} />
                      <span>Add System</span>
                    </button>
                  </div>
                </div>

                {filteredSystems.length === 0 ? (
                  <div className="portal-empty-state">
                    <Laptop size={44} className="text-slate-600" />
                    <h4>No Lab Systems Registered Yet</h4>
                    <p>Register computer lab machines to this college so you can monitor and lockdown student examinations.</p>
                    <button 
                      className="portal-primary-btn" 
                      onClick={() => setActiveTab('register_sys')}
                    >
                      <Plus size={15} />
                      <span>Register First System PC</span>
                    </button>
                  </div>
                ) : (
                  <div className="systems-card-grid">
                    {filteredSystems.map((sys) => {
                      const isLocked = sys.status === 'locked';
                      return (
                        <div key={sys.systemId} className={`system-status-card ${isLocked ? 'locked-card' : ''}`}>
                          <div className="sys-card-header">
                            <div className="sys-name-badge">
                              <Laptop size={16} />
                              <span className="sys-name-text">{sys.systemName}</span>
                            </div>
                            <span className={`sys-status-pill ${isLocked ? 'locked' : 'idle'}`}>
                              {isLocked ? '🔒 Exam Locked' : '🟢 Idle Ready'}
                            </span>
                          </div>

                          <div className="sys-details-list">
                            <div className="sys-detail-row">
                              <span className="detail-label">Lab Room:</span>
                              <span className="detail-value">{sys.labRoom}</span>
                            </div>

                            {isLocked && (
                              <>
                                <div className="sys-detail-row">
                                  <span className="detail-label">Exam:</span>
                                  <span className="detail-value">{sys.currentExamName || 'Lab Exam'}</span>
                                </div>
                                {sys.currentStudentRoll && (
                                  <div className="sys-detail-row">
                                    <span className="detail-label">Student:</span>
                                    <span className="detail-value font-mono font-bold text-amber-300">
                                      {sys.currentStudentRoll} ({sys.currentStudentName || 'Student'})
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {sys.violationsCount > 0 && (
                              <div className="sys-detail-row text-rose-400 font-semibold">
                                <span className="detail-label">Cheating Violations:</span>
                                <span className="detail-value">{sys.violationsCount} Alert(s)</span>
                              </div>
                            )}
                          </div>

                          <div className="sys-card-actions">
                            {isLocked ? (
                              <button
                                type="button"
                                className="sys-btn unlock-btn"
                                onClick={() => handleUnlockSingleSystem(sys)}
                                title="Unlock this computer"
                              >
                                <Unlock size={13} />
                                <span>Unlock</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="sys-btn lock-btn"
                                onClick={() => handleLockSingleSystem(sys)}
                                title="Lock this system into Direct Fullscreen Exam Mode"
                              >
                                <Lock size={13} />
                                <span>Lock & Fullscreen</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="sys-btn delete-btn"
                              onClick={() => handleDeleteSystem(sys.systemId)}
                              title="Unregister this system"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: BROADCAST LOCKDOWN CONTROL */}
            {activeTab === 'broadcast' && (
              <div className="portal-tab-content">
                <div className="broadcast-control-box">
                  <div className="broadcast-header">
                    <Radio size={24} className="text-amber-400" />
                    <div>
                      <h3>Master Exam Lockdown Command Center</h3>
                      <p>Broadcast an instant full-screen kiosk lock to all {systems.length} registered computers in the lab.</p>
                    </div>
                  </div>

                  {broadcastAlert && (
                    <div className="portal-alert success">
                      <CheckCircle2 size={16} />
                      <span>{broadcastAlert}</span>
                    </div>
                  )}

                  <div className="broadcast-settings-grid">
                    <div className="portal-input-group">
                      <label>Exam Name / Subject Code</label>
                      <input
                        type="text"
                        className="portal-text-input"
                        value={broadcastExamName}
                        onChange={(e) => setBroadcastExamName(e.target.value)}
                        placeholder="e.g. CS201 Data Structures Lab Exam"
                      />
                    </div>

                    <div className="portal-input-group">
                      <label>Admin Security PIN (Required to Unlock)</label>
                      <input
                        type="password"
                        maxLength={6}
                        className="portal-text-input font-mono font-bold tracking-widest text-center"
                        value={broadcastPin}
                        onChange={(e) => setBroadcastPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                      />
                    </div>

                    <div className="portal-input-group">
                      <label>Exam Duration (Minutes)</label>
                      <input
                        type="number"
                        className="portal-text-input"
                        value={broadcastDuration}
                        onChange={(e) => setBroadcastDuration(e.target.value)}
                        min={10}
                        max={360}
                      />
                    </div>
                  </div>

                  <div className="broadcast-action-buttons">
                    <button
                      type="button"
                      className="broadcast-lock-btn"
                      onClick={handleBroadcastLock}
                      id="btn-broadcast-lock"
                    >
                      <Lock size={16} />
                      <span>Broadcast Lock to All ({systems.length}) PCs</span>
                    </button>

                    <button
                      type="button"
                      className="broadcast-unlock-btn"
                      onClick={handleBroadcastUnlock}
                    >
                      <Unlock size={16} />
                      <span>Master Unlock All Lab PCs</span>
                    </button>
                  </div>

                  <div className="broadcast-notice-card">
                    <ShieldCheck size={18} className="text-amber-400 flex-shrink-0" />
                    <p>
                      <strong>Lockdown Rules:</strong> When activated, student PCs go into fullscreen lock. Exiting fullscreen, switching tabs (Alt+Tab), opening DevTools (F12), or reloading is blocked. Any attempts are logged into the Security Incident Log.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: REGISTER NEW SYSTEM PC */}
            {activeTab === 'register_sys' && (
              <div className="portal-tab-content">
                <div className="register-system-box">
                  <div className="reg-sys-header">
                    <Laptop size={22} className="text-blue-400" />
                    <div>
                      <h3>Register Lab Computer (System Register)</h3>
                      <p>Add a new lab computer under <strong>{activeCollege.collegeName}</strong> ({activeCollege.collegeId}).</p>
                    </div>
                  </div>

                  {systemRegMsg && (
                    <div className={`portal-alert ${systemRegMsg.startsWith('Error') ? 'danger' : 'success'}`}>
                      {systemRegMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddSystem} className="portal-form">
                    <div className="portal-grid-two">
                      <div className="portal-input-group">
                        <label>System / Computer Identifier Name <span className="req">*</span></label>
                        <input
                          type="text"
                          className="portal-text-input"
                          placeholder="e.g. LAB-1-PC-14 or CSE-SYS-05"
                          value={newSystemName}
                          onChange={(e) => setNewSystemName(e.target.value.toUpperCase())}
                          required
                        />
                      </div>

                      <div className="portal-input-group">
                        <label>Lab Room / Floor</label>
                        <input
                          type="text"
                          className="portal-text-input"
                          placeholder="e.g. Lab 2 - 1st Floor"
                          value={newSystemRoom}
                          onChange={(e) => setNewSystemRoom(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="portal-form-buttons">
                      <button type="submit" className="portal-primary-btn" id="btn-register-sys-submit">
                        <Plus size={15} />
                        <span>Register & Bind Lab Computer</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: LIVE SECURITY INCIDENT LOG */}
            {activeTab === 'logs' && (
              <div className="portal-tab-content">
                <div className="incident-logs-box">
                  <div className="logs-header">
                    <ShieldAlert size={20} className="text-rose-400" />
                    <div>
                      <h3>Proctoring & Anti-Cheating Incident Feed</h3>
                      <p>Real-time log of security events, fullscreen exits, and window blur attempts across all lab computers.</p>
                    </div>
                  </div>

                  {incidentLogs.length === 0 ? (
                    <div className="portal-empty-state">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                      <h4>No Security Violations Detected</h4>
                      <p>All active lab exam sessions are running securely without anti-cheating violations.</p>
                    </div>
                  ) : (
                    <div className="logs-table-wrapper">
                      <table className="incident-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Machine Name</th>
                            <th>Student Roll No</th>
                            <th>Incident Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incidentLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="font-mono text-slate-400">{log.timestamp}</td>
                              <td className="font-semibold text-slate-200">{log.systemName}</td>
                              <td className="font-mono text-amber-300 font-bold">{log.studentRoll}</td>
                              <td className="text-rose-400 font-medium">{log.reason}</td>
                              <td>
                                <span className="badge-flagged">Flagged Alert</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
