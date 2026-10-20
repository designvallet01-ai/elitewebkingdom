import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Download, 
  Upload, 
  Sun, 
  Moon, 
  Code2, 
  AlignLeft, 
  Zap, 
  Sparkles, 
  BookOpen, 
  FolderTree,
  FolderGit2,
  ArrowLeft,
  Globe,
  MoreVertical,
  X,
  Type,
  ExternalLink,
  GraduationCap,
  Lock,
  Smartphone,
  Laptop,
  Check,
  FileCheck2,
  ChevronDown,
  Languages,
  FlaskConical,
  Database,
  GitCommit,
  GitFork,
  Keyboard,
  Wand2,
  Terminal,
  Share2,
  Search,
  Menu,
  FileText
} from 'lucide-react';
import { ALL_LANGUAGES, LANGUAGE_CATEGORIES } from '../services/languagesRegistry';

export default function Navbar({
  detectedLangInfo,
  onRun,
  isRunning,
  onClearCode,
  onFormatCode,
  theme,
  onToggleTheme,
  fontSize,
  onChangeFontSize,
  code,
  activeFileName,
  onCreateFile,
  onOpenTemplates,
  isSidebarOpen,
  onToggleSidebar,
  selectedLanguage = 'auto',
  onSelectLanguage,
  isMobile = false,
  isCollegeMode = false,
  onOpenCollegeMode,
  onExitCollegeMode,
  onOpenAiExplainer,
  onOpenLabReport,
  onOpenTranspiler,
  onChangeRightPaneView,
  onOpenShareCode,
  onOpenCommandPalette,
  onOpenGitControl
}) {
  const fileInputRef = useRef(null);
  const menubarRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState(null); // 'file' | 'edit' | 'view' | 'run' | 'tools' | 'help' | null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');
    const stored = localStorage.getItem('elite_ide_pwa_installed') === 'true';
    return isStandalone || stored;
  });

  // Capture beforeinstallprompt and appinstalled events for PWA installation
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.matchMedia('(display-mode: fullscreen)').matches ||
                           window.matchMedia('(display-mode: minimal-ui)').matches ||
                           window.navigator.standalone === true ||
                           document.referrer.includes('android-app://');
      if (isStandalone) {
        setIsAppInstalled(true);
        localStorage.setItem('elite_ide_pwa_installed', 'true');
      }
    };

    checkStandalone();

    const mq = window.matchMedia('(display-mode: standalone)');
    const handleMQChange = (e) => {
      if (e.matches) {
        setIsAppInstalled(true);
        localStorage.setItem('elite_ide_pwa_installed', 'true');
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handleMQChange);
    }

    const handleBeforeInstall = (e) => {
      if (isAppInstalled) return;
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem('elite_ide_pwa_installed', 'true');
      setInstalledSuccess(true);
      setShowInstallModal(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleMQChange);
      }
    };
  }, [isAppInstalled]);

  // Handle Install App button click (triggers native prompt or opens install guide modal)
  const handleInstallApp = async () => {
    if (isAppInstalled) return;
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsAppInstalled(true);
          localStorage.setItem('elite_ide_pwa_installed', 'true');
          setInstalledSuccess(true);
          setShowInstallModal(false);
          setTimeout(() => setInstalledSuccess(false), 4000);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    // If native prompt already used or browser needs manual install, show instructions modal
    setShowInstallModal(true);
  };

  const mainMenuRef = useRef(null);

  // Close desktop menubar and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
      if (mainMenuRef.current && !mainMenuRef.current.contains(e.target)) {
        setIsMainMenuOpen(false);
      }
    };
    if (activeMenu || isMainMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu, isMainMenuOpen]);

  // Close menus on outside escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeMenu) setActiveMenu(null);
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isMainMenuOpen) setIsMainMenuOpen(false);
        if (showInstallModal) setShowInstallModal(false);
        if (showShortcutsModal) setShowShortcutsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu, isMobileMenuOpen, isMainMenuOpen, showInstallModal, showShortcutsModal]);

  // Download active code file
  const handleDownload = () => {
    const ext = detectedLangInfo?.extension || 'txt';
    const filename = activeFileName || `code.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setIsMobileMenuOpen(false);
  };

  // Upload file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        window.dispatchEvent(new CustomEvent('load_code', { 
          detail: { content, name: file.name } 
        }));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="ide-navbar">
        <div className="nav-left">
          {/* Mobile Files Drawer Button */}
          {isMobile && (
            <button
              className={`nav-icon-btn mobile-files-toggle ${isSidebarOpen ? 'active' : ''}`}
              onClick={onToggleSidebar}
              title={isSidebarOpen ? "Hide Files Drawer" : "Open Files Drawer"}
              id="mobile-files-drawer-btn"
              aria-label="Toggle Files Explorer Drawer"
            >
              <FolderTree size={16} />
            </button>
          )}

          <a href="/" className="brand" title="Return to Elite Web Kingdom Main Website" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/compiler/logo.png" alt="Elite IDE Logo" className="brand-logo-img" />
            <div className="brand-text">
              <span className="brand-title">Elite IDE</span>
              {!isMobile && <span className="brand-badge">PRO COMPILER</span>}
            </div>
          </a>

          {/* Desktop Professional IDE Menubar (VS Code & JetBrains Style) */}
          {!isMobile && (
            <nav className="ide-menubar" ref={menubarRef} aria-label="Desktop Native Application Menubar">
              {/* FILE */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'file' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'file' ? null : 'file')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('file'); }}
                >
                  File
                </button>
                {activeMenu === 'file' && (
                  <div className="menubar-flyout-menu">
                    <button className="flyout-item" onClick={() => { onCreateFile && onCreateFile(); setActiveMenu(null); }}>
                      <span className="flyout-left"><FileText size={14} className="text-sky" /><span>New File</span></span>
                      <kbd className="flyout-kbd">Ctrl+N</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Upload size={14} className="text-cyan" /><span>Open / Upload File...</span></span>
                      <kbd className="flyout-kbd">Ctrl+O</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { handleDownload(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Download size={14} className="text-emerald" /><span>Save / Download</span></span>
                      <kbd className="flyout-kbd">Ctrl+S</kbd>
                    </button>
                    <div className="flyout-divider" />
                    {onOpenShareCode && (
                      <button className="flyout-item" onClick={() => { onOpenShareCode(); setActiveMenu(null); }}>
                        <span className="flyout-left"><Share2 size={14} className="text-amber" /><span>Share Code Snippet</span></span>
                        <kbd className="flyout-kbd">LINK</kbd>
                      </button>
                    )}
                    <div className="flyout-divider" />
                    <a href="/" className="flyout-item" style={{ textDecoration: 'none' }}>
                      <span className="flyout-left"><ArrowLeft size={14} className="text-slate" /><span>Return to Main Website</span></span>
                      <kbd className="flyout-kbd">HOME</kbd>
                    </a>
                  </div>
                )}
              </div>

              {/* EDIT */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'edit' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'edit' ? null : 'edit')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('edit'); }}
                >
                  Edit
                </button>
                {activeMenu === 'edit' && (
                  <div className="menubar-flyout-menu">
                    <button className="flyout-item" onClick={() => { onFormatCode(); setActiveMenu(null); }}>
                      <span className="flyout-left"><AlignLeft size={14} className="text-cyan" /><span>Format Document</span></span>
                      <kbd className="flyout-kbd">Shift+Alt+F</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onClearCode(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Trash2 size={14} className="text-red" /><span>Clear Editor Buffer</span></span>
                      <kbd className="flyout-kbd">CLEAR</kbd>
                    </button>
                    <div className="flyout-divider" />
                    <div className="flyout-item font-picker-flyout" onClick={(e) => e.stopPropagation()}>
                      <span className="flyout-left"><Type size={14} className="text-slate" /><span>Editor Font Size</span></span>
                      <div className="font-chips-bar">
                        {[12, 14, 16, 18].map(sz => (
                          <button
                            key={sz}
                            type="button"
                            className={`font-chip ${fontSize === sz ? 'active' : ''}`}
                            onClick={() => onChangeFontSize(sz)}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VIEW */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'view' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'view' ? null : 'view')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('view'); }}
                >
                  View
                </button>
                {activeMenu === 'view' && (
                  <div className="menubar-flyout-menu">
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('console'); setActiveMenu(null); }}>
                      <span className="flyout-left"><Terminal size={14} className="text-emerald" /><span>Terminal Console</span></span>
                      <kbd className="flyout-kbd">Alt+1</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('graphical'); setActiveMenu(null); }}>
                      <span className="flyout-left"><GitFork size={14} className="text-sky" /><span>Flowchart Visualizer</span></span>
                      <kbd className="flyout-kbd">Alt+2</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('testcases'); setActiveMenu(null); }}>
                      <span className="flyout-left"><FlaskConical size={14} className="text-amber" /><span>CP Judge Workbench</span></span>
                      <kbd className="flyout-kbd">Alt+3</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('memory'); setActiveMenu(null); }}>
                      <span className="flyout-left"><Database size={14} className="text-cyan" /><span>Memory Matrix & Pointers</span></span>
                      <kbd className="flyout-kbd">Alt+4</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('recursion'); setActiveMenu(null); }}>
                      <span className="flyout-left"><GitCommit size={14} className="text-pink" /><span>Recursion Tree & Call Stack</span></span>
                      <kbd className="flyout-kbd">Alt+5</kbd>
                    </button>
                    <div className="flyout-divider" />
                    <button className="flyout-item" onClick={() => { onToggleSidebar(); setActiveMenu(null); }}>
                      <span className="flyout-left"><FolderTree size={14} className="text-slate" /><span>Toggle File Explorer</span></span>
                      <kbd className="flyout-kbd">Ctrl+B</kbd>
                    </button>
                  </div>
                )}
              </div>

              {/* RUN */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'run' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'run' ? null : 'run')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('run'); }}
                >
                  Run
                </button>
                {activeMenu === 'run' && (
                  <div className="menubar-flyout-menu">
                    <button className="flyout-item" onClick={() => { onRun(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Play size={14} className="text-emerald" /><span>Start Execution</span></span>
                      <kbd className="flyout-kbd">Ctrl+↵</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onChangeRightPaneView && onChangeRightPaneView('testcases'); setActiveMenu(null); }}>
                      <span className="flyout-left"><FlaskConical size={14} className="text-amber" /><span>Run Test Cases (Judge)</span></span>
                      <kbd className="flyout-kbd">TEST</kbd>
                    </button>
                  </div>
                )}
              </div>

              {/* TOOLS */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'tools' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'tools' ? null : 'tools')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('tools'); }}
                >
                  Tools
                </button>
                {activeMenu === 'tools' && (
                  <div className="menubar-flyout-menu">
                    <button className="flyout-item" onClick={() => { onOpenAiExplainer(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Sparkles size={14} className="text-purple" /><span>AI Big-O & Logic Auditor</span></span>
                      <kbd className="flyout-kbd purple">AI</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onOpenTemplates(); setActiveMenu(null); }}>
                      <span className="flyout-left"><BookOpen size={14} className="text-amber" /><span>Algorithms & DSA Library</span></span>
                      <kbd className="flyout-kbd amber">LIB</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onOpenTranspiler(); setActiveMenu(null); }}>
                      <span className="flyout-left"><Languages size={14} className="text-cyan" /><span>Polyglot Code Transpiler</span></span>
                      <kbd className="flyout-kbd cyan">CONVERT</kbd>
                    </button>
                    {onOpenGitControl && (
                      <button className="flyout-item" onClick={() => { onOpenGitControl(); setActiveMenu(null); }}>
                        <span className="flyout-left"><FolderGit2 size={14} className="text-pink" /><span>Version Control (Git Matrix)</span></span>
                        <kbd className="flyout-kbd pink">GIT</kbd>
                      </button>
                    )}
                    <div className="flyout-divider" />
                    {onOpenLabReport && (
                      <button className="flyout-item" onClick={() => { onOpenLabReport(); setActiveMenu(null); }}>
                        <span className="flyout-left"><FileCheck2 size={14} className="text-emerald" /><span>Lab Practical Record (PDF)</span></span>
                        <kbd className="flyout-kbd green">PDF</kbd>
                      </button>
                    )}
                    <button className="flyout-item" onClick={() => { (isCollegeMode ? onExitCollegeMode() : onOpenCollegeMode()); setActiveMenu(null); }}>
                      <span className="flyout-left"><Laptop size={14} className="text-amber" /><span>{isCollegeMode ? 'Exit Lab Session' : 'College Exam Kiosk Mode'}</span></span>
                      <kbd className="flyout-kbd amber">LOCK</kbd>
                    </button>
                  </div>
                )}
              </div>

              {/* HELP */}
              <div className="menubar-item-wrapper">
                <button 
                  className={`menubar-trigger ${activeMenu === 'help' ? 'active' : ''}`}
                  onClick={() => setActiveMenu(m => m === 'help' ? null : 'help')}
                  onMouseEnter={() => { if (activeMenu) setActiveMenu('help'); }}
                >
                  Help
                </button>
                {activeMenu === 'help' && (
                  <div className="menubar-flyout-menu">
                    {onOpenCommandPalette && (
                      <button className="flyout-item" onClick={() => { onOpenCommandPalette(); setActiveMenu(null); }}>
                        <span className="flyout-left"><Search size={14} className="text-amber" /><span>Command Palette</span></span>
                        <kbd className="flyout-kbd">Ctrl+K</kbd>
                      </button>
                    )}
                    <button className="flyout-item" onClick={() => { setShowShortcutsModal(true); setActiveMenu(null); }}>
                      <span className="flyout-left"><Keyboard size={14} className="text-sky" /><span>Keyboard Shortcuts Guide</span></span>
                      <kbd className="flyout-kbd">Ctrl+/</kbd>
                    </button>
                    <button className="flyout-item" onClick={() => { onToggleTheme(); setActiveMenu(null); }}>
                      <span className="flyout-left">
                        {theme === 'vs-dark' ? <Sun size={14} className="text-amber" /> : <Moon size={14} className="text-sky" />}
                        <span>Switch to {theme === 'vs-dark' ? 'Light' : 'Dark'} Mode</span>
                      </span>
                      <kbd className="flyout-kbd">THEME</kbd>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          )}



          {/* Mobile Quick Install Button (hidden once installed) */}
          {isMobile && !isAppInstalled && (
            <button
              className="mobile-install-quick-btn"
              onClick={handleInstallApp}
              title="Install Elite IDE on your Phone"
              id="mobile-install-quick-btn"
              aria-label="Install Elite IDE on your device"
            >
              <Download size={14} />
            </button>
          )}
        </div>

        <div className="nav-center">
          {/* Run Code Button */}
          <button
            className={`run-button ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
            id="run-code-button"
            title="Compile & Run Code (Ctrl + Enter)"
          >
            <Play size={14} fill="currentColor" />
            <span>{isRunning ? 'Running...' : (isMobile ? 'Run' : 'Run Code')}</span>
            {!isMobile && <kbd className="kbd-shortcut">Ctrl+↵</kbd>}
          </button>
        </div>

        <div className="nav-right">
          {/* Automatic Language Detection Badge & Interactive Engine Selector */}
          <div className="auto-lang-selector-wrapper">
            <div className="auto-lang-pill" title="Programming language is identified automatically from your code in real-time">
              <Zap size={13} className="zap-icon" />
              {!isMobile && <span className="auto-label">{selectedLanguage === 'auto' ? 'Auto:' : 'Lang:'}</span>}
              <select
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
                className="lang-select-dropdown"
                id="language-select-dropdown"
                title="Select programming language or keep on real-time Auto-Detection"
              >
                <option value="auto">
                  ⚡ {isMobile ? (detectedLangInfo?.detected ? detectedLangInfo.name : 'Auto') : `Auto-Detect ${detectedLangInfo?.detected ? `(${detectedLangInfo.name})` : ''}`}
                </option>

                {LANGUAGE_CATEGORIES.map(cat => {
                  const items = ALL_LANGUAGES.filter(l => l.category === cat.id);
                  if (!items.length) return null;
                  return (
                    <optgroup key={cat.id} label={cat.name}>
                      {items.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.icon} {l.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {detectedLangInfo?.detected && !isMobile && (
                <span className="extension-badge live-detected">.{detectedLangInfo.extension}</span>
              )}
            </div>
          </div>

          {/* Desktop controls */}
          {!isMobile ? (
            <>
              {/* Quick Git Version Control */}
              {onOpenGitControl && (
                <button 
                  className="nav-icon-btn" 
                  onClick={onOpenGitControl} 
                  title="Git Version Control & Repository Clone (Ctrl + Shift + G)"
                  id="git-control-button"
                  style={{ color: '#ec4899' }}
                >
                  <FolderGit2 size={16} />
                </button>
              )}

              {/* Quick AI Architecture & Big-O Auditor */}
              {onOpenAiExplainer && (
                <button 
                  className="nav-icon-btn" 
                  onClick={onOpenAiExplainer} 
                  title="AI Big-O Complexity & Logic Auditor"
                  id="ai-doctor-button"
                  style={{ color: '#c084fc' }}
                >
                  <Sparkles size={16} />
                </button>
              )}

              {/* Quick Share Code */}
              {onOpenShareCode && (
                <button 
                  className="nav-icon-btn" 
                  onClick={onOpenShareCode} 
                  title="Share Code Snippet (URL / WhatsApp)"
                  id="share-code-button"
                  style={{ color: '#38bdf8' }}
                >
                  <Share2 size={16} />
                </button>
              )}

              {/* Quick Command Palette */}
              {onOpenCommandPalette && (
                <button 
                  className="nav-icon-btn" 
                  onClick={onOpenCommandPalette} 
                  title="Command Palette & Quick Search (Ctrl + K)"
                  id="command-palette-button"
                  style={{ color: '#f59e0b' }}
                >
                  <Search size={16} />
                </button>
              )}

              {/* Theme Toggle */}
              <button 
                className="nav-icon-btn" 
                onClick={onToggleTheme} 
                title={`Theme: ${theme === 'vs-dark' ? 'Obsidian Dark' : 'Light Mode'} (Click to switch)`}
                id="toggle-theme-button"
              >
                {theme === 'vs-dark' ? (
                  <Moon size={16} style={{ color: '#38bdf8' }} />
                ) : (
                  <Sun size={16} style={{ color: '#f59e0b' }} />
                )}
              </button>
            </>
          ) : (
            /* Mobile More Action Menu Button */
            <button
              className="nav-icon-btn mobile-more-trigger"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              title="More Actions & Settings"
              id="mobile-more-actions-btn"
              aria-label="Open mobile IDE tools menu"
            >
              <MoreVertical size={18} />
            </button>
          )}

          <input 
            ref={fileInputRef} 
            type="file" 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
          />
        </div>
      </header>

      {/* Mobile Slide-Up Settings & Actions Bottom Sheet */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="mobile-menu-sheet" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile IDE Settings and Tools"
          >
            <div className="mobile-sheet-header">
              <div className="sheet-title-group">
                <Sparkles size={16} className="text-accent" />
                <span className="sheet-title">IDE Tools & Settings</span>
              </div>
              <button 
                className="sheet-close-btn" 
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-content">
              {/* Appearance & Font Row */}
              <div className="sheet-section">
                <span className="sheet-section-title">Editor Appearance</span>
                <div className="sheet-action-row">
                  <button 
                    className="sheet-action-card" 
                    onClick={() => { onToggleTheme(); }}
                  >
                    {theme === 'vs-dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <div className="card-text">
                      <span className="card-label">Theme</span>
                      <span className="card-val">{theme === 'vs-dark' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                  </button>

                  <div className="sheet-action-card font-adjust-card">
                    <Type size={18} />
                    <div className="card-text">
                      <span className="card-label">Font Size</span>
                      <div className="font-stepper">
                        <button 
                          className="font-step-btn" 
                          onClick={() => onChangeFontSize(Math.max(11, (fontSize || 14) - 1))}
                        >
                          -
                        </button>
                        <span className="current-font-size">{fontSize || 14}px</span>
                        <button 
                          className="font-step-btn" 
                          onClick={() => onChangeFontSize(Math.min(22, (fontSize || 14) + 1))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Tools Row */}
              <div className="sheet-section">
                <span className="sheet-section-title">Code Actions</span>
                <div className="sheet-action-grid">
                  <button 
                    className="sheet-grid-btn" 
                    onClick={() => { onFormatCode(); setIsMobileMenuOpen(false); }}
                  >
                    <AlignLeft size={16} />
                    <span>Format Code</span>
                  </button>

                  <button 
                    className="sheet-grid-btn" 
                    onClick={() => { onOpenTemplates(); setIsMobileMenuOpen(false); }}
                  >
                    <BookOpen size={16} />
                    <span>Algorithm Library</span>
                  </button>

                  <button 
                    className="sheet-grid-btn text-cyan" 
                    onClick={() => { onOpenAiExplainer(); setIsMobileMenuOpen(false); }}
                  >
                    <Sparkles size={16} />
                    <span>AI Insights</span>
                  </button>

                  {onOpenLabReport && (
                    <button 
                      className="sheet-grid-btn text-emerald" 
                      onClick={() => { onOpenLabReport(); setIsMobileMenuOpen(false); }}
                    >
                      <FileCheck2 size={16} />
                      <span>Lab Record PDF</span>
                    </button>
                  )}

                  {onOpenTranspiler && (
                    <button 
                      className="sheet-grid-btn text-cyan" 
                      onClick={() => { onOpenTranspiler(); setIsMobileMenuOpen(false); }}
                    >
                      <Languages size={16} />
                      <span>Code Transpiler</span>
                    </button>
                  )}

                  <button 
                    className="sheet-grid-btn danger" 
                    onClick={() => { onClearCode(); setIsMobileMenuOpen(false); }}
                  >
                    <Trash2 size={16} />
                    <span>Clear Code</span>
                  </button>

                  {onOpenShareCode && (
                    <button 
                      className="sheet-grid-btn text-cyan" 
                      onClick={() => { onOpenShareCode(); setIsMobileMenuOpen(false); }}
                    >
                      <Share2 size={16} />
                      <span>Share Code</span>
                    </button>
                  )}

                  {onOpenCommandPalette && (
                    <button 
                      className="sheet-grid-btn" 
                      onClick={() => { onOpenCommandPalette(); setIsMobileMenuOpen(false); }}
                    >
                      <Search size={16} />
                      <span>Commands (Ctrl+K)</span>
                    </button>
                  )}

                  <button 
                    className="sheet-grid-btn" 
                    onClick={handleDownload}
                  >
                    <Download size={16} />
                    <span>Download File</span>
                  </button>

                  {!isAppInstalled && (
                    <button 
                      className="sheet-grid-btn highlight-install" 
                      onClick={() => { setIsMobileMenuOpen(false); handleInstallApp(); }}
                    >
                      <Download size={16} />
                      <span>Install App</span>
                    </button>
                  )}

                  <button 
                    className="sheet-grid-btn" 
                    onClick={() => { setIsMobileMenuOpen(false); isCollegeMode ? onExitCollegeMode() : onOpenCollegeMode(); }}
                  >
                    <Laptop size={16} />
                    <span>{isCollegeMode ? 'Exit Lab Session' : 'System Login'}</span>
                  </button>

                  <button 
                    className="sheet-grid-btn" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    <span>Open / Upload</span>
                  </button>

                  <a 
                    href="/" 
                    className="sheet-grid-btn external"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <ArrowLeft size={16} />
                    <span>Main Site</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Instructions & Trigger Modal */}
      {showInstallModal && (
        <div className="install-modal-backdrop" onClick={() => setShowInstallModal(false)}>
          <div className="install-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="install-modal-header">
              <div className="install-modal-title">
                <Download size={22} className="text-cyan-400" />
                <div>
                  <h4>Install Elite IDE App</h4>
                  <p>Fast, direct access on Desktop & Mobile without browser address bar</p>
                </div>
              </div>
              <button className="install-modal-close" onClick={() => setShowInstallModal(false)}>✕</button>
            </div>

            <div className="install-modal-body">
              {installedSuccess && (
                <div className="install-success-banner">
                  <Check size={16} />
                  <span>App installed successfully! Launch it directly from your device.</span>
                </div>
              )}

              <div className="install-guide-list">
                <div className="guide-item">
                  <Laptop size={22} className="guide-icon text-cyan-400 flex-shrink-0" />
                  <div>
                    <strong>Windows / Mac / Linux (Chrome & Edge):</strong>
                    <p>Click the <strong>Install (⊕)</strong> icon on the right edge of your browser address bar, or click Browser Menu (⋮) ➔ <strong>Install Elite IDE</strong>.</p>
                  </div>
                </div>

                <div className="guide-item">
                  <Smartphone size={22} className="guide-icon text-emerald-400 flex-shrink-0" />
                  <div>
                    <strong>Android (Chrome):</strong>
                    <p>Tap Browser Menu (⋮) ➔ <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                  </div>
                </div>

                <div className="guide-item">
                  <Smartphone size={22} className="guide-icon text-amber-400 flex-shrink-0" />
                  <div>
                    <strong>iPhone & iPad (Safari):</strong>
                    <p>Tap the <strong>Share (⎋)</strong> button at the bottom of the screen ➔ Scroll down and select <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="install-modal-actions">
                {deferredPrompt && (
                  <button type="button" className="install-now-btn" onClick={handleInstallApp}>
                    <Download size={15} />
                    <span>Install to Device Now</span>
                  </button>
                )}
                <button type="button" className="install-done-btn" onClick={() => setShowInstallModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="install-modal-backdrop" onClick={() => setShowShortcutsModal(false)}>
          <div className="install-modal-card shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="install-modal-header">
              <div className="install-modal-title">
                <Keyboard size={20} className="text-cyan-400" />
                <div>
                  <h4>Keyboard Shortcuts</h4>
                  <p>Productivity accelerators for Elite Code Studio</p>
                </div>
              </div>
              <button className="install-modal-close" onClick={() => setShowShortcutsModal(false)}>✕</button>
            </div>

            <div className="shortcuts-modal-body">
              <div className="shortcuts-list">
                <div className="shortcut-item">
                  <span className="shortcut-desc">Run & Compile Code</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>↵ Enter</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Auto-Format Code (Prettier)</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Official Lab Report PDF Generator</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Polyglot Code Transpiler</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Toggle Project File Explorer</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>B</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Find in Code Editor</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>F</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Replace in Code Editor</span>
                  <div className="shortcut-badge"><kbd>Ctrl</kbd> + <kbd>H</kbd></div>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-desc">Close Active Modal / Dropdown</span>
                  <div className="shortcut-badge"><kbd>Esc</kbd></div>
                </div>
              </div>

              <div className="install-modal-actions" style={{ marginTop: '1.25rem' }}>
                <button type="button" className="install-done-btn" onClick={() => setShowShortcutsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
