import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Terminal as TerminalIcon, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  Square, 
  CornerDownLeft, 
  Play, 
  Sparkles,
  ClipboardPaste,
  Wrench
} from 'lucide-react';

export default function ConsolePanel({
  terminalEntries = [],
  isRunning = false,
  onSendStdin,
  onStopProcess,
  onClearConsole,
  onRun,
  lastStats = null,
  activeLanguage = 'python',
  isMobile = false,
  awaitingPrompt = null,
  onInlinePromptSubmit = null,
  onOpenAiHealer = null,
  files = []
}) {
  const [copied, setCopied] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [inlineValue, setInlineValue] = useState('');
  const [showStdinDrawer, setShowStdinDrawer] = useState(false);
  const inputRef = useRef(null);
  const inlineInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom as new terminal entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalEntries, awaitingPrompt]);

  // Focus inline input as soon as awaitingPrompt is active
  useEffect(() => {
    if (awaitingPrompt && inlineInputRef.current) {
      setInlineValue('');
      setTimeout(() => {
        try {
          inlineInputRef.current?.focus();
        } catch (e) {}
      }, 50);
    }
  }, [awaitingPrompt]);

  // Focus input when process starts running or when requested
  useEffect(() => {
    if (isRunning && inputRef.current) {
      try {
        inputRef.current.focus();
      } catch (e) {}
    }
  }, [isRunning]);

  const handleCopyOutput = () => {
    const text = terminalEntries.map(e => e.text).join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePasteInput = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCurrentInput(prev => prev + text);
        if (inputRef.current) inputRef.current.focus();
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!isRunning) {
      // If not running, pass currentInput as custom standard input to onRun!
      if (onRun) onRun(currentInput);
      return;
    }

    // Send stdin to the running process
    if (onSendStdin) {
      onSendStdin(currentInput);
    }
    setCurrentInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Touching or clicking on terminal body immediately focuses the input!
  const handleBodyClick = (e) => {
    if (e.target && (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea'))) {
      return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Detect if the output failed due to missing stdin (EOFError in Python, NoSuchElementException in Java, etc.)
  const hasEofError = useMemo(() => {
    return terminalEntries.some(e => 
      (e.type === 'stderr' || e.type === 'stdout') && (
        e.text.includes('EOFError') || 
        e.text.includes('EOF when reading a line') ||
        e.text.includes('NoSuchElementException') ||
        e.text.includes('Standard input is empty')
      )
    );
  }, [terminalEntries]);

  // Detect if any execution exception / compile error occurred
  const hasAnyError = useMemo(() => {
    return (
      (lastStats && (lastStats.status === 'RUNTIME_ERROR' || lastStats.status === 'COMPILE_ERROR' || lastStats.code !== 0)) ||
      terminalEntries.some(e => e.type === 'stderr' && e.text && e.text.trim().length > 0)
    );
  }, [lastStats, terminalEntries]);

  const isSuccess = lastStats && lastStats.code === 0;
  const isError = lastStats && lastStats.code !== 0;

  return (
    <div className="console-panel-container">
      {/* Terminal Header */}
      <div className="console-header">
        <div className="terminal-header-title">
          <TerminalIcon size={15} />
          <span>Real IDLE Interactive Terminal</span>
          {isRunning ? (
            <span className="live-pulse-badge">
              <span className="pulse-dot"></span>
              LIVE ACTIVE
            </span>
          ) : lastStats ? (
            <span className={`tab-badge ${isSuccess ? 'success' : 'error'}`} />
          ) : null}
        </div>

        <div className="console-actions">
          {/* Autonomous AI Auto-Fixer Button */}
          {hasAnyError && onOpenAiHealer && (
            <button
              className="console-action-btn ai-heal-btn"
              onClick={onOpenAiHealer}
              title="Auto-Fix error with Autonomous AI Agent"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                color: '#c084fc',
                fontWeight: '600'
              }}
            >
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
              <span>Fix with AI</span>
            </button>
          )}

          {isRunning && (
            <button
              className="console-action-btn stop-btn"
              onClick={onStopProcess}
              title="Stop running program (Ctrl + C)"
              id="stop-process-btn"
            >
              <Square size={13} fill="currentColor" />
              <span>Stop (Ctrl+C)</span>
            </button>
          )}

          {terminalEntries.length > 0 && (
            <button
              className="console-action-btn"
              onClick={handleCopyOutput}
              title="Copy Output"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            className={`console-action-btn ${showStdinDrawer ? 'active' : ''}`}
            onClick={() => setShowStdinDrawer(prev => !prev)}
            title="Custom Multi-line Stdin Input"
            id="toggle-stdin-drawer-btn"
          >
            <span>Stdin</span>
          </button>

          <button
            className="console-action-btn"
            onClick={onClearConsole}
            title="Clear Terminal Output"
            id="clear-console-btn"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Optional Multi-line Stdin Box */}
      {showStdinDrawer && (
        <div className="terminal-multiline-stdin-box">
          <div className="multiline-header">
            <span>Standard Input (stdin for cin / scanf / input())</span>
            <button className="multiline-close-btn" onClick={() => setShowStdinDrawer(false)}>✕</button>
          </div>
          <textarea
            className="multiline-stdin-textarea"
            rows={3}
            placeholder="Enter standard input lines here (e.g. 10 20)..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
          />
        </div>
      )}

      {/* Terminal Stream Body */}
      <div 
        className="console-body idle-terminal-body" 
        ref={scrollRef}
        onClick={handleBodyClick}
        onTouchEnd={handleBodyClick}
      >
        {terminalEntries.length === 0 && !isRunning && (
          <div className="console-empty">
            <TerminalIcon size={36} className="empty-icon" />
            <p className="empty-title">Ready for Interactive Execution</p>
            <p className="empty-desc">
              Write your code in the editor and click <kbd>Run Code</kbd> or press <kbd>Ctrl + Enter</kbd>.
              <br />
              Supports live interactive inputs (<kbd>input()</kbd>, <kbd>cin</kbd>, <kbd>scanf</kbd>) with Autonomous AI Error Healing!
            </p>
          </div>
        )}

        <div className="terminal-stream">
          {terminalEntries.map((entry, idx) => {
            if (entry.type === 'stdout') {
              return <span key={idx} className="stdout-text">{entry.text}</span>;
            }
            if (entry.type === 'stderr') {
              return <span key={idx} className="stderr-text">{entry.text}</span>;
            }
            if (entry.type === 'system') {
              return <span key={idx} className="system-text">{entry.text}</span>;
            }
            if (entry.type === 'stdin') {
              return <span key={idx} className="stdin-echo-text">{entry.text}</span>;
            }
            return <span key={idx}>{entry.text}</span>;
          })}

          {/* Inline AI Healer Banner if an error occurred */}
          {hasAnyError && onOpenAiHealer && (
            <div className="terminal-ai-repair-banner" style={{
              margin: '12px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.8rem', color: '#e0e7ff', fontWeight: 500 }}>
                  Autonomous AI Agent diagnosed an execution exception.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAiHealer}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Wrench size={12} />
                <span>Auto-Fix with AI</span>
              </button>
            </div>
          )}

          {/* If running and awaiting input, show inline cursor */}
          {isRunning && !awaitingPrompt && (
            <span className="terminal-live-cursor">▎</span>
          )}

          {/* Inline Interactive Input Line - Prompts the user right here on the prompt line */}
          {awaitingPrompt && (
            <div className="terminal-inline-input-line">
              <span className="terminal-inline-prompt-label">
                {awaitingPrompt.prompts[awaitingPrompt.currentIndex] ? awaitingPrompt.prompts[awaitingPrompt.currentIndex].trimStart() : '> '}
              </span>
              <input
                ref={inlineInputRef}
                type="text"
                className="terminal-inline-input-field"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (onInlinePromptSubmit) {
                      onInlinePromptSubmit(inlineValue);
                      setInlineValue('');
                    }
                  }
                }}
                autoFocus
                placeholder="Type here and press Enter ↵..."
                spellCheck="false"
                autoComplete="off"
              />
              <button
                type="button"
                className="terminal-inline-submit-btn"
                onClick={() => {
                  if (onInlinePromptSubmit) {
                    onInlinePromptSubmit(inlineValue);
                    setInlineValue('');
                  }
                }}
                title="Submit input (Enter)"
              >
                <CornerDownLeft size={13} />
                <span>Enter</span>
              </button>
            </div>
          )}

          {/* Instant Inline Recovery if unexpected EOF occurred */}
          {hasEofError && !isRunning && !awaitingPrompt && (
            <div className="terminal-inline-input-line eof-inline-line">
              <span className="terminal-inline-prompt-label">
                [Input Required]: 
              </span>
              <input
                ref={inlineInputRef}
                type="text"
                className="terminal-inline-input-field"
                value={inlineValue}
                onChange={(e) => setInlineValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (onRun) {
                      onRun(inlineValue);
                      setInlineValue('');
                    }
                  }
                }}
                autoFocus
                placeholder="Type input and press Enter to run..."
                spellCheck="false"
                autoComplete="off"
              />
              <button
                type="button"
                className="terminal-inline-submit-btn"
                onClick={() => {
                  if (onRun) {
                    onRun(inlineValue);
                    setInlineValue('');
                  }
                }}
                title="Run with input"
              >
                <Play size={12} fill="currentColor" />
                <span>Run</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Interactive IDLE Input Bar (Only visible during live process execution) */}
      {isRunning && (
        <div 
          className="terminal-input-bar active-input-bar"
          onClick={() => inputRef.current?.focus()}
          onTouchEnd={() => inputRef.current?.focus()}
        >
          <div className="input-prompt-label">
            <span className="prompt-symbol">❯</span>
            <span className="prompt-text">stdin:</span>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            className="terminal-inline-input"
            placeholder={isMobile ? "Type stdin & press Send..." : "Type input for running process and press Enter ↵..."}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            id="terminal-input"
            spellCheck="false"
            autoComplete="off"
          />

          <button 
            className="send-stdin-btn active"
            onClick={handleSend}
            title="Send input to running program (Enter)"
            id="send-stdin-btn"
          >
            <CornerDownLeft size={13} />
            <span>Send</span>
          </button>
        </div>
      )}

      {/* Terminal Footer with Status & Execution Time */}
      <div className="console-footer">
        <div className="footer-left">
          {isRunning ? (
            <div className="status-indicator warning">
              <div className="spinner-mini" />
              <span>Executing interactively...</span>
            </div>
          ) : lastStats ? (
            <>
              <div className={`status-indicator ${isSuccess ? 'success' : isError ? 'error' : 'neutral'}`}>
                {isSuccess ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                <span>
                  {lastStats.status === 'SUCCESS' ? 'Exit Code 0 (Success)' : 
                   lastStats.status === 'COMPILE_ERROR' ? 'Compilation Error' : 
                   lastStats.status === 'TERMINATED' ? 'Process Stopped' :
                   lastStats.status === 'TIMEOUT' ? 'Process Timeout' : 
                   `Exit Code ${lastStats.code}`}
                </span>
              </div>

              {lastStats.executionTime !== undefined && (
                <div className="footer-metric">
                  <Clock size={13} />
                  <span>{lastStats.executionTime} ms</span>
                </div>
              )}

              {lastStats.runner && (
                <div className="footer-metric">
                  <Cpu size={13} />
                  <span>{lastStats.runner}</span>
                </div>
              )}
            </>
          ) : (
            <span className="footer-idle">Interactive IDLE Terminal Ready</span>
          )}
        </div>

        <div className="footer-right">
          <span className="badge-native">Interactive WS Engine</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
