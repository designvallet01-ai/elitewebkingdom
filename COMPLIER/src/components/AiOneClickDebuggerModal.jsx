import React, { useState } from 'react';
import { 
  Sparkles, 
  Wrench, 
  Check, 
  X, 
  Play, 
  Copy, 
  FileCode2, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Zap,
  Languages
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AiOneClickDebuggerModal({
  isOpen,
  onClose,
  healingData,
  onApplyFix,
  onApplyAndRun
}) {
  const [copied, setCopied] = useState(false);
  const [langMode, setLangMode] = useState('en'); // 'en' | 'te' (Telugu)

  if (!isOpen || !healingData) return null;

  const handleCopyFixed = () => {
    navigator.clipboard.writeText(healingData.fixedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = () => {
    if (onApplyFix) {
      onApplyFix(healingData.fixedCode);
    }
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
    onClose();
  };

  const handleApplyAndRunClick = () => {
    if (onApplyAndRun) {
      onApplyAndRun(healingData.fixedCode);
    }
    onClose();
  };

  const explanation = langMode === 'te' && healingData.rootCauseTe 
    ? healingData.rootCauseTe 
    : (healingData.rootCauseEn || 'Syntax or runtime exception detected.');

  const fixSummary = langMode === 'te' && healingData.fixSummaryTe
    ? healingData.fixSummaryTe
    : (healingData.fixSummaryEn || 'Applied automated AST refactoring and missing syntax completion.');

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container ai-debug-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge ai-badge">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>AI One-Click Fix Debugger</h2>
                <span className="s-tier-pill ai-pill">Autonomous Diagnostic Patch</span>
              </div>
              <p className="modal-subtitle">Root-cause diagnosis, broken line isolation, and 1-click clean refactoring</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ai-debug-modal-body">
          {/* Diagnostic Card Banner */}
          <div className="diagnostic-hero-card">
            <div className="diag-left">
              <span className="diag-type-badge">{healingData.errorType || 'Runtime Error'}</span>
              <span className="diag-line-badge">Line {healingData.problemLine || 1}</span>
              <span className={`diag-severity-badge severity-${(healingData.severity || 'high').toLowerCase()}`}>
                Severity: {healingData.severity || 'High'}
              </span>
            </div>

            <div className="diag-lang-toggle">
              <button
                className={`lang-pill ${langMode === 'en' ? 'active' : ''}`}
                onClick={() => setLangMode('en')}
              >
                English
              </button>
              <button
                className={`lang-pill ${langMode === 'te' ? 'active' : ''}`}
                onClick={() => setLangMode('te')}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>

          {/* Broken Snippet Highlight */}
          {healingData.problemSnippet && (
            <div className="broken-line-card">
              <div className="broken-card-header">
                <AlertTriangle size={15} className="text-rose-400" />
                <span>Broken Line {healingData.problemLine}:</span>
              </div>
              <pre className="broken-code-snippet">{healingData.problemSnippet}</pre>
            </div>
          )}

          {/* Explanation & Solution */}
          <div className="ai-explanation-box">
            <h4>💡 Why this happened (Root Cause)</h4>
            <p className="ai-explanation-text">{explanation}</p>
            <div className="ai-fix-summary">
              <strong>🔧 Safe Refactoring Patch:</strong> {fixSummary}
            </div>
          </div>

          {/* Code Diff Preview */}
          <div className="ai-diff-section">
            <div className="diff-header">
              <div className="diff-title">
                <FileCode2 size={15} className="text-purple-400" />
                <span>Generated Fix Code Patch</span>
              </div>
              <button className="diff-copy-btn" onClick={handleCopyFixed}>
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Fixed Code'}</span>
              </button>
            </div>
            <pre className="fixed-code-preview">{healingData.fixedCode}</pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="s-tier-modal-footer">
          <button className="footer-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <div className="footer-action-group">
            <button className="footer-btn patch-btn" onClick={handleApplyClick}>
              <Wrench size={15} />
              <span>1-Click Apply Patch to Editor</span>
            </button>
            <button className="footer-btn run-btn" onClick={handleApplyAndRunClick}>
              <Play size={15} />
              <span>Apply Patch & Re-Run Instantly</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
