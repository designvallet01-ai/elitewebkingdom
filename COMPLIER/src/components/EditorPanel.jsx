import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode2,
  Copy,
  Check,
  Plus,
  X,
  Code2,
  WrapText,
  Map,
  Minus,
  Sparkles,
  ChevronRight,
  Folder,
  AlignLeft,
  Wand2
} from 'lucide-react';
import { getLanguageById } from '../services/languagesRegistry';

export default function EditorPanel({
  files = [],
  activeFileId,
  onSelectFile,
  onCloseFile,
  onCreateFile,
  onOpenTemplates,
  code = '',
  onChange,
  language = 'python',
  theme = 'vs-dark',
  fontSize = 14,
  onChangeFontSize,
  filename = 'main.py',
  onMountEditor,
  isMobile = false,
  onCursorChange,
  remoteCursors = [],
  isLiveMode = false,
  livePeersCount = 0,
  onFormatCode
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showMinimap, setShowMinimap] = useState(!isMobile);
  const [wordWrap, setWordWrap] = useState('on');

  // File type color and label badge
  const getFileBadge = (name = '') => {
    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return { label: 'PY', color: '#38bdf8' };
      case 'cpp':
      case 'cc': return { label: 'C++', color: '#f43f5e' };
      case 'c': return { label: 'C', color: '#94a3b8' };
      case 'java': return { label: 'JV', color: '#f59e0b' };
      case 'js':
      case 'jsx': return { label: 'JS', color: '#facc15' };
      case 'ts':
      case 'tsx': return { label: 'TS', color: '#60a5fa' };
      case 'html': return { label: 'HT', color: '#fb923c' };
      case 'css': return { label: 'CS', color: '#38bdf8' };
      case 'sql': return { label: 'SQL', color: '#c084fc' };
      case 'json': return { label: 'JSON', color: '#34d399' };
      case 'rs': return { label: 'RS', color: '#f87171' };
      case 'go': return { label: 'GO', color: '#2dd4bf' };
      default: return { label: 'TXT', color: '#64748b' };
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    if (onMountEditor) {
      onMountEditor(editor, monaco);
    }
  };

  // Map language to Monaco syntax identifier
  const getMonacoLanguage = (lang = 'python') => {
    const l = lang.toLowerCase();
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'c') return 'c';
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'java' || l === 'jdbc') return 'java';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'html') return 'html';
    if (l === 'css') return 'css';
    if (l === 'sql') return 'sql';
    if (l === 'json') return 'json';
    if (l === 'rust' || l === 'rs') return 'rust';
    if (l === 'go') return 'go';
    if (l === 'markdown' || l === 'md') return 'markdown';
    if (l === 'csharp' || l === 'cs') return 'csharp';
    if (l === 'php') return 'php';
    return 'plaintext';
  };

  return (
    <div className="elite-editor-panel">
      {/* 1. Multiple Editor Tabs Strip */}
      <div className="editor-tab-strip" role="tablist">
        <div className="editor-tabs-scroll" data-hscroll="true">
          {files.map((file) => {
            const badge = getFileBadge(file.name);
            const isActive = file.id === activeFileId;

            return (
              <div
                key={file.id}
                className={`editor-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFile(file.id)}
                role="tab"
                aria-selected={isActive}
                title={file.name}
              >
                <span
                  className="tab-lang-badge font-mono"
                  style={{ color: badge.color }}
                >
                  {badge.label}
                </span>
                <span className="tab-file-title font-mono">{file.name}</span>

                {file.isModified && <span className="tab-modified-dot" title="Modified" />}

                {files.length > 1 && (
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile(file.id);
                    }}
                    title="Close tab"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Tab Strip Right Controls */}
        <div className="editor-tab-strip-actions">
          <button
            type="button"
            className="tab-strip-btn"
            onClick={() => onCreateFile('file')}
            title="New File"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 2. Breadcrumbs & Editor Toolbar */}
      <div className="editor-breadcrumb-bar">
        {/* Breadcrumb Path */}
        <div className="breadcrumb-path font-mono">
          <Folder size={13} className="text-blue-400" />
          <span>workspace</span>
          <ChevronRight size={12} className="text-slate-500" />
          <span>src</span>
          <ChevronRight size={12} className="text-slate-500" />
          <span className="font-semibold text-slate-200">{filename}</span>
          {isLiveMode && (
            <span className="live-peer-chip font-mono text-xs">
              ⚡ LIVE ({livePeersCount + 1} coders)
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="editor-toolbar-controls">
          {/* Format Code */}
          {onFormatCode && (
            <button
              type="button"
              className="editor-tool-action-btn"
              onClick={onFormatCode}
              title="Format Document (Shift + Alt + F)"
            >
              <AlignLeft size={13} />
              <span className="hidden md:inline">Format</span>
            </button>
          )}

          {/* Word Wrap Toggle */}
          <button
            type="button"
            className={`editor-tool-action-btn ${wordWrap === 'on' ? 'active' : ''}`}
            onClick={() => setWordWrap(prev => (prev === 'on' ? 'off' : 'on'))}
            title="Toggle Word Wrap (Alt + Z)"
          >
            <WrapText size={13} />
          </button>

          {/* Minimap Toggle */}
          <button
            type="button"
            className={`editor-tool-action-btn ${showMinimap ? 'active' : ''}`}
            onClick={() => setShowMinimap(prev => !prev)}
            title="Toggle Code Minimap"
          >
            <Map size={13} />
          </button>

          {/* Font Size Adjuster */}
          <div className="font-size-adjuster" title="Editor Font Size">
            <button
              type="button"
              className="font-size-btn"
              onClick={() => onChangeFontSize && onChangeFontSize(Math.max(11, fontSize - 1))}
              disabled={fontSize <= 11}
              title="Decrease Font Size"
            >
              <Minus size={11} />
            </button>
            <span className="font-size-val font-mono">{fontSize}px</span>
            <button
              type="button"
              className="font-size-btn"
              onClick={() => onChangeFontSize && onChangeFontSize(Math.min(24, fontSize + 1))}
              disabled={fontSize >= 24}
              title="Increase Font Size"
            >
              <Plus size={11} />
            </button>
          </div>

          {/* Copy Code */}
          <button
            type="button"
            className="editor-tool-action-btn copy-btn"
            onClick={handleCopyCode}
            title="Copy Entire Code"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3. Monaco Editor Core Container */}
      <div className="monaco-wrapper">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(val) => onChange && onChange(val || '')}
          theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: fontSize,
            lineHeight: Math.round(fontSize * 1.55),
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            minimap: { enabled: showMinimap },
            wordWrap: wordWrap,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            folding: true,
            foldingHighlight: true,
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            formatOnType: true,
            multiCursorModifier: 'alt',
            quickSuggestions: { other: true, comments: false, strings: true },
            suggestOnTriggerCharacters: true,
            bracketPairColorization: { enabled: true }
          }}
          loading={
            <div className="monaco-loading-spinner font-mono text-xs text-slate-400">
              Initializing Monaco Editor Workspace...
            </div>
          }
        />
      </div>
    </div>
  );
}
