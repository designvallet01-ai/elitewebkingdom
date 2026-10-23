import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2, 
  Zap,
  Settings2,
  RefreshCw,
  Bot,
  Cpu,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  fetchRealAiDiagnosis, 
  getStoredAiConfig, 
  setStoredAiConfig 
} from '../services/aiErrorHealer';

export default function AiOneClickDebuggerModal({
  isOpen,
  onClose,
  healingData: initialHealingData,
  code = '',
  language = 'python',
  stderr = '',
  stdout = '',
  lastStats = null,
  onApplyFix,
  onApplyAndRun
}) {
  const [data, setData] = useState(initialHealingData);
  const [copied, setCopied] = useState(false);
  const [langMode, setLangMode] = useState('en'); // 'en' | 'te'
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState(() => getStoredAiConfig());
  const timerRef = useRef(null);

  // Sync initial healing data when opened
  useEffect(() => {
    if (isOpen) {
      setData(initialHealingData);
      // Auto-trigger Real AI if there is an actual error and it wasn't analyzed by Real AI yet
      if (initialHealingData && !initialHealingData.isHealthy && !initialHealingData.isRealAi) {
        triggerRealAiAnalysis();
      }
    }
  }, [isOpen, initialHealingData]);

  // Stopwatch for real AI call
  useEffect(() => {
    if (isLoadingAi) {
      setElapsedTime(0);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - start) / 100) / 10);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoadingAi]);

  if (!isOpen) return null;

  const currentData = data || initialHealingData;
  const isHealthy = Boolean(currentData?.isHealthy);
  const hasAutoFix = Boolean(currentData?.hasAutoFix && currentData?.fixedCode);

  const handleCopyFixed = () => {
    navigator.clipboard.writeText(currentData?.fixedCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = () => {
    if (!isHealthy && hasAutoFix && onApplyFix) {
      onApplyFix(currentData.fixedCode);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
    }
    onClose();
  };

  const handleApplyAndRunClick = () => {
    if (onApplyAndRun && currentData?.fixedCode) {
      onApplyAndRun(currentData.fixedCode);
    }
    onClose();
  };

  const triggerRealAiAnalysis = async (overrideProvider) => {
    setIsLoadingAi(true);
    const activeProvider = overrideProvider || aiConfig.provider;

    try {
      const realResult = await fetchRealAiDiagnosis({
        code,
        language,
        stderr,
        stdout,
        lastStats,
        provider: activeProvider,
        apiKey: aiConfig.apiKey,
        model: aiConfig.model
      });
      setData(realResult);
    } catch (err) {
      console.error('Real AI Diagnostic failed:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSaveConfig = (updated) => {
    const nextConfig = { ...aiConfig, ...updated };
    setAiConfig(nextConfig);
    setStoredAiConfig(nextConfig);
  };

  const explanation = langMode === 'te' && currentData?.rootCauseTe 
    ? currentData.rootCauseTe 
    : (currentData?.rootCauseEn || 'No errors detected in the program.');

  const fixSummary = langMode === 'te' && currentData?.fixSummaryTe
    ? currentData.fixSummaryTe
    : (currentData?.fixSummaryEn || 'No refactoring required. Code is operational.');

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container ai-debug-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className={`modal-icon-badge ${isHealthy ? 'text-emerald-400 bg-emerald-500/10' : 'ai-badge'}`}>
              {isHealthy ? <ShieldCheck size={22} className="text-emerald-400" /> : <Bot size={22} className="text-purple-400" />}
            </div>
            <div>
              <div className="modal-title-row">
                <h2>{isHealthy ? 'AI Code Health & Integrity Monitor' : 'Real Autonomous AI Code Doctor'}</h2>
                <span className={`s-tier-pill ${isHealthy ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'ai-pill'}`}>
                  {currentData?.isRealAi ? (currentData?.modelUsed || 'Real LLM Engine') : (isHealthy ? 'All Clear' : 'Real AI Diagnostic')}
                </span>
              </div>
              <p className="modal-subtitle">
                {isHealthy 
                  ? 'Real-time AST parsing, compiler verification, and code sanity inspection'
                  : 'Deep LLM root-cause reasoning (English + తెలుగు) and 1-click clean refactoring'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className={`s-tier-action-btn ${showSettings ? 'active' : ''}`}
              onClick={() => setShowSettings(prev => !prev)}
              title="Configure AI Engine / API Key"
              style={{
                background: showSettings ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: showSettings ? '#c084fc' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <Cpu size={14} />
              <span>AI Engine</span>
              {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AI Engine Settings Drawer */}
        {showSettings && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 16px',
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>Active Real AI Model Provider:</span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Select your preferred intelligence engine</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                onClick={() => {
                  handleSaveConfig({ provider: 'cloud' });
                  triggerRealAiAnalysis('cloud');
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: aiConfig.provider === 'cloud' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: aiConfig.provider === 'cloud' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: aiConfig.provider === 'cloud' ? '#e9d5ff' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                ⚡ Cloud AI (Free, Zero Setup)
              </button>
              <button
                onClick={() => handleSaveConfig({ provider: 'gemini' })}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: aiConfig.provider === 'gemini' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: aiConfig.provider === 'gemini' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: aiConfig.provider === 'gemini' ? '#bae6fd' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                ✨ Gemini 1.5 Flash (Custom Key)
              </button>
              <button
                onClick={() => handleSaveConfig({ provider: 'groq' })}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: aiConfig.provider === 'groq' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: aiConfig.provider === 'groq' ? '1px solid #f97316' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: aiConfig.provider === 'groq' ? '#fed7aa' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem'
                }}
              >
                🚀 Groq (Llama-3.3 70B)
              </button>
            </div>

            {aiConfig.provider !== 'cloud' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Key size={14} style={{ color: '#94a3b8' }} />
                <input
                  type="password"
                  placeholder={`Enter your ${aiConfig.provider === 'gemini' ? 'Google Gemini' : 'Groq'} API Key...`}
                  value={aiConfig.apiKey || ''}
                  onChange={(e) => handleSaveConfig({ apiKey: e.target.value })}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => triggerRealAiAnalysis()}
                  style={{
                    background: '#a855f7',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Save & Analyze
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="ai-debug-modal-body">
          {/* Diagnostic Card Banner */}
          <div className={`diagnostic-hero-card ${isHealthy ? 'healthy' : ''}`}>
            <div className="diag-left">
              {isHealthy ? (
                <>
                  <span className="diag-type-badge diag-healthy-badge">
                    <CheckCircle2 size={13} />
                    Code Healthy (0 Errors)
                  </span>
                  <span className="diag-line-badge healthy">All Clear</span>
                  <span className="diag-severity-badge severity-optimal">Optimal</span>
                </>
              ) : (
                <>
                  <span className="diag-type-badge">{currentData?.errorType || 'Runtime Error'}</span>
                  {currentData?.problemLine && (
                    <span className="diag-line-badge">Line {currentData.problemLine}</span>
                  )}
                  <span className={`diag-severity-badge severity-${(currentData?.severity || 'high').toLowerCase()}`}>
                    Severity: {currentData?.severity || 'High'}
                  </span>
                  {currentData?.isRealAi && (
                    <span style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#d8b4fe',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Zap size={11} /> Real AI Verified
                    </span>
                  )}
                </>
              )}
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

          {/* Real AI Loading Spinner Overlay / Bar */}
          {isLoadingAi && (
            <div style={{
              background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={18} className="animate-spin text-purple-400" />
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>
                    Streaming to Real AI Model ({aiConfig.provider === 'cloud' ? 'Cloud AI GPT-4o-mini' : aiConfig.provider})...
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Analyzing AST, compiler stack trace, and generating clean code patch...
                  </div>
                </div>
              </div>
              <span style={{ color: '#c084fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                {elapsedTime}s
              </span>
            </div>
          )}

          {/* Broken Snippet Highlight */}
          {!isHealthy && currentData?.problemSnippet && !isLoadingAi && (
            <div className="broken-line-card">
              <div className="broken-card-header">
                <AlertTriangle size={15} className="text-rose-400" />
                <span>Broken Line {currentData.problemLine ? currentData.problemLine : ''}:</span>
              </div>
              <pre className="broken-code-snippet">{currentData.problemSnippet}</pre>
            </div>
          )}

          {/* Explanation & Solution */}
          {!isLoadingAi && (
            <div className={`ai-explanation-box ${isHealthy ? 'healthy' : ''}`}>
              <h4>
                {isHealthy ? (
                  <span className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 size={16} /> 
                    Code Health Status (కోడ్ స్థితి)
                  </span>
                ) : (
                  <span className="flex items-center justify-between">
                    <span>💡 Why this happened (Root Cause)</span>
                    <button
                      onClick={() => triggerRealAiAnalysis()}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a855f7',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Re-run deep analysis with Real AI"
                    >
                      <RefreshCw size={12} />
                      <span>Re-analyze with Real AI</span>
                    </button>
                  </span>
                )}
              </h4>
              <p className="ai-explanation-text">{explanation}</p>
              <div className={`ai-fix-summary ${isHealthy ? 'ai-healthy-summary' : ''}`}>
                <strong>{isHealthy ? '✨ Verdict:' : '🔧 Safe Refactoring Patch:'}</strong> {fixSummary}
              </div>
            </div>
          )}

          {/* Code Preview Section */}
          {!isLoadingAi && (
            <div className="ai-diff-section">
              <div className="diff-header">
                <div className="diff-title">
                  <FileCode2 size={15} className={isHealthy ? 'text-emerald-400' : 'text-purple-400'} />
                  <span>
                    {isHealthy 
                      ? 'Active Source Code (No Modifications Needed)' 
                      : (hasAutoFix ? 'Real AI Generated Safe Refactoring Patch' : 'Current Source Code')}
                  </span>
                </div>
                <button className="diff-copy-btn" onClick={handleCopyFixed}>
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : (isHealthy ? 'Copy Code' : 'Copy Fixed Code')}</span>
                </button>
              </div>
              <pre className="fixed-code-preview" style={isHealthy ? { color: '#94a3b8' } : {}}>
                {currentData?.fixedCode}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="s-tier-modal-footer">
          <button className="footer-cancel-btn" onClick={onClose}>
            {isHealthy ? 'Dismiss' : 'Cancel'}
          </button>
          
          <div className="footer-action-group">
            {isHealthy ? (
              <>
                <button 
                  className="footer-btn run-btn"
                  onClick={onClose}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <ShieldCheck size={16} />
                  <span>Code is 100% Valid (Dismiss)</span>
                </button>
                <button 
                  className="footer-btn patch-btn" 
                  onClick={() => triggerRealAiAnalysis()}
                  style={{ background: '#3b82f6' }}
                >
                  <Bot size={15} />
                  <span>Deep AI Review</span>
                </button>
              </>
            ) : hasAutoFix ? (
              <>
                <button 
                  className="footer-btn patch-btn" 
                  onClick={handleApplyClick}
                  disabled={isLoadingAi}
                >
                  <Wrench size={15} />
                  <span>1-Click Apply AI Patch</span>
                </button>
                <button 
                  className="footer-btn run-btn" 
                  onClick={handleApplyAndRunClick}
                  disabled={isLoadingAi}
                >
                  <Play size={15} />
                  <span>Apply Patch & Re-Run Instantly</span>
                </button>
              </>
            ) : (
              <button 
                className="footer-btn run-btn" 
                onClick={() => triggerRealAiAnalysis()}
                disabled={isLoadingAi}
              >
                <RefreshCw size={15} className={isLoadingAi ? 'animate-spin' : ''} />
                <span>Re-Analyze with Real AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
