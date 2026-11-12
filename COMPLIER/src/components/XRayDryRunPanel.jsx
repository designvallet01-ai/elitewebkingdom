import React, { useMemo, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Cpu,
  Layers,
  GitCompare,
  Pin,
  CheckCircle2,
  XCircle,
  Gauge
} from 'lucide-react';
import { generateDryRunTrace } from '../services/dryRunTracer';

export default function XRayDryRunPanel({
  code = '',
  language = 'python',
  onSelectLine,
  terminalEntries = [],
  lastStats = null
}) {
  const trace = useMemo(() => generateDryRunTrace(code, language), [code, language]);
  const steps = trace.steps || [];

  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expectedOutput, setExpectedOutput] = useState('');
  const [baselineRun, setBaselineRun] = useState(null);

  useEffect(() => {
    setStepIdx(0);
    setIsPlaying(false);
  }, [code, language]);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    const timer = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const activeStep = steps[stepIdx] || null;
  const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;

  useEffect(() => {
    if (activeStep && typeof onSelectLine === 'function') {
      onSelectLine(activeStep.lineNumber);
    }
  }, [stepIdx]);

  const actualStdout = useMemo(() => {
    return (terminalEntries || [])
      .filter((e) => e.type === 'stdout')
      .map((e) => e.text)
      .join('')
      .trimEnd();
  }, [terminalEntries]);

  const diffReport = useMemo(() => {
    if (!expectedOutput.trim() && !actualStdout) return null;
    const expTrimmed = expectedOutput.replace(/\r\n/g, '\n').trimEnd();
    const actTrimmed = actualStdout.replace(/\r\n/g, '\n').trimEnd();
    const expLines = expTrimmed.split('\n');
    const actLines = actTrimmed.split('\n');
    const maxLen = Math.max(expLines.length, actLines.length);
    const rows = [];
    let mismatchCount = 0;

    for (let i = 0; i < maxLen; i++) {
      const eLine = expLines[i] ?? '';
      const aLine = actLines[i] ?? '';
      const exact = eLine === aLine;
      const trimmedMatch = !exact && eLine.trim() === aLine.trim();
      if (!exact) mismatchCount++;
      rows.push({ line: i + 1, expected: eLine, actual: aLine, exact, trimmedMatch });
    }
    return {
      isExactMatch: mismatchCount === 0 && expTrimmed.length > 0,
      mismatchCount,
      rows
    };
  }, [expectedOutput, actualStdout]);

  const varEntries = activeStep ? Object.entries(activeStep.variables || {}) : [];
  const currentTimeMs = lastStats?.executionTime ?? null;
  const speedupRatio = baselineRun?.timeMs && currentTimeMs
    ? Number((baselineRun.timeMs / Math.max(1, currentTimeMs)).toFixed(2))
    : null;

  return (
    <div
      className="xray-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '14px',
        gap: '12px',
        background: 'rgba(6, 10, 22, 0.62)'
      }}
    >
      {/* 1. X-Ray Header + Time-Travel Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '12px',
          background: 'linear-gradient(145deg, rgba(16, 25, 48, 0.85), rgba(8, 13, 28, 0.92))',
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={16} className="text-cyan-400" />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
              X-Ray Live Dry-Run Tracer
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {steps.length > 0
                ? `Step ${stepIdx + 1} of ${steps.length} • Line ${activeStep?.lineNumber || 1}`
                : 'Write variables or loops to trace execution state'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setStepIdx(0); }}
            disabled={steps.length === 0 || stepIdx === 0}
            title="Reset to Step 1"
            style={{ height: '28px', padding: '0 8px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.75)', color: '#cbd5e1', cursor: 'pointer' }}
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
            disabled={steps.length === 0 || stepIdx === 0}
            title="Previous Step"
            style={{ height: '28px', padding: '0 8px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.75)', color: '#cbd5e1', cursor: 'pointer' }}
          >
            <SkipBack size={13} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepIdx >= steps.length - 1) setStepIdx(0);
              setIsPlaying((p) => !p);
            }}
            disabled={steps.length === 0}
            style={{
              height: '28px',
              padding: '0 11px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.22))',
              color: '#6ee7b7',
              fontWeight: 700,
              fontSize: '0.74rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Auto Step'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setStepIdx((s) => Math.min(steps.length - 1, s + 1)); }}
            disabled={steps.length === 0 || stepIdx >= steps.length - 1}
            title="Next Step"
            style={{ height: '28px', padding: '0 8px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.28)', background: 'rgba(15,23,42,0.75)', color: '#cbd5e1', cursor: 'pointer' }}
          >
            <SkipForward size={13} />
          </button>
        </div>
      </div>

      {/* 2. Active Variable Memory State + Accumulated Step Output */}
      {activeStep && (
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {steps.length > 1 && (
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={stepIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setStepIdx(Number(e.target.value));
              }}
              style={{ width: '100%', accentColor: '#38bdf8', marginBottom: '10px', cursor: 'pointer' }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>
              Line {activeStep.lineNumber}: <code style={{ color: '#e2e8f0' }}>{activeStep.code}</code>
            </span>
            <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '999px' }}>
              {activeStep.note}
            </span>
          </div>

          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={12} /> Live Variable Watch:
          </div>
          {varEntries.length === 0 ? (
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>No variables assigned yet.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {varEntries.map(([name, val]) => {
                const prevVal = prevStep?.variables?.[name];
                const changed = JSON.stringify(prevVal) !== JSON.stringify(val);
                return (
                  <div
                    key={name}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      background: changed ? 'rgba(16, 185, 129, 0.16)' : 'rgba(30, 41, 59, 0.72)',
                      border: changed ? '1px solid rgba(52, 211, 153, 0.48)' : '1px solid rgba(148, 163, 184, 0.2)',
                      color: changed ? '#6ee7b7' : '#cbd5e1'
                    }}
                  >
                    <strong>{name}</strong> = {JSON.stringify(val)}
                  </div>
                );
              })}
            </div>
          )}

          {activeStep.accumulatedOutput && (
            <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '8px', background: '#030712', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#a7f3d0', whiteSpace: 'pre-wrap' }}>
              <span style={{ color: '#64748b', fontSize: '0.66rem', display: 'block', marginBottom: '3px' }}>STDOUT AT STEP {activeStep.step}:</span>
              {activeStep.accumulatedOutput}
            </div>
          )}
        </div>
      )}

      {/* 3. Iteration Execution Table */}
      {steps.length > 0 && (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
            maxHeight: '190px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            background: 'rgba(9, 14, 28, 0.78)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.96)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Line</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>State</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((st, idx) => {
                const isActive = idx === stepIdx;
                return (
                  <tr
                    key={st.step}
                    onClick={() => { setIsPlaying(false); setStepIdx(idx); }}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                      color: isActive ? '#f8fafc' : '#cbd5e1'
                    }}
                  >
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{st.step}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#38bdf8' }}>L{st.lineNumber}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{st.note}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {Object.entries(st.variables).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ') || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Execution Output Diff Checker & Runtime Speedup Comparator */}
      <div
        style={{
          padding: '12px',
          borderRadius: '12px',
          background: 'linear-gradient(155deg, rgba(16, 25, 48, 0.72), rgba(7, 11, 24, 0.88))',
          border: '1px solid rgba(56, 189, 248, 0.24)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>
            <GitCompare size={15} className="text-cyan-400" />
            <span>Output Diff Checker &amp; Runtime Benchmark</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {currentTimeMs !== null && (
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', padding: '2px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={11} /> {currentTimeMs}ms
              </span>
            )}
            <button
              type="button"
              onClick={() => setBaselineRun({ timeMs: currentTimeMs || 1, output: actualStdout })}
              disabled={!actualStdout && currentTimeMs === null}
              title="Pin current run as baseline to compare optimization speedup"
              style={{
                padding: '3px 9px',
                borderRadius: '7px',
                border: '1px solid rgba(16, 185, 129, 0.38)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#6ee7b7',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Pin size={11} />
              <span>{baselineRun ? `Baseline: ${baselineRun.timeMs}ms` : 'Pin Baseline Run'}</span>
            </button>
          </div>
        </div>

        {speedupRatio !== null && baselineRun && (
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: speedupRatio >= 1 ? '#34d399' : '#fbbf24', padding: '5px 9px', borderRadius: '8px', background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Benchmark Compare: Baseline {baselineRun.timeMs}ms vs Current {currentTimeMs}ms → {speedupRatio >= 1 ? `${speedupRatio}x faster` : `${(1 / speedupRatio).toFixed(2)}x slower`}
          </div>
        )}

        <textarea
          value={expectedOutput}
          onChange={(e) => setExpectedOutput(e.target.value)}
          placeholder="Paste expected stdout (e.g., Codeforces / LeetCode / sample test output) to diff character-by-character against your last run..."
          rows={3}
          style={{
            width: '100%',
            resize: 'vertical',
            background: '#030712',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            borderRadius: '8px',
            padding: '8px 10px',
            color: '#e2e8f0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            outline: 'none'
          }}
        />

        {diffReport && expectedOutput.trim() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 700, color: diffReport.isExactMatch ? '#34d399' : '#fb7185' }}>
              {diffReport.isExactMatch ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>
                {diffReport.isExactMatch
                  ? 'EXACT MATCH (100% character-identical)'
                  : `${diffReport.mismatchCount} line mismatch(es) detected`}
              </span>
            </div>
            <div style={{ maxHeight: '140px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: '#020617', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              {diffReport.rows.map((r) => (
                <div
                  key={r.line}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 1fr',
                    gap: '8px',
                    padding: '4px 8px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: r.exact ? 'transparent' : r.trimmedMatch ? 'rgba(245,158,11,0.12)' : 'rgba(244,63,94,0.14)'
                  }}
                >
                  <span style={{ color: '#64748b' }}>L{r.line}</span>
                  <span style={{ color: '#34d399', whiteSpace: 'pre-wrap' }} title="Expected">{r.expected || '∅'}</span>
                  <span style={{ color: r.exact ? '#cbd5e1' : '#fda4af', whiteSpace: 'pre-wrap' }} title="Actual">
                    {r.actual || '∅'}{r.trimmedMatch ? ' (trailing space diff)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
