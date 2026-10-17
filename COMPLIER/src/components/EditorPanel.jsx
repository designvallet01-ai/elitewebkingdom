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
  Sparkles,
  Mic,
  MicOff,
  Wand2,
  Zap
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
  isMobile = false,
  onCursorChange
}) {
  const editorRef = useRef(null);
  const [copied, setCopied] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [showDsaSnippets, setShowDsaSnippets] = React.useState(false);
  const recognitionRef = useRef(null);

  // Insert snippet or text into Monaco editor at current cursor position
  const insertTextAtCursor = (text) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits('dsa-snippet', [
        {
          range: selection,
          text: `\n${text}\n`,
          forceMoveMarkers: true
        }
      ]);
      editor.focus();
    } else {
      onChange(code ? `${code}\n${text}` : text);
    }
  };

  // Convert spoken voice into programming syntax
  const handleInsertSpokenText = (transcript) => {
    let formatted = transcript;
    const lower = transcript.toLowerCase();

    if (lower.startsWith('print ') || lower.startsWith('console log ')) {
      const msg = transcript.replace(/^(print|console\s+log)\s+/i, '');
      formatted = language === 'cpp' 
        ? `std::cout << "${msg}" << std::endl;`
        : language === 'javascript'
        ? `console.log("${msg}");`
        : `print("${msg}")`;
    } else if (lower.startsWith('for loop') || lower.startsWith('for each')) {
      formatted = language === 'cpp'
        ? `for (int i = 0; i < 10; i++) {\n    // code\n}`
        : `for i in range(10):\n    pass`;
    } else if (lower.startsWith('while loop')) {
      formatted = language === 'cpp'
        ? `while (condition) {\n    // code\n}`
        : `while condition:\n    pass`;
    } else if (lower.startsWith('function ') || lower.startsWith('def ')) {
      const fnName = lower.replace(/^(function|def)\s+/i, '').replace(/\s+/g, '_');
      formatted = language === 'cpp'
        ? `void ${fnName}() {\n    // body\n}`
        : `def ${fnName}():\n    pass`;
    }

    insertTextAtCursor(formatted);
  };

  // Toggle Voice Coding
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported in modern Chrome & Edge browsers.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          handleInsertSpokenText(transcript);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMountEditor) {
      onMountEditor(editor, monaco);
    }
    // Track cursor line changes in real time for live flowchart synchronization
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange && e.position) {
        onCursorChange(e.position.lineNumber);
      }
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Map language IDs to Monaco editor languages (25+ world languages)
  const getMonacoLang = (lang) => {
    switch (lang) {
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'python': return 'python';
      case 'java': return 'java';
      case 'javascript': return 'javascript';
      case 'typescript': return 'typescript';
      case 'rust': return 'rust';
      case 'go': return 'go';
      case 'csharp': return 'csharp';
      case 'php': return 'php';
      case 'ruby': return 'ruby';
      case 'kotlin': return 'kotlin';
      case 'swift': return 'swift';
      case 'dart': return 'dart';
      case 'sql': return 'sql';
      case 'r': return 'r';
      case 'bash': return 'shell';
      case 'scala': return 'scala';
      case 'lua': return 'lua';
      case 'haskell': return 'haskell';
      case 'perl': return 'perl';
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
      case 'typescript': return '#3178c6';
      case 'rust': return '#dea584';
      case 'go': return '#00ADD8';
      case 'csharp': return '#178600';
      case 'php': return '#4F5D95';
      case 'ruby': return '#701516';
      case 'kotlin': return '#A97BFF';
      case 'swift': return '#F05138';
      case 'dart': return '#00B4AB';
      case 'sql': return '#e38c00';
      case 'r': return '#198CE7';
      case 'bash': return '#89e051';
      case 'scala': return '#c22d40';
      case 'lua': return '#000080';
      case 'haskell': return '#5e5086';
      case 'perl': return '#0298c3';
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
          {/* Voice Coding (Speech-to-Code) Button */}
          <button
            className={`tab-action-btn voice-dictation-btn ${isListening ? 'listening' : ''}`}
            onClick={handleToggleVoice}
            title={isListening ? "Listening... Speak programming instructions" : "Voice Coding: Dictate code with your microphone"}
            id="editor-voice-dictation-btn"
          >
            {isListening ? <Mic size={14} className="text-rose animate-pulse" /> : <Mic size={14} />}
            <span className="action-btn-text">{isListening ? 'Listening...' : 'Voice'}</span>
          </button>

          {/* DSA Snippet Arsenal */}
          <div className="dropdown-wrapper">
            <button
              className="tab-action-btn dsa-magic-btn"
              onClick={() => setShowDsaSnippets(!showDsaSnippets)}
              title="Insert Competitive Programming & DSA Templates"
              id="editor-dsa-arsenal-btn"
            >
              <Wand2 size={14} className="text-amber" />
              <span className="action-btn-text">DSA Arsenal</span>
            </button>

            {showDsaSnippets && (
              <div className="editor-dsa-menu">
                <div className="dsa-menu-title">1-Click DSA Arsenal</div>
                <button 
                  className="dsa-menu-item"
                  onClick={() => {
                    insertTextAtCursor(language === 'cpp' 
                      ? 'std::ios_base::sync_with_stdio(false);\nstd::cin.tie(NULL);'
                      : 'import sys\ninput = sys.stdin.readline');
                    setShowDsaSnippets(false);
                  }}
                >
                  ⚡ Fast I/O Accelerator
                </button>
                <button 
                  className="dsa-menu-item"
                  onClick={() => {
                    insertTextAtCursor(`def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target: return mid\n        elif arr[mid] < target: low = mid + 1\n        else: high = mid - 1\n    return -1`);
                    setShowDsaSnippets(false);
                  }}
                >
                  🔍 Binary Search (O(log N))
                </button>
                <button 
                  className="dsa-menu-item"
                  onClick={() => {
                    insertTextAtCursor(`def kadane_max_subarray(nums):\n    max_so_far = curr_max = nums[0]\n    for x in nums[1:]:\n        curr_max = max(x, curr_max + x)\n        max_so_far = max(max_so_far, curr_max)\n    return max_so_far`);
                    setShowDsaSnippets(false);
                  }}
                >
                  🧩 Kadane's Max Subarray
                </button>
                <button 
                  className="dsa-menu-item"
                  onClick={() => {
                    insertTextAtCursor(`def sieve(n):\n    primes = [True] * (n + 1)\n    primes[0] = primes[1] = False\n    for p in range(2, int(n**0.5) + 1):\n        if primes[p]:\n            for i in range(p*p, n+1, p): primes[i] = False\n    return [p for p in range(2, n+1) if primes[p]]`);
                    setShowDsaSnippets(false);
                  }}
                >
                  🔢 Sieve of Eratosthenes
                </button>
                <button 
                  className="dsa-menu-item"
                  onClick={() => {
                    insertTextAtCursor(`from collections import deque\ndef bfs(graph, start):\n    visited, queue = set([start]), deque([start])\n    while queue:\n        curr = queue.popleft()\n        print(curr, end=" ")\n        for nxt in graph.get(curr, []):\n            if nxt not in visited:\n                visited.add(nxt)\n                queue.append(nxt)`);
                    setShowDsaSnippets(false);
                  }}
                >
                  🌲 BFS Traversal Template
                </button>
              </div>
            )}
          </div>

          <button 
            className="tab-action-btn"
            onClick={handleCopyCode}
            title="Copy Source Code"
            id="editor-copy-btn"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span className="action-btn-text">{copied ? 'Copied' : 'Copy'}</span>
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
            padding: { top: isMobile ? 6 : 12, bottom: isMobile ? 6 : 12 },
            glyphMargin: !isMobile,
            folding: !isMobile,
            contextmenu: !isMobile,
            scrollbar: {
              verticalScrollbarSize: isMobile ? 4 : 10,
              horizontalScrollbarSize: isMobile ? 4 : 10
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
