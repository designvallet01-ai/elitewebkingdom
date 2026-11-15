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
  Zap,
  Layers,
  Wrench
} from 'lucide-react';

// Clean ANSI color codes from terminal output
function stripAnsiCodes(text) {
  if (!text) return '';
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

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
  onJumpToLine = null,
  onSwitchToProblems = null,
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

  // Focus input when process starts running
  useEffect(() => {
    if (isRunning && inputRef.current) {
      try {
        inputRef.current.focus();
      } catch (e) {}
    }
  }, [isRunning]);

  const handleCopyOutput = () => {
    const text = terminalEntries.map(e => stripAnsiCodes(e.text)).join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!isRunning) {
      if (onRun) onRun(currentInput);
      return;
    }
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

  const handleBodyClick = (e) => {
    if (e.target && (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea'))) {
      return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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

  const hasAnyError = useMemo(() => {
    return (
      (lastStats && (lastStats.status === 'RUNTIME_ERROR' || lastStats.status === 'COMPILE_ERROR' || lastStats.code !== 0)) ||
      terminalEntries.some(e => e.type === 'stderr' && e.text && e.text.trim().length > 0)
    );
  }, [lastStats, terminalEntries]);

  const isSuccess = lastStats && lastStats.code === 0;
  const isError = lastStats && lastStats.code !== 0;

  // Render a single stderr line with an interactive jump-to-line pill
  const renderStderrLineWithJump = (rawText, keyPrefix) => {
    const clean = stripAnsiCodes(rawText);
    const lines = clean.split('\n');

    return lines.map((lineStr, lineIdx) => {
      if (!lineStr.trim()) return null;

      // Extract line and column numbers
      const match = /(?:File\s+["'][^"']+["'],\s+line\s+(\d+)|([a-zA-Z0-9_\-\./\\]+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?|line\s+(\d+))/i.exec(lineStr);
      let targetLine = null;
      let targetCol = 1;

      if (match) {
        targetLine = parseInt(match[1] || match[3] || match[5], 10);
        if (match[4]) targetCol = parseInt(match[4], 10);
      }

      return (
        <div key={`${keyPrefix}-${lineIdx}`} className="terminal-stderr-line-row">
          <span className="stderr-text">{lineStr}</span>
          {targetLine && onJumpToLine && (
            <button
              type="button"
              className="terminal-inline-jump-chip"
              onClick={(e) => {
                e.stopPropagation();
                onJumpToLine(targetLine, targetCol);
              }}
              title={`Jump to Line ${targetLine} in editor`}
            >
              <Zap size={11} className="text-amber-400" />
              <span>Ln {targetLine}</span>
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="console-panel-container">
      {/* Clean Single-Row Terminal Header with Zero Overlap */}
      <div className="console-header">
        <div className="terminal-header-title">
          <div className="terminal-window-dots" title="Elite Cloud Execution Sandbox">
            <span className="dot dot-close" />
            <span className="dot dot-minimize" />
            <span className="dot dot-maximize" />
          </div>

          <span className="terminal-shell-tag">bash</span>

          {/* Live Execution HUD Capsule */}
          <div className="terminal-hud-capsule">
            {isRunning ? (
              <span className="live-pulse-badge">
                <span className="pulse-dot"></span>
                RUNNING
              </span>
            ) : lastStats ? (
              <span className={`tab-badge ${isSuccess ? 'success' : 'error'}`}>
                {isSuccess ? 'READY • 0' : `EXIT • ${lastStats.code ?? 1}`}
              </span>
            ) : (
              <span className="tab-badge idle">STANDBY</span>
            )}

            {lastStats && lastStats.executionTime !== undefined && (
              <span className="hud-metric-pill" title="Execution Time">
                <Clock size={11} />
                <span>{lastStats.executionTime}ms</span>
              </span>
            )}
          </div>
        </div>

        {/* Console Action Buttons */}
        <div className="console-actions">
          {hasAnyError && onOpenAiHealer && (
            <button
              type="button"
              className="console-action-btn ai-heal-btn"
              onClick={onOpenAiHealer}
              title="Auto-Fix error with Autonomous AI Agent"
              id="terminal-fix-with-ai-btn"
            >
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
              <span>Fix with AI</span>
            </button>
          )}

          {isRunning && (
            <button
              type="button"
              className="console-action-btn stop-btn"
              onClick={onStopProcess}
              title="Stop running program (Ctrl + C)"
              id="stop-process-btn"
            >
              <Square size={12} fill="currentColor" />
              <span>Stop</span>
            </button>
          )}

          {terminalEntries.length > 0 && (
            <button
              type="button"
              className="console-action-btn"
              onClick={handleCopyOutput}
              title="Copy Output"
              id="copy-terminal-output-btn"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          <button
            type="button"
            className={`console-action-btn ${showStdinDrawer ? 'active' : ''}`}
            onClick={() => setShowStdinDrawer(prev => !prev)}
            title="Custom Multi-line Stdin Input"
            id="toggle-stdin-drawer-btn"
          >
            <span>Stdin</span>
          </button>

          <button
            type="button"
            className="console-action-btn"
            onClick={onClearConsole}
            title="Clear Terminal Output"
            id="clear-console-btn"
          >
            <Trash2 size={12} />
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
            <div className="console-empty-emblem">
              <TerminalIcon size={32} className="empty-icon" />
            </div>
            <p className="empty-title">Ready for Interactive Execution</p>
            <p className="empty-desc">
              Write code in the editor and click <kbd>Run Code</kbd> or press <kbd>Ctrl + Enter</kbd>.
              <br />
              Supports interactive inputs (<kbd>input()</kbd>, <kbd>cin</kbd>, <kbd>scanf</kbd>) with 1-click line error jump!
            </p>
            <div
              className="console-capabilities-strip"
              aria-label="Elite IDE Capabilities"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '14px',
                maxWidth: '480px'
              }}
            >
              {[
                '116+ Languages',
                'Clickable Error Line Jump',
                'Problems Diagnostics Panel',
                'Monaco Sticky Scroll',
                'JetBrains Mono',
                'X-Ray Dry Run',
                'ISO Flowchart'
              ].map((feat) => (
                <span
                  key={feat}
                  style={{
                    fontSize: '0.67rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#94a3b8',
                    background: 'rgba(15, 23, 42, 0.72)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '9999px',
                    padding: '3px 9px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="terminal-stream">
          {terminalEntries.map((entry, idx) => {
            if (entry.type === 'cmd') {
              return (
                <div key={idx} className="terminal-cmd-row">
                  <span className="terminal-prompt-user">developer@elite-ide</span>
                  <span className="terminal-prompt-colon">:</span>
                  <span className="terminal-prompt-path">~/workspace</span>
                  <span className="terminal-prompt-dollar">$ </span>
                  <span className="terminal-prompt-cmd">{entry.text}</span>
                </div>
              );
            }
            if (entry.type === 'process-exit') {
              return (
                <div key={idx} className={`terminal-process-exit ${entry.exitCode === 0 ? 'exit-success' : 'exit-fail'}`}>
                  <span className="exit-code-badge">exit code: {entry.exitCode}</span>
                  <span className="exit-time-badge">{entry.time}ms</span>
                  {entry.runner && <span className="exit-runner-badge">({entry.runner})</span>}
                </div>
              );
            }
            if (entry.type === 'stdout') {
              return <span key={idx} className="stdout-text">{stripAnsiCodes(entry.text)}</span>;
            }
            if (entry.type === 'stderr') {
              return renderStderrLineWithJump(entry.text, `stderr-${idx}`);
            }
            if (entry.type === 'system') {
              return <span key={idx} className="system-text">{stripAnsiCodes(entry.text)}</span>;
            }
            if (entry.type === 'stdin') {
              return <span key={idx} className="stdin-echo-text">{entry.text}</span>;
            }
            return <span key={idx}>{stripAnsiCodes(entry.text)}</span>;
          })}

          {/* Inline AI Healer & Problems Banner if an error occurred */}
          {hasAnyError && (
            <div className="terminal-ai-repair-banner">
              <div className="ai-banner-left">
                <AlertCircle size={16} className="text-rose-400" />
                <span className="ai-banner-text">
                  Execution exception diagnosed in workspace.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {onSwitchToProblems && (
                  <button
                    type="button"
                    onClick={onSwitchToProblems}
                    className="ai-banner-fix-btn"
                    style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                  >
                    <Layers size={12} />
                    <span>View Problems</span>
                  </button>
                )}
                {onOpenAiHealer && (
                  <button
                    type="button"
                    onClick={onOpenAiHealer}
                    className="ai-banner-fix-btn"
                  >
                    <Wrench size={12} />
                    <span>Auto-Fix with AI</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* If running and awaiting input, show inline cursor */}
          {isRunning && !awaitingPrompt && (
            <span className="terminal-live-cursor">▎</span>
          )}

          {/* Inline Interactive Input Line */}
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

      {/* Real-time Interactive IDLE Input Bar */}
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
            type="button"
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
