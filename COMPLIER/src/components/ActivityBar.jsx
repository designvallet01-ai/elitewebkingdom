import React from 'react';
import { 
  FolderTree, 
  FolderGit2, 
  Sparkles, 
  Search, 
  Keyboard, 
  Terminal
} from 'lucide-react';

export default function ActivityBar({
  isSidebarOpen,
  onToggleSidebar,
  onOpenGit,
  onOpenAiHealer,
  onOpenCommandPalette,
  onOpenShortcuts,
  onOpenTerminal,
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
          title="Explorer (Ctrl + B)"
          id="activity-btn-explorer"
          aria-label="Toggle File Explorer"
        >
          <FolderTree size={20} />
          {isSidebarOpen && <span className="active-indicator" />}
        </button>

        {/* Global Search / Command Palette */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenCommandPalette}
          title="Search & Command Palette (Ctrl + K)"
          id="activity-btn-search"
          aria-label="Command Palette"
        >
          <Search size={20} />
        </button>

        {/* Source Control / Git */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenGit}
          title="Source Control (Ctrl + Shift + G)"
          id="activity-btn-git"
          aria-label="Source Control"
        >
          <FolderGit2 size={20} />
        </button>

        {/* Terminal Console */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenTerminal}
          title="Terminal Console (Ctrl + `)"
          id="activity-btn-terminal"
          aria-label="Terminal Console"
        >
          <Terminal size={20} />
        </button>

        {/* AI Assistant / Code Doctor */}
        <button
          type="button"
          className={`activity-icon-btn ${hasError ? 'has-error' : ''}`}
          onClick={onOpenAiHealer}
          title="AI Assistant & Debugger"
          id="activity-btn-ai"
          aria-label="AI Diagnostics"
        >
          <Sparkles size={20} />
          {hasError && <span className="activity-badge-dot" />}
        </button>
      </div>

      <div className="activity-bar-bottom">
        {/* Engine Status Indicator */}
        <div 
          className="activity-engine-indicator" 
          title="Cloud Runtime Matrix: Active"
        >
          <span className="engine-pulse-core" />
        </div>

        {/* Keyboard Shortcuts & Settings */}
        <button
          type="button"
          className="activity-icon-btn"
          onClick={onOpenShortcuts}
          title="Settings & Keyboard Shortcuts (Ctrl + /)"
          id="activity-btn-shortcuts"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={18} />
        </button>
      </div>
    </aside>
  );
}
