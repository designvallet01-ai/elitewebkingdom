import React from 'react';
import {
  FolderTree,
  Search,
  FolderGit2,
  Boxes,
  Database,
  Bug,
  Settings,
  User,
  Sparkles,
  Terminal,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function ActivityBar({
  isSidebarOpen = true,
  onToggleSidebar,
  activeSidebarTab = 'explorer', // 'explorer' | 'search' | 'git' | 'extensions' | 'database' | 'debugger'
  onSelectSidebarTab,
  onOpenSearch,
  onOpenGit,
  onOpenExtensions,
  onOpenDatabase,
  onOpenDebugger,
  onOpenSettings,
  onOpenProfile,
  userProfile,
  hasError = false
}) {
  const handleItemClick = (tabKey, customAction) => {
    if (activeSidebarTab === tabKey && isSidebarOpen) {
      // Toggle sidebar closed if clicking same active tab
      onToggleSidebar();
    } else {
      if (!isSidebarOpen) onToggleSidebar();
      if (onSelectSidebarTab) onSelectSidebarTab(tabKey);
      if (customAction) customAction();
    }
  };

  return (
    <aside className="elite-activity-bar" aria-label="Activity Bar">
      {/* Top Main Navigation Icons */}
      <div className="activity-bar-group top-group">
        {/* 1. Explorer */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'explorer' ? 'active' : ''}`}
          onClick={() => handleItemClick('explorer')}
          title="Explorer (Ctrl + Shift + E / Ctrl + B)"
          aria-label="Explorer"
          id="activity-btn-explorer"
        >
          <FolderTree size={20} />
          {isSidebarOpen && activeSidebarTab === 'explorer' && <span className="active-pill" />}
        </button>

        {/* 2. Search */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'search' ? 'active' : ''}`}
          onClick={() => handleItemClick('search', onOpenSearch)}
          title="Search in Files (Ctrl + Shift + F / Ctrl + K)"
          aria-label="Search"
          id="activity-btn-search"
        >
          <Search size={20} />
          {isSidebarOpen && activeSidebarTab === 'search' && <span className="active-pill" />}
        </button>

        {/* 3. Source Control (Git) */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'git' ? 'active' : ''}`}
          onClick={() => handleItemClick('git', onOpenGit)}
          title="Source Control & GitHub (Ctrl + Shift + G)"
          aria-label="Source Control"
          id="activity-btn-git"
        >
          <FolderGit2 size={20} />
          {isSidebarOpen && activeSidebarTab === 'git' && <span className="active-pill" />}
        </button>

        {/* 4. Extensions (116+ Language Matrix & Packages) */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'extensions' ? 'active' : ''}`}
          onClick={() => handleItemClick('extensions', onOpenExtensions)}
          title="Language Extensions & 116+ Matrix (Ctrl + Shift + X)"
          aria-label="Extensions"
          id="activity-btn-extensions"
        >
          <Boxes size={20} />
          {isSidebarOpen && activeSidebarTab === 'extensions' && <span className="active-pill" />}
        </button>

        {/* 5. Database & Memory Matrix */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'database' ? 'active' : ''}`}
          onClick={() => handleItemClick('database', onOpenDatabase)}
          title="Database & Memory Matrix (SQL, JDBC, 3D Arrays)"
          aria-label="Database"
          id="activity-btn-database"
        >
          <Database size={20} />
          {isSidebarOpen && activeSidebarTab === 'database' && <span className="active-pill" />}
        </button>

        {/* 6. Debugger (AST Trace & One-Click Doctor) */}
        <button
          type="button"
          className={`activity-btn ${isSidebarOpen && activeSidebarTab === 'debugger' ? 'active' : ''} ${hasError ? 'has-error' : ''}`}
          onClick={() => handleItemClick('debugger', onOpenDebugger)}
          title="Run & Debug (Ctrl + Shift + D)"
          aria-label="Debugger"
          id="activity-btn-debugger"
        >
          <Bug size={20} />
          {hasError && <span className="error-dot" />}
          {isSidebarOpen && activeSidebarTab === 'debugger' && <span className="active-pill" />}
        </button>
      </div>

      {/* Bottom Settings & User Profile Icons */}
      <div className="activity-bar-group bottom-group">
        {/* Settings */}
        <button
          type="button"
          className="activity-btn"
          onClick={onOpenSettings}
          title="Settings & Keyboard Shortcuts (Ctrl + ,)"
          aria-label="Settings"
          id="activity-btn-settings"
        >
          <Settings size={20} />
        </button>

        {/* Developer Account / User Profile */}
        <button
          type="button"
          className="activity-btn profile-btn"
          onClick={onOpenProfile}
          title={userProfile?.name ? `Signed in as ${userProfile.name}` : 'Developer Account'}
          aria-label="Developer Account"
          id="activity-btn-profile"
        >
          <div className="activity-avatar">
            <User size={18} />
            {userProfile?.mobile && userProfile.mobile !== 'N/A' && (
              <span className="verified-dot" title="Verified Profile" />
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}
