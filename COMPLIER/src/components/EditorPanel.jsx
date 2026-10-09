import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Plus, 
  X, 
  PanelLeftClose, 
  PanelLeft, 
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function EditorPanel({
  files = [],
  activeFileId,
  onSelectFile,
  onCloseFile,
  onCreateFile,
  onOpenTemplates,
  isSidebarOpen,
  onToggleSidebar,
  code,
  onChange,
  language,
  theme,
  fontSize,
  filename,
  onMountEditor,
  isMobile = false
}) {
  const editorRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMountEditor) {
      onMountEditor(editor, monaco);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Map language IDs to Monaco editor languages
  const getMonacoLang = (lang) => {
    switch (lang) {
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'python': return 'python';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      case 'html': return 'html';
      default: return 'plaintext';
    }
  };

  const getLanguageColor = (lang) => {
    switch (lang) {
      case 'python': return '#3572A5';
      case 'cpp': return '#f34b7d';
      case 'c': return '#555555';
      case 'java': return '#b07219';
      case 'javascript': return '#f1e05a';
      case 'html': return '#e34c26';
      default: return '#8b949e';
    }
  };

  return (
    <div className="editor-panel-container">
      {/* Editor Multi-Tab Strip */}
      <div className="editor-tab-strip-wrapper">
        {/* Toggle Workspace Explorer Button */}
        <button
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide Workspace Files Sidebar" : "Show Workspace Files Sidebar"}
          id="toggle-files-sidebar-btn"
        >
          {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
        </button>

        {/* Scrollable Tabs */}
        <div className="editor-tabs-container">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                className={`editor-tab ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFile && onSelectFile(file.id)}
                title={`${file.name} (${file.language})`}
              >
                <span 
                  className="tab-lang-bullet" 
                  style={{ backgroundColor: getLanguageColor(file.language) }} 
                />
                <span className="tab-title">{file.name}</span>

                {file.isModified && (
                  <span className="tab-unsaved-dot" title="Modified" />
                )}

                {files.length > 1 && (
                  <button
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCloseFile) onCloseFile(file.id);
                    }}
                    title="Close tab"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            className="tab-add-btn"
            onClick={() => onCreateFile && onCreateFile('file')}
            title="Create New File Tab"
            id="editor-new-tab-btn"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Tab Strip Right Actions */}
        <div className="tab-strip-actions">
          <button
            className="tab-action-btn templates"
            onClick={onOpenTemplates}
            title="Browse Algorithm & Data Structure Library"
            id="browse-templates-strip-btn"
          >
            <Sparkles size={14} className="sparkle-icon" />
            <span>Algorithms</span>
          </button>

          <button 
            className="tab-action-btn"
            onClick={handleCopyCode}
            title="Copy Source Code"
            id="editor-copy-btn"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="monaco-wrapper">
        <Editor
          height="100%"
          language={getMonacoLang(language)}
          theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: isMobile ? 13 : (fontSize || 14),
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            tabSize: 4,
            minimap: { enabled: !isMobile },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            lineNumbersMinChars: isMobile ? 2 : 4,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            padding: { top: isMobile ? 8 : 12, bottom: isMobile ? 8 : 12 },
            scrollbar: {
              verticalScrollbarSize: isMobile ? 6 : 10,
              horizontalScrollbarSize: isMobile ? 6 : 10
            }
          }}
          loading={
            <div className="editor-loading">
              <div className="spinner" />
              <span>Initializing Monaco Editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
