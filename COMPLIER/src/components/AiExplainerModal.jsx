import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Zap, 
  Code2, 
  Bug, 
  BookOpen, 
  Copy, 
  Check, 
  Languages, 
  FileCheck,
  Flame,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { analyzeCodeWithAi } from '../services/aiCodeAnalyzer';

export default function AiExplainerModal({
  isOpen,
  onClose,
  code = '',
  language = 'python',
  onApplyOptimizedCode,
  onSelectLine
}) {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'complexity' | 'bugs' | 'optimizer'
  const [langPreference, setLangPreference] = useState('en'); // 'en' | 'te'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Run AI static analysis
  const analysis = useMemo(() => {
    return analyzeCodeWithAi(code, language);
  }, [code, language]);

  // Voice narration using Web Speech API
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = langPreference === 'te'
        ? `${analysis.title}. ${analysis.summaryTe}. సమయ కాంప్లెక్సిటీ ${analysis.timeComplexity}.`
        : `${analysis.title}. ${analysis.summaryEn}. Time complexity is ${analysis.timeComplexity}. Space complexity is ${analysis.spaceComplexity}. ${analysis.complexityExplanationEn}`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div 
        className="ai-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="ai-modal-header">
          <div className="ai-header-left">
            <div className="ai-badge-glow">
              <Sparkles size={16} className="text-cyan animate-pulse" />
            </div>
            <div>
              <div className="ai-modal-title">
                <span>AI Code & Flow Intelligence</span>
                <span className="ai-version-pill">GPT Logic Engine</span>
              </div>
              <span className="ai-modal-subtitle">
                {analysis.title} • {analysis.algorithmType}
              </span>
            </div>
          </div>

          <div className="ai-header-right">
            {/* Language Switcher (English vs Telugu) */}
            <div className="lang-switcher-pill">
              <Languages size={13} className="text-muted" />
              <button 
                className={`lang-btn ${langPreference === 'en' ? 'active' : ''}`}
                onClick={() => setLangPreference('en')}
              >
                English
              </button>
              <button 
                className={`lang-btn ${langPreference === 'te' ? 'active' : ''}`}
                onClick={() => setLangPreference('te')}
              >
                తెలుగు
              </button>
            </div>

            {/* Voice Read-Aloud Narration */}
            <button 
              className={`voice-btn ${isSpeaking ? 'active' : ''}`}
              onClick={handleToggleSpeech}
              title={isSpeaking ? 'Stop Audio Narration' : 'Listen to AI Logic Narration'}
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>

            <button className="ai-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quality Score Meter Banner */}
        <div className="ai-score-banner">
          <div className="score-group">
            <span className="score-label">Code Quality Score</span>
            <div className="score-pill-container">
              <span 
                className={`score-pill ${analysis.qualityScore >= 80 ? 'green' : analysis.qualityScore >= 50 ? 'amber' : 'red'}`}
              >
                {analysis.qualityScore} / 100
              </span>
              <span className="score-verdict">
                {analysis.qualityScore >= 80 ? 'Production Ready' : analysis.qualityScore >= 50 ? 'Needs Attention' : 'Critical Bugs Found'}
              </span>
            </div>
          </div>

          <div className="metrics-quick-row">
            <div className="metric-chip">
              <Clock size={13} className="text-cyan" />
              <span>Time: <b>{analysis.timeComplexity}</b></span>
            </div>
            <div className="metric-chip">
              <HardDrive size={13} className="text-purple" />
              <span>Space: <b>{analysis.spaceComplexity}</b></span>
            </div>
            <div className="metric-chip">
              {analysis.bugs.length === 0 ? (
                <>
                  <ShieldCheck size={13} className="text-emerald" />
                  <span className="text-emerald font-semibold">0 Hazards</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={13} className="text-rose" />
                  <span className="text-rose font-semibold">{analysis.bugs.length} Hazards Detected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="ai-nav-tabs">
          <button 
            className={`ai-tab-btn ${activeTab === 'explanation' ? 'active' : ''}`}
            onClick={() => setActiveTab('explanation')}
          >
            <BookOpen size={14} />
            <span>Logic & Flow Explanation</span>
            <span className="tab-count">{analysis.steps.length}</span>
          </button>

          <button 
            className={`ai-tab-btn ${activeTab === 'complexity' ? 'active' : ''}`}
            onClick={() => setActiveTab('complexity')}
          >
            <Clock size={14} />
            <span>Big-O Complexity Engine</span>
          </button>

          <button 
            className={`ai-tab-btn ${activeTab === 'bugs' ? 'active' : ''}`}
            onClick={() => setActiveTab('bugs')}
          >
            <Bug size={14} />
            <span>Bug & Hazard Hunter</span>
            {analysis.bugs.length > 0 && (
              <span className="tab-count danger">{analysis.bugs.length}</span>
            )}
          </button>

          <button 
            className={`ai-tab-btn ${activeTab === 'optimizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimizer')}
          >
            <Zap size={14} />
            <span>1-Click Code Optimizer</span>
            {analysis.optimizations.length > 0 && (
              <span className="tab-count highlight">{analysis.optimizations.length}</span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="ai-modal-body">
          {/* TAB 1: LOGIC & STEP BREAKDOWN */}
          {activeTab === 'explanation' && (
            <div className="tab-section">
              {/* Executive Summary Card */}
              <div className="summary-card">
                <div className="summary-title">
                  <Sparkles size={14} className="text-amber" />
                  <span>Executive Summary</span>
                </div>
                <p className="summary-text">
                  {langPreference === 'te' ? analysis.summaryTe : analysis.summaryEn}
                </p>
              </div>

              {/* Step-by-Step Logic Timeline */}
              <div className="steps-timeline">
                <div className="timeline-title">
                  <span>Line-by-Line Execution Walkthrough</span>
                  <span className="title-hint">Click any step to jump to that line in editor</span>
                </div>

                <div className="steps-list">
                  {analysis.steps.map((step) => (
                    <div 
                      key={step.stepNumber}
                      className="step-card"
                      onClick={() => {
                        if (onSelectLine && step.line) onSelectLine(step.line);
                      }}
                    >
                      <div className="step-left">
                        <span className="step-idx">{step.stepNumber}</span>
                        <span className="step-line">L{step.line}</span>
                      </div>
                      <div className="step-center">
                        <div className="step-code-preview">
                          <code>{step.code}</code>
                        </div>
                        <p className="step-desc">
                          {langPreference === 'te' ? step.explanationTe : step.explanationEn}
                        </p>
                      </div>
                      <div className="step-right">
                        <span className={`step-type-pill ${step.type}`}>
                          {step.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIG-O COMPLEXITY RADAR */}
          {activeTab === 'complexity' && (
            <div className="tab-section">
              <div className="complexity-grid">
                {/* Time Complexity Card */}
                <div className="complexity-card">
                  <div className="card-top">
                    <Clock size={18} className="text-cyan" />
                    <span className="card-heading">Time Complexity</span>
                  </div>
                  <div className="complexity-display">
                    <span className="big-o-value text-cyan">{analysis.timeComplexity}</span>
                    <span className="big-o-name">
                      {analysis.timeComplexity === 'O(1)' ? 'Constant Time' :
                       analysis.timeComplexity === 'O(log N)' ? 'Logarithmic Time' :
                       analysis.timeComplexity === 'O(N)' ? 'Linear Time' :
                       analysis.timeComplexity === 'O(N²)' ? 'Quadratic Time' : 'Polynomial Time'}
                    </span>
                  </div>
                  <p className="complexity-explanation">
                    {langPreference === 'te' ? analysis.complexityExplanationTe : analysis.complexityExplanationEn}
                  </p>
                </div>

                {/* Space Complexity Card */}
                <div className="complexity-card">
                  <div className="card-top">
                    <HardDrive size={18} className="text-purple" />
                    <span className="card-heading">Auxiliary Space Complexity</span>
                  </div>
                  <div className="complexity-display">
                    <span className="big-o-value text-purple">{analysis.spaceComplexity}</span>
                    <span className="big-o-name">
                      {analysis.spaceComplexity === 'O(1)' ? 'Constant Memory' : 'Linear Auxiliary Memory'}
                    </span>
                  </div>
                  <p className="complexity-explanation">
                    {analysis.spaceComplexity === 'O(1)' 
                      ? (langPreference === 'te' ? 'కేవలం ఫిక్స్డ్ వేరియబుల్స్ వాడుతున్నందున అదనపు మెమరీ అవసరం లేదు.' : 'Stores state strictly in primitive scalar registers with zero auxiliary heap growth.')
                      : (langPreference === 'te' ? 'ఇన్‌పుట్ పరిమాణంతో పాటు మెమరీ వినియోగం పెరుగుతుంది.' : 'Scales dynamic memory buffers proportionally to the total input size.')}
                  </p>
                </div>
              </div>

              {/* Big-O Cheat Sheet Reference */}
              <div className="big-o-reference">
                <span className="ref-title">Theoretical Efficiency Reference</span>
                <div className="ref-bars">
                  <div className="ref-row">
                    <span className="ref-o green">O(1) & O(log N)</span>
                    <span className="ref-label">Excellent (Instant / Scalable)</span>
                    <div className="ref-bar-fill green" style={{ width: '95%' }} />
                  </div>
                  <div className="ref-row">
                    <span className="ref-o cyan">O(N) & O(N log N)</span>
                    <span className="ref-label">Good (Linear & Divide/Conquer)</span>
                    <div className="ref-bar-fill cyan" style={{ width: '70%' }} />
                  </div>
                  <div className="ref-row">
                    <span className="ref-o amber">O(N²)</span>
                    <span className="ref-label">Moderate (Nested Iterations)</span>
                    <div className="ref-bar-fill amber" style={{ width: '40%' }} />
                  </div>
                  <div className="ref-row">
                    <span className="ref-o red">O(2^N) & O(N!)</span>
                    <span className="ref-label">Dangerous (Exponential Explosion)</span>
                    <div className="ref-bar-fill red" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUG & HAZARD HUNTER */}
          {activeTab === 'bugs' && (
            <div className="tab-section">
              {analysis.bugs.length === 0 ? (
                <div className="no-bugs-box">
                  <div className="no-bugs-icon">
                    <CheckCircle size={36} className="text-emerald" />
                  </div>
                  <span className="no-bugs-title">Clean Code - 0 Hazards Detected</span>
                  <p className="no-bugs-text">
                    Our static heuristic engine analyzed your loop bounds, division operations, dictionary keys, and syntax. No infinite loops, zero divisions, or dead code were discovered.
                  </p>
                </div>
              ) : (
                <div className="bugs-list">
                  {analysis.bugs.map((bug) => (
                    <div key={bug.id} className={`bug-card severity-${bug.severity}`}>
                      <div className="bug-header">
                        <div className="bug-title-group">
                          <AlertTriangle size={15} className={`bug-icon ${bug.severity}`} />
                          <span className="bug-title">{bug.title}</span>
                          <span className={`severity-tag ${bug.severity}`}>
                            {bug.severity.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <span className="bug-line">Line {bug.line}</span>
                      </div>
                      <p className="bug-desc">
                        {langPreference === 'te' ? bug.descTe : bug.descEn}
                      </p>
                      <div className="bug-fix-box">
                        <span className="fix-label">Recommended Fix:</span>
                        <span className="fix-text">{bug.fix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 1-CLICK CODE OPTIMIZER */}
          {activeTab === 'optimizer' && (
            <div className="tab-section">
              {analysis.optimizations.length === 0 ? (
                <div className="no-bugs-box">
                  <Flame size={36} className="text-amber" />
                  <span className="no-bugs-title">Already Optimal</span>
                  <p className="no-bugs-text">
                    Your code is already following efficient idiomatic patterns for this language. No quadratic sorting traps or slow I/O bottlenecks found.
                  </p>
                </div>
              ) : (
                <div className="optimizations-list">
                  {analysis.optimizations.map((opt) => (
                    <div key={opt.id} className="opt-card">
                      <div className="opt-header">
                        <div className="opt-title-group">
                          <Zap size={16} className="text-amber" />
                          <span className="opt-title">{opt.title}</span>
                        </div>
                        <span className="opt-impact">{opt.impact}</span>
                      </div>
                      <p className="opt-desc">
                        {langPreference === 'te' ? opt.descTe : opt.descEn}
                      </p>

                      {opt.improvedCode && (
                        <div className="opt-code-block">
                          <div className="code-header">
                            <span>OPTIMIZED SNIPPET</span>
                            <div className="code-actions">
                              <button
                                className="copy-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(opt.improvedCode);
                                  setCopiedCode(true);
                                  setTimeout(() => setCopiedCode(false), 2000);
                                }}
                              >
                                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>
                          <pre className="code-content">
                            <code>{opt.improvedCode}</code>
                          </pre>
                        </div>
                      )}

                      {onApplyOptimizedCode && opt.improvedCode && (
                        <button 
                          className="apply-opt-btn"
                          onClick={() => {
                            onApplyOptimizedCode(opt.improvedCode);
                            onClose();
                          }}
                        >
                          <Zap size={14} />
                          <span>Apply Optimized Code to Editor</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
