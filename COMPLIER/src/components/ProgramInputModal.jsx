import React, { useState, useEffect, useRef } from 'react';
import { Play, CornerDownLeft, X, Sparkles, HelpCircle, Terminal } from 'lucide-react';

export default function ProgramInputModal({
  isOpen,
  onClose,
  onSubmitInput,
  onSkip,
  code = '',
  language = 'python',
  savedStdin = ''
}) {
  const [inputValue, setInputValue] = useState(savedStdin || '');
  const inputRef = useRef(null);

  // Extract detected prompt from code if any
  const detectedPrompt = React.useMemo(() => {
    if (!code) return null;
    if (language === 'python' || language === 'py') {
      const match = code.match(/input\s*\(\s*["']([^"']+)["']\s*\)/);
      if (match && match[1]) return match[1].trim();
    }
    return null;
  }, [code, language]);

  useEffect(() => {
    if (isOpen) {
      setInputValue(savedStdin || '');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen, savedStdin]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSubmitInput(inputValue);
  };

  return (
    <div className="program-input-modal-backdrop" onClick={onClose}>
      <div 
        className="program-input-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Provide standard input for program"
      >
        <div className="input-modal-header">
          <div className="modal-title-group">
            <div className="input-icon-badge">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="input-modal-title">Program Input Required</h3>
              <p className="input-modal-subtitle">
                Your code has <kbd>{language === 'python' ? 'input()' : language === 'cpp' ? 'cin >>' : 'scanf()'}</kbd> waiting for user input.
              </p>
            </div>
          </div>
          <button className="input-modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="input-modal-body">
          {detectedPrompt && (
            <div className="detected-prompt-badge">
              <span className="badge-tag">Program Prompt:</span>
              <span className="badge-text">"{detectedPrompt}"</span>
            </div>
          )}

          <div className="input-field-group">
            <label className="input-field-label">
              Enter Input (stdin):
            </label>
            <textarea
              ref={inputRef}
              className="stdin-modal-textarea"
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={detectedPrompt ? `e.g. Type your response for '${detectedPrompt}'...` : "Type input values here (one per line if multiple)..."}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span className="input-hint">
              💡 For multiple inputs, enter each value on a new line. Press <kbd>Ctrl+Enter</kbd> to submit.
            </span>
          </div>

          <div className="input-modal-actions">
            <button type="button" className="input-btn text-muted-btn" onClick={onSkip}>
              Run Without Input
            </button>
            <button type="submit" className="input-btn primary-btn" id="btn-submit-program-stdin">
              <Play size={14} fill="currentColor" />
              <span>Run Code with Input</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
