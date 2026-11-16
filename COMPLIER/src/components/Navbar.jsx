import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Bug,
  Share2,
  Settings,
  User,
  Sun,
  Moon,
  PanelLeft,
  PanelBottom,
  Sparkles,
  ChevronDown,
  Check,
  Search,
  ExternalLink,
  Edit2,
  FileCode,
  Layout,
  Layers,
  Wand2
} from 'lucide-react';
import { ALL_LANGUAGES, LANGUAGE_CATEGORIES, getLanguageById } from '../services/languagesRegistry';

export default function Navbar({
  detectedLangInfo,
  onRun,
  isRunning = false,
  onStop,
  onFormatCode,
  theme = 'vs-dark',
  onToggleTheme,
  fontSize = 14,
  onChangeFontSize,
  userProfile,
  onOpenProfileModal,
  selectedLanguage = 'auto',
  onSelectLanguage,
  onOpenLanguageModal,
  onOpenShareCode,
  onOpenSettings,
  onOpenCommandPalette,
  onOpenAiExplainer,
  onOpenDebugger,
  isSidebarOpen = true,
  onToggleSidebar,
  isBottomPanelOpen = true,
  onToggleBottomPanel,
  isRightAiOpen = false,
  onToggleRightAi,
  projectName = 'elite-project',
  onProjectNameChange,
  isModified = false,
  isMobile = false
}) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);
  const langDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangDropdownOpen]);

  const handleProjectNameSubmit = (e) => {
    if (e) e.preventDefault();
    if (tempProjectName.trim() && onProjectNameChange) {
      onProjectNameChange(tempProjectName.trim());
    }
    setIsEditingName(false);
  };

  const filteredLanguages = ALL_LANGUAGES.filter(lang =>
    !langSearch ||
    lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    lang.id.toLowerCase().includes(langSearch.toLowerCase())
  ).slice(0, 18);

  const activeLangName = detectedLangInfo?.name || getLanguageById(selectedLanguage)?.name || selectedLanguage.toUpperCase();

  return (
    <header className="elite-top-navbar" aria-label="Top Navigation Bar">
      {/* LEFT SECTION: BRANDING & WORKSPACE */}
      <div className="navbar-section left-section">
        {/* Elite IDE Brand Logo */}
        <div className="navbar-brand">
          <div className="brand-logo-gem">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="6" fill="#2563EB" />
              <path d="M7 8L13 14L7 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="15" y1="20" x2="21" y2="20" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text-block">
            <div className="brand-name-row">
              <span className="brand-title">ELITE IDE</span>
              <span className="brand-badge-pro">PRO</span>
            </div>
            <span className="brand-tagline">Build. Code. Create.</span>
          </div>
        </div>

        {/* Divider */}
        <div className="navbar-divider" />

        {/* Project / Workspace Name */}
        <div className="navbar-project-box">
          {isEditingName ? (
            <form onSubmit={handleProjectNameSubmit}>
              <input
                type="text"
                className="navbar-project-input font-mono"
                value={tempProjectName}
                onChange={(e) => setTempProjectName(e.target.value)}
                onBlur={handleProjectNameSubmit}
                autoFocus
              />
            </form>
          ) : (
            <div
              className="navbar-project-name"
              onClick={() => setIsEditingName(true)}
              title="Click to rename project"
            >
              <span className="project-name-label font-mono">{projectName}</span>
              <Edit2 size={11} className="edit-icon" />
            </div>
          )}

          {/* Save Status */}
          <div className="navbar-save-status">
            {isModified ? (
              <span className="status-unsaved" title="Unsaved changes in workspace">
                <span className="dot" /> Unsaved
              </span>
            ) : (
              <span className="status-saved" title="All files saved to local cache">
                <Check size={11} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CENTER SECTION: LANGUAGE SELECTOR & RUN/DEBUG CONTROLS */}
      <div className="navbar-section center-section">
        {/* 116+ Languages Selector Dropdown */}
        <div className="navbar-lang-wrapper" ref={langDropdownRef}>
          <button
            type="button"
            className="navbar-lang-btn font-mono"
            onClick={() => setIsLangDropdownOpen(prev => !prev)}
            title="Switch Programming Language (116+ Languages Supported)"
            aria-expanded={isLangDropdownOpen}
          >
            <span className="lang-indicator-dot" />
            <span className="lang-text font-semibold">{activeLangName}</span>
            <span className="lang-count-badge">116+</span>
            <ChevronDown size={13} className="chevron" />
          </button>

          {isLangDropdownOpen && (
            <div className="navbar-lang-dropdown">
              <div className="lang-search-header">
                <Search size={13} className="text-slate-400" />
                <input
                  type="text"
                  className="lang-search-input font-mono"
                  placeholder="Search 116+ languages..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="lang-dropdown-list">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    className={`lang-option-btn ${selectedLanguage === lang.id ? 'active' : ''}`}
                    onClick={() => {
                      onSelectLanguage(lang.id);
                      setIsLangDropdownOpen(false);
                      setLangSearch('');
                    }}
                  >
                    <span className="lang-name font-mono">{lang.name}</span>
                    <span className="lang-ext font-mono text-xs text-slate-500">.{lang.extension || lang.id}</span>
                  </button>
                ))}
              </div>

              <div className="lang-dropdown-footer">
                <button
                  type="button"
                  className="open-full-matrix-btn"
                  onClick={() => {
                    setIsLangDropdownOpen(false);
                    onOpenLanguageModal?.();
                  }}
                >
                  <span>Explore Full 116+ Language Matrix →</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary RUN Button */}
        {isRunning ? (
          <button
            type="button"
            className="navbar-btn-stop"
            onClick={onStop}
            title="Stop Execution (Ctrl + C)"
            id="navbar-btn-stop"
          >
            <Square size={13} className="fill-current animate-pulse" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            className="navbar-btn-run"
            onClick={() => onRun()}
            title="Execute Code (Ctrl + Enter)"
            id="navbar-btn-run"
          >
            <Play size={14} className="fill-current" />
            <span>Run</span>
            <kbd className="run-shortcut">Ctrl+↵</kbd>
          </button>
        )}

        {/* Debug Button */}
        <button
          type="button"
          className="navbar-btn-debug"
          onClick={onOpenDebugger}
          title="Run with Debug Console & AST Inspector (F5)"
          id="navbar-btn-debug"
        >
          <Bug size={14} />
          <span>Debug</span>
        </button>
      </div>

      {/* RIGHT SECTION: SHARE, LAYOUT CONTROLS, THEME & USER PROFILE */}
      <div className="navbar-section right-section">
        {/* Share Button */}
        <button
          type="button"
          className="navbar-icon-action-btn"
          onClick={onOpenShareCode}
          title="Share Project / Live Pair Programming"
          id="navbar-btn-share"
        >
          <Share2 size={15} />
          <span className="hidden sm:inline text-xs font-medium">Share</span>
        </button>

        <div className="navbar-divider" />

        {/* Layout Panel Toggles */}
        <div className="navbar-layout-group">
          {/* Toggle Left Sidebar */}
          <button
            type="button"
            className={`layout-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={onToggleSidebar}
            title="Toggle Primary Sidebar (Ctrl + B)"
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={16} />
          </button>

          {/* Toggle Bottom Panel */}
          <button
            type="button"
            className={`layout-toggle-btn ${isBottomPanelOpen ? 'active' : ''}`}
            onClick={onToggleBottomPanel}
            title="Toggle Bottom Terminal Panel (Ctrl + `)"
            aria-label="Toggle Bottom Panel"
          >
            <PanelBottom size={16} />
          </button>

          {/* Toggle Right AI Assistant */}
          <button
            type="button"
            className={`layout-toggle-btn ${isRightAiOpen ? 'active' : ''}`}
            onClick={onToggleRightAi}
            title="Toggle ELITE AI Assistant (Ctrl + Shift + A)"
            aria-label="Toggle AI Assistant"
          >
            <Sparkles size={16} className={isRightAiOpen ? 'text-blue-400' : ''} />
          </button>
        </div>

        <div className="navbar-divider" />

        {/* Light / Dark Mode Theme Toggle */}
        <button
          type="button"
          className="navbar-theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'vs-dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'vs-dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="navbar-icon-action-btn settings-btn"
          onClick={onOpenSettings}
          title="Open Settings & Preferences (Ctrl + ,)"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>

        {/* User Profile Avatar */}
        <button
          type="button"
          className="navbar-profile-btn"
          onClick={onOpenProfileModal}
          title={userProfile?.name ? `${userProfile.name} • Verified Developer` : 'User Profile'}
          aria-label="User Profile"
        >
          <div className="profile-avatar-circle">
            <User size={14} />
          </div>
          {userProfile?.mobile && userProfile.mobile !== 'N/A' && (
            <span className="profile-verified-badge" title="Verified Mobile Account" />
          )}
        </button>
      </div>
    </header>
  );
}
