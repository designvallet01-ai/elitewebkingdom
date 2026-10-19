import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Wand2,
  CheckCheck,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { extractPromptsFromCode } from '../App';

// Helper to auto-generate sample test cases from code signature
function generateSampleTestCasesForCode(code = '', language = 'python') {
  const prompts = extractPromptsFromCode(code, language);
  
  if (prompts.length === 0) {
    // Code doesn't use input() / cin - static or function-based
    return [
      { id: 1, name: 'Standard Run', input: '', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 2, name: 'Secondary Run', input: '', expected: '', actual: '', status: 'idle', executionTime: null }
    ];
  }

  // If code asks for 1 input
  if (prompts.length === 1) {
    return [
      { id: 1, name: 'Case 1 (Standard: 5)', input: '5', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 2, name: 'Case 2 (Boundary: 0)', input: '0', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 3, name: 'Case 3 (Negative: -10)', input: '-10', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 4, name: 'Case 4 (Large: 100)', input: '100', expected: '', actual: '', status: 'idle', executionTime: null }
    ];
  }

  // If code asks for 2 inputs
  if (prompts.length === 2) {
    return [
      { id: 1, name: 'Case 1 (Positive: 10, 20)', input: '10\n20', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 2, name: 'Case 2 (Zeroes: 0, 0)', input: '0\n0', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 3, name: 'Case 3 (Negative: -5, 15)', input: '-5\n15', expected: '', actual: '', status: 'idle', executionTime: null },
      { id: 4, name: 'Case 4 (Large: 1000, 2500)', input: '1000\n2500', expected: '', actual: '', status: 'idle', executionTime: null }
    ];
  }

  // Multiple inputs (e.g. array length + elements)
  return [
    { id: 1, name: 'Case 1 (Standard Array)', input: '5\n10 20 30 40 50', expected: '', actual: '', status: 'idle', executionTime: null },
    { id: 2, name: 'Case 2 (Single Element)', input: '1\n42', expected: '', actual: '', status: 'idle', executionTime: null },
    { id: 3, name: 'Case 3 (Negative Elements)', input: '3\n-5 0 5', expected: '', actual: '', status: 'idle', executionTime: null }
  ];
}

export default function CpTestCaseWorkbench({
  code = '',
  language = 'python',
  onRunSingle,
  isRunning = false,
  isMobile = false
}) {
  const [testCases, setTestCases] = useState(() => generateSampleTestCasesForCode(code, language));
  const [activeCaseId, setActiveCaseId] = useState(1);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [isAutoGeneratingExpected, setIsAutoGeneratingExpected] = useState(false);
  const [copied, setCopied] = useState(false);

  // When code changes significantly and test cases are all empty, update template
  useEffect(() => {
    if (testCases.length <= 1 && !testCases[0].input && !testCases[0].expected) {
      setTestCases(generateSampleTestCasesForCode(code, language));
    }
  }, [code, language]);

  const activeCase = testCases.find(tc => tc.id === activeCaseId) || testCases[0] || {
    id: 1, name: 'Case 1', input: '', expected: '', actual: '', status: 'idle'
  };

  const handleAddTestCase = () => {
    const nextId = testCases.length > 0 ? Math.max(...testCases.map(t => t.id)) + 1 : 1;
    const newCase = {
      id: nextId,
      name: `Case ${nextId} (Custom)`,
      input: '',
      expected: '',
      actual: '',
      status: 'idle',
      executionTime: null
    };
    setTestCases(prev => [...prev, newCase]);
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
    setTestCases(prev => prev.map(tc => {
      if (tc.id === activeCaseId) {
        return { ...tc, [field]: value };
      }
      return tc;
    }));
  };

  // 1-Click: Auto-Generate Smart Test Cases for this Code
  const handleSmartGenerateCases = () => {
    const generated = generateSampleTestCasesForCode(code, language);
    setTestCases(generated);
    setActiveCaseId(generated[0]?.id || 1);
  };

  // 1-Click: Run code on all test case inputs to automatically populate "Expected Outputs"
  const handleAutoPopulateExpected = async () => {
    if (!onRunSingle || isRunning) return;
    setIsAutoGeneratingExpected(true);

    const updated = [...testCases];
    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      try {
        const res = await onRunSingle(tc.input);
        const stdout = typeof res === 'object' ? (res.stdout || res.stderr || '') : String(res || '');
        tc.expected = stdout.trim();
        tc.actual = stdout.trim();
        tc.status = 'passed';
      } catch (err) {
        console.warn('Auto expected run error:', err);
      }
      setTestCases([...updated]);
    }
    setIsAutoGeneratingExpected(false);
  };

  // Run all test cases and evaluate correctness
  const handleRunAllTests = async () => {
    if (!onRunSingle || isRunning) return;
    setIsExecutingAll(true);

    const updated = [...testCases];
    let allPassed = true;

    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      tc.status = 'running';
      setTestCases([...updated]);

      try {
        const start = performance.now();
        const res = await onRunSingle(tc.input);
        const end = performance.now();
        const duration = Math.round(end - start);

        let stdout = '';
        let isError = false;

        if (typeof res === 'object') {
          stdout = res.stdout || '';
          if (res.code !== 0 && res.stderr) {
            stdout = res.stderr;
            isError = true;
          }
        } else {
          stdout = String(res || '');
        }

        tc.actual = stdout.trim();
        tc.executionTime = duration;

        const cleanExpected = (tc.expected || '').trim();
        const cleanActual = tc.actual.trim();

        if (isError) {
          tc.status = 'failed';
          allPassed = false;
        } else if (!cleanExpected) {
          // If no expected was provided, treat successful execution as passed
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
    if (allPassed && updated.some(tc => (tc.expected || '').trim().length > 0)) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  // Run only the active test case
  const handleRunCurrentCase = async () => {
    if (!onRunSingle || isRunning) return;
    const updated = [...testCases];
    const tc = updated.find(t => t.id === activeCaseId);
    if (!tc) return;

    tc.status = 'running';
    setTestCases([...updated]);

    try {
      const start = performance.now();
      const res = await onRunSingle(tc.input);
      const end = performance.now();

      let stdout = '';
      if (typeof res === 'object') {
        stdout = res.stdout || (res.code !== 0 ? res.stderr : '');
      } else {
        stdout = String(res || '');
      }

      tc.actual = stdout.trim();
      tc.executionTime = Math.round(end - start);

      const cleanExpected = (tc.expected || '').trim();
      const cleanActual = tc.actual.trim();

      if (!cleanExpected || cleanExpected === cleanActual) {
        tc.status = 'passed';
      } else {
        tc.status = 'failed';
      }
    } catch (err) {
      tc.actual = err.message;
      tc.status = 'failed';
    }

    setTestCases([...updated]);
  };

  const passedCount = testCases.filter(t => t.status === 'passed').length;
  const failedCount = testCases.filter(t => t.status === 'failed').length;

  return (
    <div className="cp-workbench-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Workbench Header */}
      <div style={{
        padding: isMobile ? '8px 10px' : '12px 16px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '5px', borderRadius: '6px' }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? '0.82rem' : '0.9rem', color: '#f8fafc' }}>
                CP Judge Arena
              </span>
              {(passedCount > 0 || failedCount > 0) && (
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  background: failedCount === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: failedCount === 0 ? '#34d399' : '#f87171',
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}>
                  {passedCount}/{testCases.length} Passed
                </span>
              )}
            </div>
            {!isMobile && (
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Execute your code against edge cases, boundary conditions & multi-line test vectors
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="view-mode-action-btn"
            onClick={handleSmartGenerateCases}
            title="Auto-detect code input signatures and generate test cases"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', padding: '4px 8px' }}
          >
            <Wand2 size={12} />
            <span>Generate</span>
          </button>

          <button
            type="button"
            className="view-mode-action-btn"
            onClick={handleAutoPopulateExpected}
            disabled={isAutoGeneratingExpected || isRunning}
            title="Run code to capture actual output as expected answers"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#34d399', padding: '4px 8px' }}
          >
            <CheckCheck size={12} />
            <span>{isAutoGeneratingExpected ? 'Capturing...' : 'Set Expected'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunAllTests}
            disabled={isExecutingAll || isRunning}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontWeight: 600,
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: isExecutingAll || isRunning ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            {isExecutingAll ? <RefreshCw size={12} className="spin" /> : <Play size={12} fill="currentColor" />}
            <span>{isExecutingAll ? 'Evaluating...' : 'Run All'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left is Case Tabs, Right is Editor & Execution Output */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left / Top: Test Case Tabs */}
        <div style={{
          borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          borderBottom: isMobile ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: isMobile ? '6px 10px' : '12px',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: isMobile ? 'center' : 'stretch',
          overflowX: isMobile ? 'auto' : 'hidden',
          overflowY: isMobile ? 'hidden' : 'auto',
          gap: '8px',
          flexShrink: 0,
          width: isMobile ? '100%' : '240px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0' : '10px',
            gap: '8px',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Cases ({testCases.length})
            </span>
            <button
              type="button"
              onClick={handleAddTestCase}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.68rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={11} /> Add
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: '6px',
            flex: isMobile ? 1 : 'none',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '2px' : '0'
          }}>
            {testCases.map((tc, idx) => {
              const isActive = tc.id === activeCaseId;
              const isPassed = tc.status === 'passed';
              const isFailed = tc.status === 'failed';
              const isRun = tc.status === 'running';

              return (
                <div
                  key={tc.id}
                  onClick={() => setActiveCaseId(tc.id)}
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    padding: isMobile ? '4px 8px' : '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    flexShrink: isMobile ? 0 : 1,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isPassed ? (
                      <CheckCircle2 size={13} color="#10b981" />
                    ) : isFailed ? (
                      <XCircle size={13} color="#ef4444" />
                    ) : isRun ? (
                      <RefreshCw size={12} className="spin" color="#38bdf8" />
                    ) : (
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                    )}
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isActive ? '#38bdf8' : '#f8fafc', display: 'block' }}>
                        {isMobile ? `C${idx + 1}` : tc.name}
                      </span>
                      {tc.executionTime !== null && !isMobile && (
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{tc.executionTime}ms</span>
                      )}
                    </div>
                  </div>

                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTestCase(tc.id, e)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                      title="Delete Test Case"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Bottom: Active Test Case Details, Input/Expected/Actual */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: isMobile ? '10px' : '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={activeCase.name}
                onChange={(e) => handleUpdateActiveCase('name', e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '3px 7px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  maxWidth: isMobile ? '130px' : '220px'
                }}
              />
              {activeCase.status === 'passed' && (
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={13} /> Passed
                </span>
              )}
              {activeCase.status === 'failed' && (
                <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <XCircle size={13} /> Mismatch
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunCurrentCase}
              disabled={isRunning || activeCase.status === 'running'}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Play size={11} fill="currentColor" /> Run Case
            </button>
          </div>

          {/* Input & Expected Dual Pane (Stacked on Mobile) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '8px' : '12px',
            marginBottom: '10px'
          }}>
            {/* Standard Input (Stdin) */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Standard Input (Stdin):
              </label>
              <textarea
                value={activeCase.input}
                onChange={(e) => handleUpdateActiveCase('input', e.target.value)}
                placeholder="Enter input parameters (e.g. 5 or 10 20)..."
                rows={isMobile ? 3 : 5}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '7px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Expected Output */}
            <div>
              <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                Expected Output:
              </label>
              <textarea
                value={activeCase.expected}
                onChange={(e) => handleUpdateActiveCase('expected', e.target.value)}
                placeholder="Expected program output to verify correctness..."
                rows={isMobile ? 3 : 5}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '7px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Actual Program Output */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Actual Program Output:</span>
              {activeCase.executionTime !== null && (
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Time: {activeCase.executionTime} ms</span>
              )}
            </label>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: activeCase.status === 'passed' ? '1px solid rgba(16, 185, 129, 0.4)' : activeCase.status === 'failed' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: activeCase.status === 'failed' ? '#f87171' : '#f8fafc',
              minHeight: isMobile ? '60px' : '80px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {activeCase.actual ? activeCase.actual : <span style={{ color: '#64748b' }}>Run this test case to capture actual output from your code.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
