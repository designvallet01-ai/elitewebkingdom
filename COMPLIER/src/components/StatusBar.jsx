import React from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Terminal, 
  Sparkles,
  Wifi
} from 'lucide-react';

export default function StatusBar({
  cursorLine = 1,
  cursorCol = 1,
  language = 'python',
  langName = 'Python 3.12',
  lastStats = null,
  onOpenGit,
  onOpenAiHealer,
  onOpenTerminal,
  theme = 'vs-dark'
}) {
  const hasError = lastStats && (lastStats.code !== 0 || lastStats.status === 'RUNTIME_ERROR' || lastStats.status === 'COMPILE_ERROR');
  const errorCount = hasError ? 1 : 0;
  const warningCount = 0;

  return (
    <footer className="ide-status-bar" role="status" aria-label="Status Bar">
      <div className="status-bar-left">
        {/* Git Branch Indicator */}
        <button 
          type="button"
          className="status-bar-item branch-btn"
          onClick={onOpenGit}
          title="Git Branch: main (Click to open Git Matrix)"
        >
          <GitBranch size={12} />
          <span>main</span>
        </button>

        {/* Diagnostics Error / Warning count */}
        <button 
          type="button"
          className={`status-bar-item error-btn ${errorCount > 0 ? 'has-errors' : ''}`}
          onClick={onOpenAiHealer}
          title={errorCount > 0 ? "1 Error Detected - Click to Auto-Heal with AI" : "No errors detected"}
        >
          <AlertCircle size={12} />
          <span>{errorCount}</span>
          <span className="warning-dot">0</span>
        </button>

        {/* Cloud Execution Runtime Health */}
        <div 
          className="status-bar-item runtime-indicator"
          title="Distributed Serverless Sandbox: Operational (<10ms)"
        >
          <Wifi size={12} className="text-emerald-400" />
          <span>Elite Cloud V8: Ready</span>
        </div>
      </div>

      <div className="status-bar-right">
        {/* Cursor Position */}
        <div className="status-bar-item cursor-pos" title="Cursor Line and Column">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
        </div>

        {/* Indentation */}
        <div className="status-bar-item" title="Indentation: 4 Spaces">
          <span>Spaces: 4</span>
        </div>

        {/* File Encoding */}
        <div className="status-bar-item" title="Character Encoding: UTF-8">
          <span>UTF-8</span>
        </div>

        {/* Programming Language */}
        <div className="status-bar-item lang-mode" title={`Language Mode: ${langName}`}>
          <Zap size={11} className="text-amber-400" />
          <span>{langName}</span>
        </div>

        {/* Prettier / Formatter Status */}
        <div className="status-bar-item prettier-status" title="Formatting Engine: Online">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>Prettier</span>
        </div>
      </div>
    </footer>
  );
}
