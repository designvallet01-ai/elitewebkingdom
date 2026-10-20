import React from 'react';
import { 
  FolderTree, 
  FolderGit2, 
  Sparkles, 
  BookOpen, 
  Languages, 
  Search, 
  Keyboard, 
  Settings,
  Terminal,
  Cpu
} from 'lucide-react';

export default function ActivityBar({
  isSidebarOpen,
  onToggleSidebar,
  onOpenGit,
  onOpenAiHealer,
  onOpenAlgorithms,
  onOpenTranspiler,
  onOpenCommandPalette,
  onOpenShortcuts,
  activeView = 'explorer',
  hasError = false
}) {
  return (
    <aside className="ide-activity-bar" aria-label="Activity Bar">
      <div className="activity-bar-top">
        {/* Explorer / File Tree */}
        <button
          type="button"
          className={`activity-icon-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title="Explorer (Ctrl + Shift + E)"
          id="activity-btn-explorer"
          aria-label="Toggle File Explorer"
        >
          <FolderTree size={20} />
          {isSidebarOpen && <span className="active-indicator" />}
        </button>

        {/* Source Control / Git Matrix */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenGit}
          title="Source Control & Git Matrix (Ctrl + Shift + G)"
          id="activity-btn-git"
          aria-label="Source Control"
        >
          <FolderGit2 size={20} />
        </button>

        {/* AI Doctor & Big-O Auditor */}
        <button
          type="button"
          className={`activity-icon-btn ${hasError ? 'has-error' : ''}`}
          onClick={onOpenAiHealer}
          title="AI Diagnostics & Big-O Auditor"
          id="activity-btn-ai"
          aria-label="AI Diagnostics"
        >
          <Sparkles size={20} style={{ color: hasError ? '#f43f5e' : '#c084fc' }} />
          {hasError && <span className="activity-badge-dot" />}
        </button>

        {/* Algorithms & DSA Library */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenAlgorithms}
          title="DSA Arsenal & Algorithm Library"
          id="activity-btn-algorithms"
          aria-label="Algorithms and Templates"
        >
          <BookOpen size={20} style={{ color: '#fbbf24' }} />
        </button>

        {/* Polyglot Code Transpiler */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenTranspiler}
          title="Polyglot Code Transpiler"
          id="activity-btn-transpiler"
          aria-label="Polyglot Code Transpiler"
        >
          <Languages size={20} style={{ color: '#38bdf8' }} />
        </button>

        {/* Global Search / Command Palette */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenCommandPalette}
          title="Command Palette & Search (Ctrl + K)"
          id="activity-btn-search"
          aria-label="Command Palette"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="activity-bar-bottom">
        {/* Cloud V8 Node Engine Status */}
        <div 
          className="activity-engine-indicator" 
          title="Distributed Execution Runtime Engine: Active"
        >
          <span className="engine-pulse-core" />
        </div>

        {/* Keyboard Shortcuts */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts Guide (Ctrl + /)"
          id="activity-btn-shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={18} />
        </button>
      </div>
    </aside>
  );
}
