import React, { useRef } from 'react';
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
  Globe
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
  onSelectLanguage
}) {
  const fileInputRef = useRef(null);

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
  };

  return (
    <header className="ide-navbar">
      <div className="nav-left">
        <a href="/" className="brand" title="Return to Elite Web Kingdom Main Website" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img src="/compiler/logo.png" alt="Elite IDE Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">Elite IDE</span>
            <span className="brand-badge">PRO COMPILER</span>
          </div>
        </a>

        {/* Automatic Language Detection Badge & Interactive Engine Selector */}
        <div className="auto-lang-selector-wrapper">
          <div className="auto-lang-pill" title="Programming language is identified automatically from your code in real-time">
            <Zap size={14} className="zap-icon" />
            <span className="auto-label">{selectedLanguage === 'auto' ? 'Auto-Detect:' : 'Language:'}</span>
            <select
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage && onSelectLanguage(e.target.value)}
              className="lang-select-dropdown"
              id="language-select-dropdown"
              title="Select programming language or keep on real-time Auto-Detection"
            >
              <option value="auto">
                ⚡ Auto-Detect {detectedLangInfo?.detected ? `(${detectedLangInfo.name})` : '(Type Code...)'}
              </option>
              <option value="python">🐍 Python 3</option>
              <option value="cpp">⚙️ C++ (G++ 13.3)</option>
              <option value="c">🔧 C (GCC 13.3)</option>
              <option value="java">☕ Java (OpenJDK 17)</option>
              <option value="javascript">⚡ JavaScript (Node.js 24)</option>
              <option value="html">🌐 HTML / Web Sandbox</option>
            </select>
            {detectedLangInfo?.detected && (
              <span className="extension-badge live-detected">.{detectedLangInfo.extension}</span>
            )}
          </div>
        </div>

        {/* Algorithm & Template Library Nav Button */}
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
          <Play size={16} fill="currentColor" />
          <span>{isRunning ? 'Compiling & Running...' : 'Run Code'}</span>
          <kbd className="kbd-shortcut">Ctrl+↵</kbd>
        </button>
      </div>

      <div className="nav-right">
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
        <input 
          ref={fileInputRef} 
          type="file" 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

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

        {/* Return to Elite Web Kingdom Main Website */}
        <a 
          href="/" 
          className="nav-icon-btn" 
          title="Return to Elite Web Kingdom Main Website"
          style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          <ArrowLeft size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, paddingRight: '4px' }}>Main Site</span>
        </a>
      </div>
    </header>
  );
}
