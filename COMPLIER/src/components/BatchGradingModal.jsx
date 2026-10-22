import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  X, 
  ShieldCheck,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  DEFAULT_SAMPLE_TEST_SUITE, 
  INITIAL_STUDENT_COHORT, 
  fetchLiveSupabaseStudents,
  runBatchGrading, 
  exportGradingToCsv 
} from '../services/batchGradingService';

export default function BatchGradingModal({
  isOpen,
  onClose
}) {
  const [testSuite, setTestSuite] = useState(DEFAULT_SAMPLE_TEST_SUITE);
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENT_COHORT);
  const [isGrading, setIsGrading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progressInfo, setProgressInfo] = useState(null);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleStartGrading = async () => {
    setIsGrading(true);
    setResults(null);

    try {
      const res = await runBatchGrading({
        testSuite,
        students: studentsList,
        onProgress: (p) => setProgressInfo(p)
      });
      setResults(res);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err) {
      console.error('Batch grading error:', err);
    } finally {
      setIsGrading(false);
      setProgressInfo(null);
    }
  };

  const handleExportCsv = () => {
    if (results) {
      exportGradingToCsv(results);
    }
  };

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const realStudents = await fetchLiveSupabaseStudents();
      if (realStudents.length > 0) {
        setStudentsList(realStudents);
      }
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics
  const passedStudents = results ? results.filter(r => r.status === 'PASSED').length : 0;
  const avgPercentage = results ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) : 0;
  const plagiarismAlerts = results ? results.filter(r => r.plagiarismFlag).length : 0;

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container grading-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge grading-badge">
              <FileSpreadsheet size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Automated Batch Grading Engine</h2>
                <span className="s-tier-pill grading-pill">Academic Exam Evaluator</span>
              </div>
              <p className="modal-subtitle">Auto-compile student submissions against automated test suites & generate Excel grading sheets</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grading-modal-body">
          {/* Top Controls Bar */}
          <div className="grading-controls-bar">
            <div className="cohort-meta">
              <span className="meta-badge">
                <Users size={14} />
                <span>Cohort: {studentsList.length} Students</span>
              </span>
              <button 
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 ml-2 font-medium"
                onClick={handleSyncSupabase}
                disabled={isSyncing}
                title="Fetch live active lab computers from Supabase Cloud"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>Sync Lab Students</span>
              </button>
              <span className="meta-badge">
                <FileCode2 size={14} />
                <span>Test Suite: {testSuite.length} Edge Cases</span>
              </span>
            </div>

            <div className="grading-actions-right">
              <button 
                className="start-grading-btn"
                onClick={handleStartGrading}
                disabled={isGrading}
              >
                {isGrading ? (
                  <>
                    <span className="spinner-mini" />
                    <span>Grading {progressInfo ? `${progressInfo.current}/${progressInfo.total}` : '...'}</span>
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    <span>Run Batch Evaluation</span>
                  </>
                )}
              </button>

              {results && (
                <button 
                  className="export-csv-btn"
                  onClick={handleExportCsv}
                  title="Download student_grades.csv Excel file"
                >
                  <Download size={15} />
                  <span>Export to Excel / CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar when running */}
          {isGrading && progressInfo && (
            <div className="grading-progress-card">
              <div className="progress-label-row">
                <span>Grading candidate: <strong>{progressInfo.currentRoll} ({progressInfo.currentName})</strong></span>
                <span>{Math.round((progressInfo.current / progressInfo.total) * 100)}%</span>
              </div>
              <div className="grading-bar-wrap">
                <div 
                  className="grading-bar-fill" 
                  style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary Scorecard */}
          {results && (
            <div className="grading-summary-scorecard">
              <div className="summary-stat-box">
                <span className="stat-label">Pass Rate</span>
                <span className="stat-val text-emerald-400">
                  {Math.round((passedStudents / results.length) * 100)}%
                </span>
                <span className="stat-sub">{passedStudents} of {results.length} passed</span>
              </div>

              <div className="summary-stat-box">
                <span className="stat-label">Class Average</span>
                <span className="stat-val text-sky-400">{avgPercentage}%</span>
                <span className="stat-sub">Across 5 test cases</span>
              </div>

              <div className="summary-stat-box">
                <span className="stat-label">Plagiarism Flag</span>
                <span className={`stat-val ${plagiarismAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {plagiarismAlerts}
                </span>
                <span className="stat-sub">{plagiarismAlerts > 0 ? 'Suspected Copied Code' : 'Clean cohort'}</span>
              </div>
            </div>
          )}

          {/* Student Submissions Table */}
          <div className="grading-table-wrapper">
            <table className="grading-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Tests Passed</th>
                  <th>Similarity / Plagiarism</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(results || studentsList).map((s, idx) => {
                  const res = results ? results[idx] : null;
                  return (
                    <tr key={s.rollNo}>
                      <td className="font-semibold text-sky-400">{s.rollNo}</td>
                      <td>{s.name}</td>
                      <td>{res ? `${res.score} / ${res.totalScore}` : '--'}</td>
                      <td>{res ? `${res.percentage}%` : '--'}</td>
                      <td>
                        {res ? (
                          <span className={`grade-badge grade-${res.grade[0].toLowerCase()}`}>
                            {res.grade}
                          </span>
                        ) : '--'}
                      </td>
                      <td>{res ? `${res.passedTests} / ${res.totalTests}` : '--'}</td>
                      <td>
                        {res?.plagiarismFlag ? (
                          <span className="plagiarism-badge">
                            <AlertTriangle size={12} />
                            <span>Matched {res.similarWith}</span>
                          </span>
                        ) : res ? (
                          <span className="similarity-clean">Clean ✓</span>
                        ) : '--'}
                      </td>
                      <td>
                        {res ? (
                          <span className={`status-pill pill-${res.status.toLowerCase()}`}>
                            {res.status}
                          </span>
                        ) : (
                          <span className="status-pill pill-ready">Ready</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
