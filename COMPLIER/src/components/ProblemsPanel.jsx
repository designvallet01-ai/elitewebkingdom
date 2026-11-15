import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  FileCode, 
  Layers,
  Terminal as TerminalIcon,
  RotateCcw
} from 'lucide-react';

// Extract structured diagnostics from execution output
export function parseDiagnostics(terminalEntries = [], activeFile = null) {
  const problems = [];
  let idCounter = 0;

  terminalEntries.forEach((entry) => {
    if (entry.type !== 'stderr' && entry.type !== 'system') return;
    const text = entry.text || '';
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      if (!lineStr.trim()) continue;

      // 1. Python Traceback: File "...", line 14, in <module>
      const pyMatch = /File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+([^\n\r]+))?/i.exec(lineStr);
      if (pyMatch) {
        let msg = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          const l = lines[j].trim();
          if (l.includes('Error:') || l.includes('Exception:') || l.startsWith('SyntaxError') || l.startsWith('NameError') || l.startsWith('TypeError') || l.startsWith('IndentationError')) {
            msg = l;
            break;
          }
        }
        problems.push({
          id: `diag-${++idCounter}`,
          file: pyMatch[1] ? pyMatch[1].split(/[/\\]/).pop() : (activeFile?.name || 'main.py'),
          line: parseInt(pyMatch[2], 10),
          col: 1,
          severity: 'error',
          message: msg || lineStr.trim(),
          source: 'Python'
        });
        continue;
      }

      // 2. C/C++ GCC/Clang: main.cpp:14:5: error: ...
      const cppMatch = /([a-zA-Z0-9_\-\./\\]+\.(?:cpp|c|cc|cxx|h|hpp)):(\d+):(?:(\d+):)?\s*(error|warning|fatal error):\s*([^\n\r]+)/i.exec(lineStr);
      if (cppMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: cppMatch[1].split(/[/\\]/).pop(),
          line: parseInt(cppMatch[2], 10),
          col: parseInt(cppMatch[3], 10) || 1,
          severity: cppMatch[4].toLowerCase().includes('error') ? 'error' : 'warning',
          message: cppMatch[5].trim(),
          source: 'GCC / Clang'
        });
        continue;
      }

      // 3. Java: Main.java:14: error: ...
      const javaMatch = /([a-zA-Z0-9_\-\./\\]+\.java):(\d+):\s*(error|warning):\s*([^\n\r]+)/i.exec(lineStr);
      if (javaMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: javaMatch[1].split(/[/\\]/).pop(),
          line: parseInt(javaMatch[2], 10),
          col: 1,
          severity: javaMatch[3].toLowerCase() === 'error' ? 'error' : 'warning',
          message: javaMatch[4].trim(),
          source: 'Java'
        });
        continue;
      }

      // Java Stack Trace: at Main.main(Main.java:14)
      const javaStackMatch = /at\s+([a-zA-Z0-9_$.]+)\(([a-zA-Z0-9_\-]+\.java):(\d+)\)/i.exec(lineStr);
      if (javaStackMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: javaStackMatch[2],
          line: parseInt(javaStackMatch[3], 10),
          col: 1,
          severity: 'error',
          message: `Runtime Exception in ${javaStackMatch[1]}`,
          source: 'JVM'
        });
        continue;
      }

      // 4. JavaScript / TypeScript / Node: at Object.<anonymous> (.../main.js:14:5)
      const jsMatch = /(?:at\s+[^\n\r(]*\()?([a-zA-Z0-9_\-\./\\]+\.(?:js|jsx|ts|tsx|mjs|cjs)):(\d+)(?::(\d+))?\)?/i.exec(lineStr);
      if (jsMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: jsMatch[1].split(/[/\\]/).pop(),
          line: parseInt(jsMatch[2], 10),
          col: parseInt(jsMatch[3], 10) || 1,
          severity: 'error',
          message: lineStr.trim(),
          source: 'Node.js'
        });
        continue;
      }

      // 5. Rust: --> src/main.rs:14:5
      const rustMatch = /-->\s+([a-zA-Z0-9_\-\./\\]+\.rs):(\d+):(\d+)/i.exec(lineStr);
      if (rustMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: rustMatch[1].split(/[/\\]/).pop(),
          line: parseInt(rustMatch[2], 10),
          col: parseInt(rustMatch[3], 10),
          severity: 'error',
          message: lines[Math.max(0, i - 1)]?.trim() || 'Rust compiler diagnostic',
          source: 'rustc'
        });
        continue;
      }

      // 6. Go: ./main.go:14:5: undefined: ...
      const goMatch = /(\.?\/?[a-zA-Z0-9_\-\./\\]+\.go):(\d+):(\d+):\s*([^\n\r]+)/i.exec(lineStr);
      if (goMatch) {
        problems.push({
          id: `diag-${++idCounter}`,
          file: goMatch[1].split(/[/\\]/).pop(),
          line: parseInt(goMatch[2], 10),
          col: parseInt(goMatch[3], 10),
          severity: 'error',
          message: goMatch[4].trim(),
          source: 'Go'
        });
        continue;
      }
    }
  });

  return problems;
}

export default function ProblemsPanel({
  terminalEntries = [],
  lastStats = null,
  files = [],
  onJumpToLine = null,
  onOpenAiHealer = null,
  onSwitchToTerminal = null
}) {
  const [problemFilter, setProblemFilter] = useState('all'); // 'all' | 'errors' | 'warnings'

  const diagnostics = useMemo(() => {
    return parseDiagnostics(terminalEntries, files?.find(f => f.name));
  }, [terminalEntries, files]);

  const effectiveDiagnostics = useMemo(() => {
    if (diagnostics.length > 0) return diagnostics;
    if (lastStats && lastStats.code !== 0) {
      const errLine = (lastStats.stderr || '').split('\n').filter(Boolean)[0] || `Process exited with code ${lastStats.code} (${lastStats.status || 'ERROR'})`;
      return [{
        id: 'diag-fallback-exit',
        file: files[0]?.name || 'main',
        line: 1,
        col: 1,
        severity: 'error',
        message: errLine,
        source: lastStats.runner || 'Execution Engine'
      }];
    }
    const stderrEntries = terminalEntries.filter(e => e.type === 'stderr' && e.text && e.text.trim());
    if (stderrEntries.length > 0) {
      const firstLine = stderrEntries[0].text.split('\n').filter(Boolean)[0] || 'Execution error encountered';
      return [{
        id: 'diag-fallback-stderr',
        file: files[0]?.name || 'main',
        line: 1,
        col: 1,
        severity: 'error',
        message: firstLine,
        source: 'Compiler Output'
      }];
    }
    return [];
  }, [diagnostics, lastStats, terminalEntries, files]);

  const errorsCount = useMemo(() => {
    return effectiveDiagnostics.filter(d => d.severity === 'error').length;
  }, [effectiveDiagnostics]);

  const warningsCount = useMemo(() => {
    return effectiveDiagnostics.filter(d => d.severity === 'warning').length;
  }, [effectiveDiagnostics]);

  const filteredDiagnostics = useMemo(() => {
    if (problemFilter === 'errors') return effectiveDiagnostics.filter(d => d.severity === 'error');
    if (problemFilter === 'warnings') return effectiveDiagnostics.filter(d => d.severity === 'warning');
    return effectiveDiagnostics;
  }, [effectiveDiagnostics, problemFilter]);

  return (
    <div className="problems-panel-body" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Problems Header & Filter Bar */}
      <div className="problems-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="problems-title-text">
            <Layers size={14} className="text-cyan-400" />
            <span>Problems</span>
          </span>
          {effectiveDiagnostics.length > 0 && (
            <span className="problems-count-pill danger">{effectiveDiagnostics.length}</span>
          )}
        </div>

        <div className="problems-filter-chips">
          <button
            type="button"
            className={`problem-filter-chip ${problemFilter === 'all' ? 'active' : ''}`}
            onClick={() => setProblemFilter('all')}
          >
            All ({effectiveDiagnostics.length})
          </button>
          <button
            type="button"
            className={`problem-filter-chip ${problemFilter === 'errors' ? 'active' : ''}`}
            onClick={() => setProblemFilter('errors')}
          >
            <span className="filter-dot red" /> Errors ({errorsCount})
          </button>
          <button
            type="button"
            className={`problem-filter-chip ${problemFilter === 'warnings' ? 'active' : ''}`}
            onClick={() => setProblemFilter('warnings')}
          >
            <span className="filter-dot yellow" /> Warnings ({warningsCount})
          </button>
          {onSwitchToTerminal && (
            <button
              type="button"
              className="problem-filter-chip"
              onClick={onSwitchToTerminal}
              title="Switch back to Terminal view"
              style={{ marginLeft: '4px', color: '#38bdf8' }}
            >
              <TerminalIcon size={12} />
              <span>Terminal</span>
            </button>
          )}
        </div>
      </div>

      {/* Problems List or Clean State */}
      {filteredDiagnostics.length === 0 ? (
        <div className="problems-empty-view">
          <div className="problems-clean-emblem">
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>
          <p className="problems-empty-title">No Problems Detected</p>
          <p className="problems-empty-desc">
            Your workspace is completely clean. All syntax checks and compiler validations passed.
          </p>
          {onSwitchToTerminal && (
            <button
              type="button"
              onClick={onSwitchToTerminal}
              className="ai-banner-fix-btn"
              style={{ marginTop: '16px' }}
            >
              <TerminalIcon size={12} />
              <span>Back to Terminal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="problems-list-container">
          {filteredDiagnostics.map((diag) => (
            <div key={diag.id} className={`problem-item-card ${diag.severity}`}>
              <div className="problem-item-header">
                <div className="problem-item-badge">
                  {diag.severity === 'error' ? (
                    <AlertCircle size={14} className="text-rose-400" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-400" />
                  )}
                  <span className={`problem-severity-tag ${diag.severity}`}>
                    {diag.severity.toUpperCase()}
                  </span>
                  <span className="problem-source-tag">[{diag.source}]</span>
                </div>

                <div className="problem-actions">
                  {diag.line && onJumpToLine && (
                    <button
                      type="button"
                      className="problem-jump-btn"
                      onClick={() => onJumpToLine(diag.line, diag.col)}
                      title={`Jump to line ${diag.line} in editor`}
                    >
                      <Zap size={12} className="text-amber-400" />
                      <span>Jump to L{diag.line}</span>
                    </button>
                  )}
                  {onOpenAiHealer && (
                    <button
                      type="button"
                      className="problem-ai-btn"
                      onClick={onOpenAiHealer}
                      title="Fix this issue automatically with AI"
                    >
                      <Sparkles size={12} className="text-violet-300" />
                      <span>Fix with AI</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="problem-item-desc">{diag.message}</div>

              <div className="problem-item-footer">
                <span className="problem-file-link">
                  <FileCode size={12} />
                  <span>{diag.file}</span>
                  <span className="problem-loc-pill">Line {diag.line}, Column {diag.col}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
