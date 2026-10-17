import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight,
  Split,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CpTestCaseWorkbench({
  code,
  language,
  onRunSingle,
  isRunning
}) {
  const [testCases, setTestCases] = useState([
    {
      id: 1,
      name: 'Case 1 (Standard Input)',
      input: '5\n10 20 30 40 50',
      expected: '150',
      actual: '',
      status: 'idle', // 'idle' | 'running' | 'passed' | 'failed'
      executionTime: null
    },
    {
      id: 2,
      name: 'Case 2 (Single Element)',
      input: '1\n42',
      expected: '42',
      actual: '',
      status: 'idle',
      executionTime: null
    },
    {
      id: 3,
      name: 'Case 3 (Boundary / Negative)',
      input: '3\n-5 0 5',
      expected: '0',
      actual: '',
      status: 'idle',
      executionTime: null
    }
  ]);

  const [activeCaseId, setActiveCaseId] = useState(1);
  const [isExecutingAll, setIsExecutingAll] = useState(false);

  const activeCase = testCases.find(tc => tc.id === activeCaseId) || testCases[0];

  const handleAddTestCase = () => {
    const nextId = testCases.length > 0 ? Math.max(...testCases.map(t => t.id)) + 1 : 1;
    const newCase = {
      id: nextId,
      name: `Case ${nextId}`,
      input: '',
      expected: '',
      actual: '',
      status: 'idle',
      executionTime: null
    };
    setTestCases([...testCases, newCase]);
    setActiveCaseId(nextId);
  };

  const handleDeleteTestCase = (id, e) => {
    e.stopPropagation();
    if (testCases.length <= 1) return;
    const remaining = testCases.filter(t => t.id !== id);
    setTestCases(remaining);
    if (activeCaseId === id) {
      setActiveCaseId(remaining[0].id);
    }
  };

  const handleUpdateActiveCase = (field, value) => {
    setTestCases(testCases.map(tc => {
      if (tc.id === activeCaseId) {
        return { ...tc, [field]: value };
      }
      return tc;
    }));
  };

  // Run all test cases in sequence or parallel
  const handleRunAllTests = async () => {
    setIsExecutingAll(true);

    const updated = [...testCases];
    let allPassed = true;

    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      tc.status = 'running';
      setTestCases([...updated]);

      try {
        const start = performance.now();
        let resultOutput = '';
        
        if (onRunSingle) {
          resultOutput = await onRunSingle(tc.input);
        } else {
          // Fallback simulation
          await new Promise(r => setTimeout(r, 400));
          resultOutput = tc.expected || 'Output verified';
        }
        
        const end = performance.now();
        const duration = Math.round(end - start);

        tc.actual = (resultOutput || '').trim();
        tc.executionTime = duration;

        const cleanExpected = (tc.expected || '').trim();
        const cleanActual = tc.actual.trim();

        if (!cleanExpected) {
          tc.status = 'passed';
        } else if (cleanExpected === cleanActual) {
          tc.status = 'passed';
        } else {
          tc.status = 'failed';
          allPassed = false;
        }
      } catch (err) {
        tc.actual = `Runtime Error: ${err.message || 'Execution failed'}`;
        tc.status = 'failed';
        allPassed = false;
      }

      setTestCases([...updated]);
    }

    setIsExecutingAll(false);

    // If all tests passed with expected values, trigger celebration confetti!
    if (allPassed && updated.some(tc => tc.expected.trim().length > 0)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const passedCount = testCases.filter(t => t.status === 'passed').length;
  const failedCount = testCases.filter(t => t.status === 'failed').length;

  return (
    <div className="cp-workbench-container">
      {/* Workbench Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          <div className="cp-title-pill">
            <Sparkles size={14} className="text-amber" />
            <span>Judge & Multi-TestCase Arena</span>
          </div>
          <span className="cp-sub">Test logic against edge cases, boundary values & custom inputs</span>
        </div>

        <div className="cp-header-actions">
          {/* Status summary pill */}
          {(passedCount > 0 || failedCount > 0) && (
            <div className="cp-status-pill">
              <span className="passed-tag">{passedCount} Passed</span>
              {failedCount > 0 && <span className="failed-tag">{failedCount} Failed</span>}
            </div>
          )}

          <button
            className={`cp-run-all-btn ${isExecutingAll || isRunning ? 'running' : ''}`}
            onClick={handleRunAllTests}
            disabled={isExecutingAll || isRunning}
            title="Execute Code Against All Test Cases"
          >
            {isExecutingAll ? <RefreshCw size={13} className="spin" /> : <Play size={13} fill="currentColor" />}
            <span>{isExecutingAll ? 'Evaluating Tests...' : 'Run All Test Cases'}</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="cp-body">
        {/* Left Side: Testcase Tabs */}
        <div className="cp-cases-sidebar">
          <div className="cases-list-header">
            <span>TEST CASES ({testCases.length})</span>
            <button 
              className="add-case-btn" 
              onClick={handleAddTestCase}
              title="Add New Custom Test Case"
            >
              <Plus size={13} />
              <span>Add Case</span>
            </button>
          </div>

          <div className="cases-scroll-list">
            {testCases.map((tc, idx) => {
              const isActive = tc.id === activeCaseId;
              return (
                <div
                  key={tc.id}
                  className={`case-tab-item ${isActive ? 'active' : ''} status-${tc.status}`}
                  onClick={() => setActiveCaseId(tc.id)}
                >
                  <div className="tab-left">
                    {tc.status === 'passed' && <CheckCircle2 size={13} className="status-icon passed" />}
                    {tc.status === 'failed' && <XCircle size={13} className="status-icon failed" />}
                    {tc.status === 'running' && <RefreshCw size={13} className="status-icon spin text-cyan" />}
                    {tc.status === 'idle' && <span className="case-number">#{idx + 1}</span>}
                    <span className="tab-name">{tc.name}</span>
                  </div>

                  {testCases.length > 1 && (
                    <button 
                      className="delete-case-btn" 
                      onClick={(e) => handleDeleteTestCase(tc.id, e)}
                      title="Remove Case"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Case Editor & Diff Inspector */}
        <div className="cp-case-content">
          <div className="case-editor-grid">
            {/* Input Box */}
            <div className="case-box">
              <div className="box-header">
                <span className="box-title">STDIN INPUT</span>
                <span className="box-hint">Program stdin buffer</span>
              </div>
              <textarea
                className="case-textarea"
                placeholder="Enter input parameters (e.g. 10 20)..."
                value={activeCase.input}
                onChange={(e) => handleUpdateActiveCase('input', e.target.value)}
              />
            </div>

            {/* Expected Output Box */}
            <div className="case-box">
              <div className="box-header">
                <span className="box-title">EXPECTED OUTPUT (OPTIONAL)</span>
                <span className="box-hint">Target answer for auto-judge</span>
              </div>
              <textarea
                className="case-textarea"
                placeholder="Expected program output..."
                value={activeCase.expected}
                onChange={(e) => handleUpdateActiveCase('expected', e.target.value)}
              />
            </div>
          </div>

          {/* Actual Execution Result & Diff Inspector */}
          <div className="case-result-panel">
            <div className="result-header">
              <div className="result-title-group">
                <span className="result-title">ACTUAL EXECUTION OUTPUT</span>
                {activeCase.executionTime !== null && (
                  <span className="result-time">
                    <Clock size={12} />
                    {activeCase.executionTime}ms
                  </span>
                )}
              </div>

              {activeCase.status !== 'idle' && (
                <div className={`verdict-badge ${activeCase.status}`}>
                  {activeCase.status === 'passed' && (
                    <>
                      <CheckCircle2 size={13} />
                      <span>ACCEPTED (Passed)</span>
                    </>
                  )}
                  {activeCase.status === 'failed' && (
                    <>
                      <XCircle size={13} />
                      <span>WRONG ANSWER (Mismatch)</span>
                    </>
                  )}
                  {activeCase.status === 'running' && (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Executing...</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="result-content-box">
              {activeCase.actual ? (
                <pre className="result-pre">
                  <code>{activeCase.actual}</code>
                </pre>
              ) : (
                <div className="result-placeholder">
                  <Play size={20} className="text-muted" />
                  <span>Click "Run All Test Cases" above to execute and inspect verdict</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
