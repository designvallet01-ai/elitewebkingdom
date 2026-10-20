import React, { useState } from 'react';
import { 
  Sparkles, 
  Wrench, 
  Check, 
  X, 
  Play, 
  Copy, 
  FileCode2,
  ShieldCheck
} from 'lucide-react';

export default function AiErrorFixModal({
  isOpen,
  onClose,
  healingData,
  onApplyFix,
  onApplyAndRun
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !healingData) return null;

  const handleCopyFixedCode = () => {
    navigator.clipboard.writeText(healingData.fixedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityClass = (healingData.severity || 'medium').toLowerCase();

  return (
    <div className="ai-healer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="ai-healer-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="ai-healer-header">
          <div className="ai-healer-header-left">
            <div className="ai-healer-icon-badge">
              <Sparkles size={20} />
            </div>
            <div className="ai-healer-title-wrap">
              <h3>
                <span>Elite AI Code Doctor</span>
                <span className="ai-pill-tag">Autonomous Agent</span>
              </h3>
              <p>Root-cause diagnosis & 1-click AST clean code repair</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="ai-modal-close-btn"
            title="Close modal"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ai-healer-body">
          {/* Diagnostic Badge Bar */}
          <div className="ai-diagnostic-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`ai-severity-badge ${severityClass}`}>
                {healingData.severity || 'ERROR'}
              </span>
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                {healingData.errorType}
              </strong>
            </div>

            {healingData.problemLine && (
              <span className="ai-line-locator">
                Detected at Line #{healingData.problemLine}
              </span>
            )}
          </div>

          {/* Root Cause Explanations (Dual English + Telugu) */}
          <div className="ai-causes-grid">
            <div className="ai-cause-card">
              <span className="ai-cause-label en">Root Cause (English)</span>
              <p>{healingData.rootCauseEn}</p>
            </div>

            <div className="ai-cause-card">
              <span className="ai-cause-label te">సమస్య వివరణ (Telugu)</span>
              <p>{healingData.rootCauseTe}</p>
            </div>
          </div>

          {/* Fix Action Plan */}
          <div className="ai-action-plan-box">
            <ShieldCheck size={18} style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#c7d2fe' }}>Repair Strategy: </strong>
              <span>{healingData.fixSummaryEn} ({healingData.fixSummaryTe})</span>
            </div>
          </div>

          {/* Repaired Code Preview */}
          <div className="ai-repaired-code-block">
            <div className="ai-code-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <FileCode2 size={14} style={{ color: '#fbbf24' }} />
                Clean Repaired Code (AST Diff Applied)
              </span>
              <button 
                type="button"
                onClick={handleCopyFixedCode}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem'
                }}
              >
                {copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="ai-code-scroll">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {healingData.fixedCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="ai-healer-footer">
          <button
            type="button"
            onClick={onClose}
            className="ai-btn-dismiss"
          >
            Dismiss
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onApplyFix(healingData.fixedCode);
                onClose();
              }}
              className="ai-btn-apply"
            >
              <Wrench size={14} />
              <span>Apply Fix to Editor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onApplyAndRun) {
                  onApplyAndRun(healingData.fixedCode);
                } else {
                  onApplyFix(healingData.fixedCode);
                }
                onClose();
              }}
              className="ai-btn-apply-run"
            >
              <Play size={13} fill="currentColor" />
              <span>Apply & Re-Run Instantly ↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
