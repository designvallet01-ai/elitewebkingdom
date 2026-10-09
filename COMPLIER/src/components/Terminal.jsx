import React from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  Flame,
  Award
} from 'lucide-react';

export default function Terminal({
  output,
  isRunning,
  onClear,
  streak,
  theme
}) {
  const hasResult = output && (output.stdout || output.stderr || output.status);
  const isSuccess = output?.status === 'SUCCESS' || (output && output.code === 0 && !output.stderr);
  const isTimeout = output?.status === 'TIMEOUT';
  const isError = hasResult && !isSuccess;

  return (
    <div className="terminal-container">
      {/* Terminal Top Bar */}
      <div className="terminal-header">
        <div className="terminal-left">
          <TerminalIcon size={16} className="text-emerald-400" />
          <span className="terminal-title">Arena Match Console</span>
          {isRunning && (
            <span className="executing-pulse">
              <Zap size={13} className="spin-fast" />
              <span>DELIVERING CODE IN SQUARED CIRCLE...</span>
            </span>
          )}
        </div>

        <div className="terminal-meta">
          {output?.runner && (
            <span className="runner-badge" title="Execution Engine">
              <Cpu size={12} />
              <span>{output.runner}</span>
            </span>
          )}

          {output?.executionTime !== undefined && (
            <span className="time-badge">
              <Clock size={12} />
              <span>{output.executionTime} ms</span>
            </span>
          )}

          <button 
            className="terminal-clear-btn"
            onClick={onClear}
            title="Clear Console"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body">
        {/* Match Verdict Banner if completed */}
        {hasResult && !isRunning && (
          <div className={`verdict-banner ${isSuccess ? 'verdict-win' : isTimeout ? 'verdict-timeout' : 'verdict-lose'}`}>
            <div className="verdict-icon">
              {isSuccess ? <Award size={22} /> : isTimeout ? <Clock size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div className="verdict-text">
              <div className="verdict-title">
                {isSuccess 
                  ? "🏆 PINFALL 1-2-3! MATCH WON (EXIT CODE 0)" 
                  : isTimeout 
                  ? "⏱️ REFEREE COUNT: TIME LIMIT EXCEEDED" 
                  : `❌ REFEREE STOPPAGE (EXIT CODE ${output.code ?? 1})`}
              </div>
              <div className="verdict-sub">
                {isSuccess 
                  ? `Clean compilation & execution in ${output.executionTime || 0}ms • Win Streak: ${streak}` 
                  : isTimeout
                  ? "Execution halted to prevent infinite loop."
                  : "Syntax or runtime exception detected in the arena."}
              </div>
            </div>
          </div>
        )}

        {/* Stdout and Stderr Output Stream */}
        {isRunning ? (
          <div className="terminal-loading">
            <div className="loading-spinner"></div>
            <p>Running code through the arena compiler...</p>
          </div>
        ) : !hasResult ? (
          <div className="terminal-placeholder">
            <Flame size={32} className="text-amber-500 opacity-60" />
            <p>Arena console ready. Hit <strong>"DELIVER FINISHER (RUN)"</strong> to compile & execute code!</p>
            <span className="terminal-tip">Tip: Switch languages or click flowchart nodes to navigate code visually.</span>
          </div>
        ) : (
          <div className="terminal-output-content">
            {output.stdout && (
              <pre className="stdout-stream">{output.stdout}</pre>
            )}

            {output.stderr && (
              <div className="stderr-box">
                <div className="stderr-tag">REFEREE REVIEW / ERROR LOG:</div>
                <pre className="stderr-stream">{output.stderr}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
