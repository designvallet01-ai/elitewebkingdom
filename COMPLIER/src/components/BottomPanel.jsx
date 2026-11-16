import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Trash2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Bug,
  History,
  CornerDownLeft,
  Square,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { parseDiagnostics } from './ProblemsPanel';

function stripAnsiCodes(text) {
  if (!text) return '';
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

export default function BottomPanel({
  isOpen = true,
  onClose,
  terminalEntries = [],
  isRunning = false,
  onSendStdin,
  onStopProcess,
  onClearConsole,
  onRun,
  lastStats = null,
  activeLanguage = 'python',
  awaitingPrompt = null,
  onInlinePromptSubmit = null,
  onOpenAiHealer = null,
  onJumpToLine = null,
  files = [],
  activeFile = null,
  executionHistory = [],
  theme = 'vs-dark',
  panelHeight = 260,
  onHeightChange
}) {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'output' | 'problems' | 'debug' | 'history'
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const inlineInputRef = useRef(null);

  // Parse diagnostics for Problems tab
  const diagnostics = parseDiagnostics(terminalEntries, activeFile);
  const errorsCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningsCount = diagnostics.filter(d => d.severity === 'warning').length;

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollRef.current && (activeTab === 'terminal' || activeTab === 'output')) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalEntries, awaitingPrompt, activeTab]);

  // Focus inline prompt
  useEffect(() => {
    if (awaitingPrompt && inlineInputRef.current) {
      setTimeout(() => {
        try {
          inlineInputRef.current?.focus();
        } catch (e) {}
      }, 50);
    }
  }, [awaitingPrompt]);

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

  // Drag resizer
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startH = panelHeight;

    const handlePointerMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newH = Math.max(120, Math.min(window.innerHeight * 0.75, startH + deltaY));
      if (onHeightChange) onHeightChange(newH);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (!isOpen) return null;

  const currentHeightStyle = isMaximized
    ? { height: 'calc(100vh - 85px)', zIndex: 40 }
    : { height: `${panelHeight}px` };

  return (
    <div className={`elite-bottom-panel ${isResizing ? 'resizing' : ''}`} style={currentHeightStyle}>
      {/* Top Resize Handle */}
      {!isMaximized && (
        <div
          className="bottom-panel-resizer"
          onPointerDown={handlePointerDown}
          title="Drag to resize bottom panel"
          role="separator"
          aria-orientation="horizontal"
        >
          <div className="bottom-panel-resizer-line" />
        </div>
      )}

      {/* Panel Tab Header Bar */}
      <div className="bottom-panel-header">
        <div className="bottom-panel-tabs" role="tablist">
          {/* 1. Terminal Tab */}
          <button
            type="button"
            className={`bottom-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
            role="tab"
            aria-selected={activeTab === 'terminal'}
          >
            <TerminalIcon size={14} />
            <span>Terminal</span>
            {lastStats && (
              <span className={`status-dot ${lastStats.code === 0 ? 'success' : 'error'}`} />
            )}
          </button>

          {/* 2. Output Tab */}
          <button
            type="button"
            className={`bottom-tab-btn ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveTab('output')}
            role="tab"
            aria-selected={activeTab === 'output'}
          >
            <Layers size={14} />
            <span>Output</span>
          </button>

          {/* 3. Problems Tab */}
          <button
            type="button"
            className={`bottom-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
            role="tab"
            aria-selected={activeTab === 'problems'}
          >
            <AlertCircle size={14} className={errorsCount > 0 ? 'text-rose-400' : 'text-slate-400'} />
            <span>Problems</span>
            {(errorsCount > 0 || warningsCount > 0) && (
              <span className="badge-count error">{errorsCount + warningsCount}</span>
            )}
          </button>

          {/* 4. Debug Console Tab */}
          <button
            type="button"
            className={`bottom-tab-btn ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
            role="tab"
            aria-selected={activeTab === 'debug'}
          >
            <Bug size={14} />
            <span>Debug Console</span>
          </button>

          {/* 5. Execution History Tab */}
          <button
            type="button"
            className={`bottom-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            role="tab"
            aria-selected={activeTab === 'history'}
          >
            <History size={14} />
            <span>Execution History</span>
            {executionHistory.length > 0 && (
              <span className="badge-count neutral">{executionHistory.length}</span>
            )}
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="bottom-panel-actions">
          {lastStats && (
            <div className="stats-pill-compact" title={`Execution time: ${lastStats.executionTime || '0ms'}`}>
              <Clock size={12} className="text-blue-400" />
              <span>{lastStats.executionTime || '0ms'}</span>
            </div>
          )}

          <button
            type="button"
            className="bottom-action-icon-btn"
            onClick={handleCopyOutput}
            title="Copy Terminal Output"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            className="bottom-action-icon-btn"
            onClick={onClearConsole}
            title="Clear Console Output"
          >
            <Trash2 size={14} />
          </button>

          <button
            type="button"
            className="bottom-action-icon-btn"
            onClick={() => setIsMaximized(prev => !prev)}
            title={isMaximized ? 'Restore Panel Height' : 'Maximize Panel'}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            type="button"
            className="bottom-action-icon-btn close-btn"
            onClick={onClose}
            title="Close Panel (Ctrl + `)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Content Body */}
      <div className="bottom-panel-body" ref={scrollRef}>
        {/* 1. TERMINAL CONTENT */}
        {activeTab === 'terminal' && (
          <div className="terminal-view-container font-mono">
            {terminalEntries.length === 0 ? (
              <div className="terminal-welcome-text">
                <div className="text-slate-400 text-xs">ELITE IDE Interactive Terminal Matrix [Ready]</div>
                <div className="text-slate-500 text-xs mt-1">Press <strong>Run</strong> (Ctrl + Enter) to execute code. Interactive inputs (scanf, cin &gt;&gt;, input()) will prompt here.</div>
              </div>
            ) : (
              terminalEntries.map((entry, idx) => {
                const cleanText = stripAnsiCodes(entry.text);
                let lineClass = 'terminal-line-stdout';
                if (entry.type === 'stderr') lineClass = 'terminal-line-stderr';
                if (entry.type === 'system') lineClass = 'terminal-line-system';
                if (entry.type === 'stdin') lineClass = 'terminal-line-stdin';

                return (
                  <div key={idx} className={`terminal-log-row ${lineClass}`}>
                    {entry.type === 'stdin' && <span className="stdin-prefix">&gt;&nbsp;</span>}
                    <span className="terminal-log-content">{cleanText}</span>
                  </div>
                );
              })
            )}

            {/* Awaiting Prompt Input */}
            {awaitingPrompt && (
              <div className="inline-prompt-box">
                <span className="inline-prompt-label">{awaitingPrompt}:</span>
                <input
                  ref={inlineInputRef}
                  type="text"
                  className="inline-prompt-input"
                  placeholder="Type input and press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onInlinePromptSubmit?.(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. OUTPUT CONTENT */}
        {activeTab === 'output' && (
          <div className="output-view-container font-mono">
            <div className="output-stats-banner">
              <span className="font-semibold text-slate-300">Target Language: {activeLanguage.toUpperCase()}</span>
              {lastStats ? (
                <div className="flex gap-4 items-center">
                  <span className={lastStats.code === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    Status: {lastStats.code === 0 ? '✓ SUCCESS (0)' : `✕ ERROR (${lastStats.code || 1})`}
                  </span>
                  <span>Time: {lastStats.executionTime || '0ms'}</span>
                  <span>Memory: {lastStats.memory || 'Standard'}</span>
                </div>
              ) : (
                <span className="text-slate-500">No recent execution metrics.</span>
              )}
            </div>

            <pre className="output-raw-pre">
              {terminalEntries.map(e => stripAnsiCodes(e.text)).join('') || 'Output window is clean.'}
            </pre>
          </div>
        )}

        {/* 3. PROBLEMS CONTENT */}
        {activeTab === 'problems' && (
          <div className="problems-view-container">
            {diagnostics.length === 0 ? (
              <div className="problems-empty">
                <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                <div className="text-sm font-semibold text-slate-200">No problems have been detected in the workspace.</div>
                <div className="text-xs text-slate-400 mt-1">Syntax is verified cleanly by the compiler AST analyzer.</div>
              </div>
            ) : (
              <div className="problems-list">
                {diagnostics.map((diag) => (
                  <div
                    key={diag.id}
                    className="problem-row"
                    onClick={() => onJumpToLine?.(diag.line)}
                    title={`Click to jump to line ${diag.line}`}
                  >
                    <div className="problem-icon">
                      {diag.severity === 'error' ? (
                        <AlertCircle size={15} className="text-rose-400" />
                      ) : (
                        <AlertTriangle size={15} className="text-amber-400" />
                      )}
                    </div>
                    <div className="problem-message">
                      <span className="problem-text">{diag.message}</span>
                      <span className="problem-location font-mono">[{diag.file}:{diag.line}:{diag.col}]</span>
                    </div>
                    <div className="problem-source font-mono">{diag.source}</div>
                    <button
                      type="button"
                      className="problem-heal-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAiHealer?.();
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Heal</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. DEBUG CONSOLE CONTENT */}
        {activeTab === 'debug' && (
          <div className="debug-view-container font-mono">
            <div className="debug-header-note text-xs text-slate-400 mb-2">
              [ELITE Debug Console • State Inspector & Error Healer]
            </div>
            {lastStats && lastStats.status === 'RUNTIME_ERROR' ? (
              <div className="debug-error-card">
                <div className="text-rose-400 font-semibold mb-1">Runtime Exception Caught:</div>
                <div className="text-slate-300 text-xs mb-3">{lastStats.stderr || 'Memory violation / Unhandled Exception'}</div>
                <button
                  type="button"
                  className="ai-primary-action-btn"
                  onClick={onOpenAiHealer}
                >
                  <Sparkles size={14} />
                  <span>One-Click AI Error Doctor & AST Patch</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Debugger is ready. Set breakpoints or run code to inspect execution call stack and variables.
              </div>
            )}
          </div>
        )}

        {/* 5. EXECUTION HISTORY CONTENT */}
        {activeTab === 'history' && (
          <div className="history-view-container">
            {executionHistory.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 text-center">
                No code executions recorded yet in this workspace session. Click <strong>Run</strong> to execute.
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Language</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Memory</th>
                      <th>Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionHistory.map((run, idx) => (
                      <tr key={run.id || idx}>
                        <td className="font-mono text-xs text-slate-400">{run.timestamp || 'Just now'}</td>
                        <td>
                          <span className="lang-chip font-mono">{run.language?.toUpperCase() || 'PYTHON'}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${run.status === 'SUCCESS' ? 'success' : 'error'}`}>
                            {run.status === 'SUCCESS' ? '✓ SUCCESS' : '✕ ERROR'}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{run.executionTime || '12ms'}</td>
                        <td className="font-mono text-xs">{run.memory || 'Standard'}</td>
                        <td className="font-mono text-xs text-slate-400 truncate max-w-xs">{run.snippet || 'print(...) ...'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal Input Drawer (when activeTab is Terminal) */}
      {activeTab === 'terminal' && (
        <form onSubmit={handleSend} className="bottom-panel-input-form">
          <span className="stdin-chevron">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="bottom-panel-stdin-input font-mono"
            placeholder={isRunning ? 'Send stdin to running process (press Enter)...' : 'Type input or click Run (Ctrl + Enter)...'}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
          />
          {isRunning ? (
            <button
              type="button"
              className="bottom-panel-stop-btn"
              onClick={onStopProcess}
              title="Stop Running Process"
            >
              <Square size={13} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              className="bottom-panel-send-btn"
              title="Send Stdin (Enter)"
            >
              <CornerDownLeft size={13} />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
