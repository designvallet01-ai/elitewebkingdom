import React from 'react';
import { 
  GitBranch, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Terminal, 
  Sparkles,
  Wifi,
  User
} from 'lucide-react';

export default function StatusBar({
  cursorLine = 1,
  cursorCol = 1,
  language = 'python',
  langName = 'Python 3.12',
  lastStats = null,
  userProfile = null,
  onOpenProfileModal,
  onOpenGit,
  onOpenAiHealer,
  onOpenTerminal,
  onOpenLanguageModal,
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

        {/* Cloud Execution Runtime Health & Realtime Indicator */}
        <div 
          className="status-bar-item runtime-indicator"
          title="Distributed Serverless Sandbox & Real-Time Presence: Connected & Operational"
        >
          <Wifi size={12} className="text-emerald-400" />
          <span>Elite Cloud V8: Ready</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
            LIVE
          </span>
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

        {/* Programming Language (Click to open 116+ Matrix) */}
        <button 
          type="button"
          className="status-bar-item lang-mode cursor-pointer hover:bg-slate-700/60 transition-colors" 
          onClick={onOpenLanguageModal}
          title={`Active Language: ${langName} • Click to open Universal 116+ Languages Hub`}
        >
          <Zap size={11} className="text-amber-400" />
          <span>{langName}</span>
          <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">116+</span>
        </button>

        {/* Developer Profile (Name, Mobile, Email) */}
        <button 
          type="button"
          className="status-bar-item user-profile-status-btn"
          onClick={onOpenProfileModal}
          title={userProfile?.name ? `Developer: ${userProfile.name} • ${userProfile.mobile || ''} (Click to edit)` : 'Anonymous Dev (Click to create profile)'}
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: userProfile?.name ? '#10b981' : '#38bdf8'
          }}
        >
          <User size={12} />
          <span>{userProfile?.name ? userProfile.name.split(' ')[0] : 'Profile'}</span>
        </button>

        {/* Prettier / Formatter Status */}
        <div className="status-bar-item prettier-status" title="Formatting Engine: Online">
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span>Prettier</span>
        </div>
      </div>
    </footer>
  );
}
