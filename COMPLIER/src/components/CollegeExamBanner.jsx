import React, { useEffect, useState } from 'react';
import { GraduationCap, ShieldAlert, Clock, Lock, User, AlertTriangle } from 'lucide-react';

export default function CollegeExamBanner({
  studentInfo = {},
  violationsCount = 0,
  startTime,
  onOpenExitModal
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="college-exam-banner" role="banner" aria-label="College Exam Lockdown Active Banner">
      <div className="banner-left">
        <div className="exam-live-indicator">
          <span className="exam-radar-dot" />
          <GraduationCap size={16} className="text-accent" />
          <span className="exam-mode-badge">EXAM LOCKDOWN ACTIVE</span>
        </div>

        <div className="exam-meta-pill">
          <span className="meta-exam-name">{studentInfo.examName || 'College Lab Exam'}</span>
          <span className="meta-divider">•</span>
          <span className="meta-student">
            <User size={12} /> {studentInfo.studentRoll} ({studentInfo.studentName || 'Student'})
          </span>
        </div>
      </div>

      <div className="banner-center">
        <div className="exam-timer-display" title="Exam Session Elapsed Time">
          <Clock size={15} className="text-warning" />
          <span className="timer-digits">{formatTime(elapsedSeconds)}</span>
        </div>

        {violationsCount > 0 && (
          <div className="exam-violation-badge" title="Tab-Switch or Fullscreen Exit Violations Logged">
            <AlertTriangle size={14} />
            <span>Violations: {violationsCount}</span>
          </div>
        )}
      </div>

      <div className="banner-right">
        <button
          className="exam-end-btn"
          onClick={onOpenExitModal}
          title="Requires Faculty Admin PIN to exit or submit exam"
          id="btn-end-college-exam"
        >
          <Lock size={14} />
          <span>End / Exit Exam (PIN Required)</span>
        </button>
      </div>
    </div>
  );
}
