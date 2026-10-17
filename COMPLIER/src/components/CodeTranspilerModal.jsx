import React, { useState, useMemo, useEffect } from 'react';
import { 
  Languages, 
  ArrowRight, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  ArrowLeftRight, 
  CheckCheck,
  Code2,
  Play
} from 'lucide-react';
import { 
  transpileCode, 
  SUPPORTED_TRANSPILER_LANGUAGES, 
  normalizeLangId 
} from '../services/transpilerEngine';

export default function CodeTranspilerModal({
  isOpen,
  onClose,
  sourceCode = '',
  sourceLanguage = 'python',
  onApplyConvertedCode
}) {
  const [sourceLang, setSourceLang] = useState(() => normalizeLangId(sourceLanguage));
  const [targetLang, setTargetLang] = useState(() => {
    const s = normalizeLangId(sourceLanguage);
    return s === 'python' ? 'cpp' : 'python';
  });
  const [copied, setCopied] = useState(false);

  // Sync with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      const s = normalizeLangId(sourceLanguage);
      setSourceLang(s);
      setTargetLang(prev => (prev === s ? (s === 'python' ? 'cpp' : 'python') : prev));
    }
  }, [isOpen, sourceLanguage]);

  // Perform transpilation
  const convertedCode = useMemo(() => {
    if (!sourceCode || !sourceCode.trim()) {
      return '// Empty buffer. Please write or paste code in the editor to convert.';
    }
    return transpileCode(sourceCode, sourceLang, targetLang);
  }, [sourceCode, sourceLang, targetLang]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!convertedCode) return;
    navigator.clipboard.writeText(convertedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyConvertedCode && convertedCode) {
      onApplyConvertedCode(convertedCode, targetLang);
    }
    onClose();
  };

  const handleSwap = () => {
    const prevSrc = sourceLang;
    const prevTgt = targetLang;
    setSourceLang(prevTgt);
    setTargetLang(prevSrc);
  };

  const currentSourceMeta = SUPPORTED_TRANSPILER_LANGUAGES.find(l => l.id === sourceLang) || SUPPORTED_TRANSPILER_LANGUAGES[0];
  const currentTargetMeta = SUPPORTED_TRANSPILER_LANGUAGES.find(l => l.id === targetLang) || SUPPORTED_TRANSPILER_LANGUAGES[1];

  return (
    <div className="transpiler-modal-backdrop" onClick={onClose}>
      <div className="transpiler-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="transpiler-header">
          <div className="transpiler-title-group">
            <Languages size={22} className="text-cyan-400" />
            <div>
              <h3>Polyglot Code Transpiler & Universal AST Translator</h3>
              <p>Translate code across Python, C++, Java, JS, Go, Rust, C#, PHP with AST syntax mapping</p>
            </div>
          </div>
          <button type="button" className="transpiler-close-btn" onClick={onClose} aria-label="Close transpiler">
            <X size={18} />
          </button>
        </div>

        {/* Language Selector Bar */}
        <div className="transpiler-lang-bar">
          <div className="lang-side">
            <span className="lang-label">From Source:</span>
            <select 
              className="transpiler-select"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {SUPPORTED_TRANSPILER_LANGUAGES.map(lang => (
                <option key={`src-${lang.id}`} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="button" 
            className="transpiler-swap-btn" 
            onClick={handleSwap}
            title="Swap Source and Target Languages"
          >
            <ArrowLeftRight size={16} />
          </button>

          <div className="lang-side">
            <span className="lang-label">Convert To:</span>
            <select 
              className="transpiler-select highlight"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {SUPPORTED_TRANSPILER_LANGUAGES.map(lang => (
                <option key={`tgt-${lang.id}`} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Code Comparison Arena */}
        <div className="transpiler-body-grid">
          {/* Source Box */}
          <div className="transpiler-code-box">
            <div className="code-box-header">
              <span className="code-box-title">
                {currentSourceMeta.icon} Original ({currentSourceMeta.name})
              </span>
              <span className="code-box-meta">
                {sourceCode ? `${sourceCode.split('\n').length} lines` : '0 lines'}
              </span>
            </div>
            <pre className="code-box-pre">
              <code>{sourceCode || '// Empty buffer'}</code>
            </pre>
          </div>

          {/* Target Box */}
          <div className="transpiler-code-box target">
            <div className="code-box-header">
              <span className="code-box-title">
                {currentTargetMeta.icon} Transpiled ({currentTargetMeta.name})
              </span>
              <button 
                type="button" 
                className={`transpiler-copy-btn ${copied ? 'copied' : ''}`} 
                onClick={handleCopy}
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="code-box-pre target-pre">
              <code>{convertedCode}</code>
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="transpiler-footer">
          <div className="transpiler-footer-hint">
            <Sparkles size={14} className="text-cyan-400" />
            <span>AST syntax validated. Applying will load the translated code directly into the editor for instant execution.</span>
          </div>
          <div className="transpiler-btn-group">
            <button type="button" className="transpiler-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="transpiler-btn primary" onClick={handleApply}>
              <Play size={14} fill="currentColor" />
              <span>Apply & Switch to {currentTargetMeta.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
