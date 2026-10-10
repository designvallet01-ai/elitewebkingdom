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
  Check
} from 'lucide-react';

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
  onOpenTemplates,
  isSidebarOpen,
  onToggleSidebar,
  selectedLanguage = 'auto',
  onSelectLanguage,
  isMobile = false,
  isCollegeMode = false,
  onOpenCollegeMode,
  onExitCollegeMode
}) {
  const fileInputRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // Capture beforeinstallprompt event for PWA installation
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Handle Install App button click (triggers native prompt or opens install guide modal)
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccess(true);
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

  // Close mobile menu on outside escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (showInstallModal) setShowInstallModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, showInstallModal]);

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

          {/* Mobile Quick Install Button */}
          {isMobile && (
            <button
              className="mobile-install-quick-btn"
              onClick={handleInstallApp}
              title="Install Elite IDE on your Phone"
              id="mobile-install-quick-btn"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
          )}

          {/* Automatic Language Detection Badge & Interactive Engine Selector */}
          <div className="auto-lang-selector-wrapper">
            <div className="auto-lang-pill" title="Programming language is identified automatically from your code in real-time">
              <Zap size={14} className="zap-icon" />
              {!isMobile && <span className="auto-label">{selectedLanguage === 'auto' ? 'Auto-Detect:' : 'Language:'}</span>}
              <select
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
                className="lang-select-dropdown"
                id="language-select-dropdown"
                title="Select programming language or keep on real-time Auto-Detection"
              >
                <option value="auto">
                  ⚡ {isMobile ? 'Auto' : 'Auto-Detect'} {detectedLangInfo?.detected ? `(${detectedLangInfo.name})` : ''}
                </option>
                <option value="python">🐍 Python 3</option>
                <option value="cpp">⚙️ C++ (G++ 14)</option>
                <option value="c">🔧 C (GCC 9.2)</option>
                <option value="java">☕ Java (OpenJDK 17)</option>
                <option value="javascript">⚡ JavaScript (Node)</option>
                <option value="html">🌐 HTML / Sandbox</option>
              </select>
              {detectedLangInfo?.detected && !isMobile && (
                <span className="extension-badge live-detected">.{detectedLangInfo.extension}</span>
              )}
            </div>
          </div>

          {/* System Login Button for Student Machine (Desktop) */}
          {!isMobile && (
            <button
              className={`nav-college-mode-btn ${isCollegeMode ? 'active-exam' : ''}`}
              onClick={isCollegeMode ? onExitCollegeMode : onOpenCollegeMode}
              title={isCollegeMode ? "Exam Session Active - Admin PIN Required to Exit" : "System Login for College Lab PCs"}
              id="nav-college-mode-btn"
            >
              <Laptop size={15} />
              <span>{isCollegeMode ? 'Session Active' : 'System Login'}</span>
              {isCollegeMode ? <span className="exam-status-dot" /> : <span className="clg-pin-badge">LAB</span>}
            </button>
          )}

          {/* Install App Button (Desktop) */}
          {!isMobile && (
            <button
              className="nav-install-btn"
              onClick={handleInstallApp}
              title="Install Elite IDE on your Computer / System"
              id="btn-install-app-desktop"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}

          {/* Algorithm & Template Library Nav Button (Desktop - hidden during College Exam) */}
          {!isMobile && !isCollegeMode && (
            <button
              className="nav-library-btn"
              onClick={onOpenTemplates}
              title="Open Curated Algorithm & Data Structure Library"
              id="nav-algorithm-library-btn"
            >
              <BookOpen size={14} />
              <span>Algorithms</span>
              <span className="library-badge">Library</span>
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
            title="Compile & Run Code"
          >
            <Play size={15} fill="currentColor" />
            <span>{isRunning ? 'Running...' : (isMobile ? 'Run' : 'Run Code')}</span>
            {!isMobile && <kbd className="kbd-shortcut">Ctrl+↵</kbd>}
          </button>
        </div>

        <div className="nav-right">
          {/* Desktop controls */}
          {!isMobile ? (
            <>
              {/* Format */}
              <button 
                className="nav-icon-btn" 
                onClick={onFormatCode} 
                title="Format Code"
                id="format-code-button"
              >
                <AlignLeft size={16} />
              </button>

              {/* Clear Code */}
              <button 
                className="nav-icon-btn" 
                onClick={onClearCode} 
                title="Clear Editor"
                id="clear-code-button"
              >
                <Trash2 size={16} />
              </button>

              <div className="nav-divider" />

              {/* Download */}
              <button 
                className="nav-icon-btn" 
                onClick={handleDownload} 
                title={`Download Current File (${activeFileName || 'code'})`}
                id="download-code-button"
              >
                <Download size={16} />
              </button>

              {/* Upload */}
              <button 
                className="nav-icon-btn" 
                onClick={() => fileInputRef.current?.click()} 
                title="Upload / Open Code File"
                id="upload-code-button"
              >
                <Upload size={16} />
              </button>

              <div className="nav-divider" />

              {/* Font Size Selector */}
              <select 
                className="font-size-select"
                value={fontSize}
                onChange={(e) => onChangeFontSize(Number(e.target.value))}
                title="Editor Font Size"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
              </select>

              {/* Theme Toggle */}
              <button 
                className="nav-icon-btn" 
                onClick={onToggleTheme} 
                title={`Switch to ${theme === 'vs-dark' ? 'Light' : 'Dark'} Mode`}
                id="toggle-theme-button"
              >
                {theme === 'vs-dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <div className="nav-divider" />

              {/* Return to Elite Web Kingdom Main Website (Locked during College Exam) */}
              {isCollegeMode ? (
                <button
                  type="button"
                  className="nav-icon-btn clg-locked-btn"
                  onClick={onExitCollegeMode}
                  title="College Exam Active: Admin PIN required to leave"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0.7 }}
                >
                  <Lock size={15} className="text-warning" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, paddingRight: '4px', color: '#fbbf24' }}>Locked</span>
                </button>
              ) : (
                <a 
                  href="/" 
                  className="nav-icon-btn" 
                  title="Return to Elite Web Kingdom Main Website"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <ArrowLeft size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, paddingRight: '4px' }}>Main Site</span>
                </a>
              )}
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
                    className="sheet-grid-btn danger" 
                    onClick={() => { onClearCode(); setIsMobileMenuOpen(false); }}
                  >
                    <Trash2 size={16} />
                    <span>Clear Code</span>
                  </button>

                  <button 
                    className="sheet-grid-btn" 
                    onClick={handleDownload}
                  >
                    <Download size={16} />
                    <span>Download File</span>
                  </button>

                  <button 
                    className="sheet-grid-btn highlight-install" 
                    onClick={() => { setIsMobileMenuOpen(false); handleInstallApp(); }}
                  >
                    <Download size={16} />
                    <span>Install App</span>
                  </button>

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
    </>
  );
}
