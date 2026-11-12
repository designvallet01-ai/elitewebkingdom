import React, { useMemo, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Cpu,
  HelpCircle,
  ChevronRight,
  Layers
} from 'lucide-react';
import { generateDryRunTrace } from '../services/dryRunTracer';

export default function XRayDryRunPanel({
  code = '',
  language = 'python',
  onSelectLine
}) {
  const trace = useMemo(() => generateDryRunTrace(code, language), [code, language]);
  const steps = trace.steps || [];

  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openVivaIdx, setOpenVivaIdx] = useState(0);

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
    }, 650);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const activeStep = steps[stepIdx] || null;
  const prevStep = stepIdx > 0 ? steps[stepIdx - 1] : null;

  useEffect(() => {
    if (activeStep && typeof onSelectLine === 'function') {
      onSelectLine(activeStep.lineNumber);
    }
  }, [stepIdx]);

  const varEntries = activeStep ? Object.entries(activeStep.variables || {}) : [];

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
        background: 'rgba(6, 10, 22, 0.6)'
      }}
    >
      {/* Header + Controls */}
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
                : 'Write variables or loops to inspect step-by-step execution'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => { setIsPlaying(false); setStepIdx(0); }}
            disabled={steps.length === 0 || stepIdx === 0}
            title="Reset to Step 1"
            style={{
              height: '28px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.28)',
              background: 'rgba(15,23,42,0.75)',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            onClick={() => { setIsPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
            disabled={steps.length === 0 || stepIdx === 0}
            title="Previous Step"
            style={{
              height: '28px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.28)',
              background: 'rgba(15,23,42,0.75)',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
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
            style={{
              height: '28px',
              padding: '0 8px',
              borderRadius: '8px',
              border: '1px solid rgba(148,163,184,0.28)',
              background: 'rgba(15,23,42,0.75)',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <SkipForward size={13} />
          </button>
        </div>
      </div>

      {/* Live Step Scrubber + Active Variable Memory State */}
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
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic' }}>No scalar variables assigned up to this step.</div>
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
        </div>
      )}

      {/* Compact Iteration Execution Table */}
      {steps.length > 0 && (
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
            maxHeight: '210px',
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
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Action / State</th>
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

      {/* Placement Interview & Lab Viva Q&A Generator */}
      <div
        style={{
          padding: '12px',
          borderRadius: '12px',
          background: 'linear-gradient(155deg, rgba(22, 33, 62, 0.65), rgba(9, 14, 28, 0.85))',
          border: '1px solid rgba(168, 85, 247, 0.28)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px', color: '#e9d5ff', fontWeight: 700, fontSize: '0.8rem' }}>
          <Sparkles size={14} className="text-purple-400" />
          <span>Auto Lab Viva & Placement Interview Questions (From Your Code)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(trace.vivaQuestions || []).map((item, qIdx) => {
            const opened = openVivaIdx === qIdx;
            return (
              <div
                key={qIdx}
                style={{
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(15, 23, 42, 0.65)',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenVivaIdx(opened ? -1 : qIdx)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f1f5f9',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={13} className="text-cyan-400" />
                    {item.q}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      flexShrink: 0,
                      transform: opened ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.16s ease'
                    }}
                  />
                </button>
                {opened && (
                  <div style={{ padding: '0 10px 9px 28px', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

