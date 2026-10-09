import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import EditorPanel from './components/EditorPanel';
import ConsolePanel from './components/ConsolePanel';
import GraphicalView from './components/GraphicalView';
import WebPreview from './components/WebPreview';
import FileSidebar from './components/FileSidebar';
import AlgorithmModal from './components/AlgorithmModal';
import { detectLanguage } from './services/languageDetector';
import { Terminal, GitFork, Globe } from 'lucide-react';

const STORAGE_FILES_KEY = 'elite_ide_workspace_files_v2';
const STORAGE_ACTIVE_KEY = 'elite_ide_active_file_id_v2';
const STORAGE_SIDEBAR_KEY = 'elite_ide_sidebar_open_v2';

const DEFAULT_INITIAL_FILES = [
  {
    id: 'file-1',
    name: 'main.cpp',
    code: '',
    language: 'cpp',
    isModified: false
  }
];

export default function App() {
  // Multi-file workspace state with local storage fallback
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FILES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load workspace files from storage:', e);
    }
    return DEFAULT_INITIAL_FILES;
  });

  const [activeFileId, setActiveFileId] = useState(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_KEY);
      if (savedId) return savedId;
    } catch (e) {}
    return 'file-1';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SIDEBAR_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const [isAlgorithmModalOpen, setIsAlgorithmModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalEntries, setTerminalEntries] = useState([]);
  const [lastStats, setLastStats] = useState(null);
  const [theme, setTheme] = useState('vs-dark'); // 'vs-dark' or 'vs-light'
  const [fontSize, setFontSize] = useState(14);
  const [rightPaneView, setRightPaneView] = useState('console'); // 'console' | 'graphical' | 'preview'
  const [selectedLine, setSelectedLine] = useState(null);
  const [manualLanguage, setManualLanguage] = useState('auto'); // 'auto' | 'python' | 'cpp' | 'c' | 'java' | 'javascript' | 'html'

  const editorInstanceRef = useRef(null);
  const wsRef = useRef(null);

  // Active file resolution
  const activeFile = useMemo(() => {
    return files.find(f => f.id === activeFileId) || files[0] || DEFAULT_INITIAL_FILES[0];
  }, [files, activeFileId]);

  // Auto-sync files on mount: if code contains a detectable language, sync extension immediately
  useEffect(() => {
    setFiles(prev => {
      let changed = false;
      const updated = prev.map(f => {
        if (f.code && f.code.trim()) {
          const det = detectLanguage(f.code, f.language);
          if (det.detected && det.extension) {
            const parts = f.name.split('.');
            const base = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0];
            const properBase = (det.language === 'java' && base.toLowerCase() === 'main') ? 'Main' : base;
            const newName = `${properBase}.${det.extension}`;
            if (newName !== f.name || det.language !== f.language) {
              changed = true;
              return { ...f, name: newName, language: det.language };
            }
          }
        }
        return f;
      });
      return changed ? updated : prev;
    });
  }, []);

  // Persist files in local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to persist files:', e);
    }
  }, [files]);

  // Persist active file ID
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_KEY, activeFileId);
    } catch (e) {}
  }, [activeFileId]);

  // Persist sidebar state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SIDEBAR_KEY, String(isSidebarOpen));
    } catch (e) {}
  }, [isSidebarOpen]);

  // Language detection: real-time automatic detection from code with manual override option
  const detectedLangInfo = useMemo(() => {
    const ext = activeFile.name.split('.').pop()?.toLowerCase();
    const contentDetection = detectLanguage(activeFile.code);

    const extMap = {
      py: { language: 'python', name: 'Python 3', extension: 'py', monaco: 'python' },
      cpp: { language: 'cpp', name: 'C++ (G++)', extension: 'cpp', monaco: 'cpp' },
      cc: { language: 'cpp', name: 'C++ (G++)', extension: 'cpp', monaco: 'cpp' },
      c: { language: 'c', name: 'C (GCC)', extension: 'c', monaco: 'c' },
      java: { language: 'java', name: 'Java (OpenJDK 17)', extension: 'java', monaco: 'java' },
      js: { language: 'javascript', name: 'JavaScript (Node.js)', extension: 'js', monaco: 'javascript' },
      html: { language: 'html', name: 'HTML / Web Sandbox', extension: 'html', monaco: 'html' }
    };

    // If user explicitly selected a language from the dropdown
    if (manualLanguage !== 'auto') {
      const selected = extMap[manualLanguage] || {
        language: manualLanguage,
        name: manualLanguage,
        extension: manualLanguage,
        monaco: manualLanguage
      };
      return {
        ...selected,
        filename: activeFile.name,
        detected: true,
        isManual: true
      };
    }

    // Auto-detection mode:
    // 1. If code has content and syntax markers match a language with confidence, use it!
    if (contentDetection.detected) {
      return {
        ...contentDetection,
        filename: activeFile.name,
        isManual: false
      };
    }

    // 2. If no syntax markers found yet (e.g. empty or generic comments), fallback to file extension if recognized
    if (ext && extMap[ext]) {
      return {
        ...extMap[ext],
        filename: activeFile.name,
        detected: false,
        isManual: false
      };
    }

    // 3. Fallback default
    return {
      ...contentDetection,
      filename: activeFile.name,
      isManual: false
    };
  }, [activeFile.name, activeFile.code, manualLanguage]);

  const activeLanguage = detectedLangInfo.language;

  // Language change handler (from dropdown selector)
  const handleLanguageChange = (newLang) => {
    setManualLanguage(newLang);

    if (newLang === 'auto') {
      const detected = detectLanguage(activeFile.code);
      if (detected.detected) {
        const parts = activeFile.name.split('.');
        const base = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0];
        const properBase = (detected.language === 'java' && base.toLowerCase() === 'main') ? 'Main' : base;
        const newName = `${properBase}.${detected.extension}`;
        setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, name: newName, language: detected.language } : f));
      }
    } else {
      const extMap = {
        python: 'py',
        cpp: 'cpp',
        c: 'c',
        java: 'java',
        javascript: 'js',
        html: 'html'
      };
      const ext = extMap[newLang] || 'txt';
      const parts = activeFile.name.split('.');
      let base = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0];
      if (newLang === 'java' && base.toLowerCase() === 'main') base = 'Main';
      const newName = `${base}.${ext}`;

      setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, name: newName, language: newLang } : f));
    }
  };

  // Code change in active file with dynamic real-time language detection and auto-renaming
  const handleCodeChange = (newCode) => {
    const detected = detectLanguage(newCode);

    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        let updatedName = f.name;
        let updatedLang = f.language;

        // In auto-mode, dynamically update file extension and language according to detected code
        if (manualLanguage === 'auto' && detected.detected) {
          updatedLang = detected.language;
          const parts = f.name.split('.');
          const base = parts.length > 1 ? parts.slice(0, -1).join('.') : parts[0];
          const properBase = (detected.language === 'java' && base.toLowerCase() === 'main') ? 'Main' : base;
          updatedName = `${properBase}.${detected.extension}`;
        }

        return {
          ...f,
          name: updatedName,
          language: updatedLang,
          code: newCode,
          isModified: true
        };
      }
      return f;
    }));
  };

  // Switch active tab
  const handleSelectFile = (fileId) => {
    setActiveFileId(fileId);
    setSelectedLine(null);
  };

  // Create new file / scratchpad tab (adopts currently active language extension)
  const handleCreateFile = (type = 'file') => {
    const newId = `file-${Date.now()}`;
    const count = files.length + 1;
    const isScratch = type === 'scratchpad';
    const currentExt = detectedLangInfo?.extension || 'cpp';
    const currentLang = detectedLangInfo?.language || 'cpp';
    const base = isScratch ? `scratchpad_${count}` : `untitled_${count}`;
    const newName = `${base}.${currentExt}`;

    const newFile = {
      id: newId,
      name: newName,
      code: isScratch ? `// Scratchpad session ${count}\n` : '',
      language: currentLang,
      isModified: false
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  };

  // Close file tab
  const handleCloseFile = (fileId) => {
    if (files.length <= 1) return; // Keep at least one file

    const closingIndex = files.findIndex(f => f.id === fileId);
    const remainingFiles = files.filter(f => f.id !== fileId);
    setFiles(remainingFiles);

    if (activeFileId === fileId) {
      const nextIndex = Math.max(0, closingIndex - 1);
      setActiveFileId(remainingFiles[nextIndex].id);
    }
  };

  // Rename file
  const handleRenameFile = (fileId, newName) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const ext = newName.split('.').pop()?.toLowerCase();
        let lang = f.language;
        if (ext === 'py') lang = 'python';
        else if (ext === 'cpp' || ext === 'cc') lang = 'cpp';
        else if (ext === 'c') lang = 'c';
        else if (ext === 'java') lang = 'java';
        else if (ext === 'js') lang = 'javascript';
        else if (ext === 'html') lang = 'html';

        return { ...f, name: newName, language: lang };
      }
      return f;
    }));
  };

  // Load algorithm into new tab
  const handleOpenAlgorithmInNewTab = (fileName, algoCode, lang) => {
    const newId = `algo-${Date.now()}`;
    const newFile = {
      id: newId,
      name: fileName,
      code: algoCode,
      language: lang,
      isModified: false
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
    setTerminalEntries([]);
    setLastStats(null);
  };

  // Load algorithm into current tab
  const handleLoadAlgorithmIntoCurrent = (algoCode, lang) => {
    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        const ext = lang === 'python' ? 'py' : lang === 'cpp' ? 'cpp' : lang === 'java' ? 'java' : 'js';
        const base = f.name.split('.')[0] || 'algorithm';
        return {
          ...f,
          name: `${base}.${ext}`,
          code: algoCode,
          language: lang,
          isModified: true
        };
      }
      return f;
    }));
    setTerminalEntries([]);
    setLastStats(null);
  };

  // Listen for uploaded file
  useEffect(() => {
    const handleLoadCode = (e) => {
      if (e.detail) {
        if (typeof e.detail === 'object' && e.detail.content !== undefined) {
          const { content, name } = e.detail;
          const newId = `upload-${Date.now()}`;
          const newFile = {
            id: newId,
            name: name || 'uploaded_code.py',
            code: content,
            language: detectLanguage(content).language,
            isModified: false
          };
          setFiles(prev => [...prev, newFile]);
          setActiveFileId(newId);
        } else if (typeof e.detail === 'string') {
          handleCodeChange(e.detail);
        }
        setTerminalEntries([]);
        setLastStats(null);
      }
    };
    window.addEventListener('load_code', handleLoadCode);
    return () => window.removeEventListener('load_code', handleLoadCode);
  }, []);

  // Clear code in active file
  const handleClearCode = () => {
    handleCodeChange('');
    setTerminalEntries([]);
    setLastStats(null);
    setSelectedLine(null);
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
    }
  };

  // Format code via Monaco editor
  const handleFormatCode = () => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Stop current running process
  const handleStopProcess = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }));
    }
    setIsRunning(false);
  }, []);

  // Send interactive stdin input to running process
  const handleSendStdin = useCallback((text) => {
    setTerminalEntries(prev => [
      ...prev,
      { type: 'stdin', text: `${text}\n` }
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stdin',
        data: `${text}\n`
      }));
    }
  }, []);

  // Clear terminal stream
  const handleClearConsole = useCallback(() => {
    setTerminalEntries([]);
    setLastStats(null);
  }, []);

  // Fallback to HTTP runner if WebSocket fails
  const runHttpFallback = useCallback(async (codeToRun, lang) => {
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: codeToRun })
      });
      const data = await response.json();
      setTerminalEntries([
        { type: 'stdout', text: data.stdout || '' },
        ...(data.stderr ? [{ type: 'stderr', text: data.stderr }] : [])
      ]);
      setLastStats(data);
    } catch (err) {
      setTerminalEntries([
        { type: 'stderr', text: `[Execution failed]: ${err.message}\n` }
      ]);
      setLastStats({ code: 1, executionTime: 0, status: 'ERROR', runner: 'Network' });
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run Code with auto-detected language via live interactive WebSocket
  const handleRun = useCallback(() => {
    if (isRunning) return;

    const currentCode = activeFile.code;
    if (!currentCode || !currentCode.trim()) {
      setTerminalEntries([
        { type: 'stderr', text: 'Please enter code in the editor before running.\n' }
      ]);
      setLastStats({
        code: 1,
        executionTime: 0,
        status: 'ERROR',
        runner: 'Validator'
      });
      setRightPaneView('console');
      return;
    }

    // Close any previous socket
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
    }

    setIsRunning(true);
    setRightPaneView('console');
    setLastStats(null);
    setTerminalEntries([]);

    // Determine WebSocket endpoint
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDev = window.location.port === '5173';
    const wsUrl = isDev 
      ? `${protocol}//${window.location.hostname}:3001/api/terminal`
      : `${protocol}//${window.location.host}/api/terminal`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;
    } catch (e) {
      console.warn('WebSocket failed, using HTTP fallback:', e);
      runHttpFallback(currentCode, activeLanguage);
      return;
    }

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'run',
        language: activeLanguage,
        code: currentCode
      }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'stdout' || msg.type === 'stderr' || msg.type === 'system') {
          setTerminalEntries(prev => [...prev, { type: msg.type, text: msg.data }]);
        } else if (msg.type === 'exit') {
          setLastStats({
            code: msg.code,
            executionTime: msg.executionTime,
            status: msg.status || (msg.code === 0 ? 'SUCCESS' : 'ERROR'),
            runner: msg.runner || detectedLangInfo.name
          });
          setTerminalEntries(prev => [
            ...prev,
            {
              type: 'system',
              text: `\r\n[Process completed in ${msg.executionTime}ms with exit code ${msg.code}]\r\n`
            }
          ]);
          setIsRunning(false);
          try { socket.close(); } catch (e) {}
        }
      } catch (err) {
        console.error('Error handling terminal message:', err);
      }
    };

    socket.onerror = (err) => {
      console.warn('WebSocket encountered error, trying HTTP fallback', err);
      if (isRunning) {
        runHttpFallback(currentCode, activeLanguage);
      }
    };

    socket.onclose = () => {
      setIsRunning(false);
    };
  }, [isRunning, activeFile.code, activeLanguage, detectedLangInfo, runHttpFallback]);

  // Keyboard shortcut Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Jump to line in Monaco editor
  const handleSelectLine = (line) => {
    setSelectedLine(line);
    if (editorInstanceRef.current && line) {
      editorInstanceRef.current.revealLineInCenter(line);
      editorInstanceRef.current.setPosition({ lineNumber: line, column: 1 });
      editorInstanceRef.current.focus();
    }
  };

  return (
    <div className={`ide-root ${theme}`}>
      {/* Top Professional IDE Header */}
      <Navbar
        detectedLangInfo={detectedLangInfo}
        onRun={handleRun}
        isRunning={isRunning}
        onClearCode={handleClearCode}
        onFormatCode={handleFormatCode}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'vs-dark' ? 'vs-light' : 'vs-dark')}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        code={activeFile.code}
        activeFileName={activeFile.name}
        onOpenTemplates={() => setIsAlgorithmModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        selectedLanguage={manualLanguage}
        onSelectLanguage={handleLanguageChange}
      />

      {/* Main Workspace: Split Pane (Sidebar + Editor + Terminal / Flowchart) */}
      <main className="ide-workspace">
        {/* Workspace Files Sidebar (Collapsible) */}
        <FileSidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onCloseFile={handleCloseFile}
          onRenameFile={handleRenameFile}
          onOpenTemplates={() => setIsAlgorithmModalOpen(true)}
          isOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* Editor Section */}
        <section className="ide-editor-section">
          <EditorPanel
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
            onCreateFile={handleCreateFile}
            onOpenTemplates={() => setIsAlgorithmModalOpen(true)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            code={activeFile.code}
            onChange={handleCodeChange}
            language={activeLanguage}
            theme={theme}
            fontSize={fontSize}
            filename={activeFile.name}
            onMountEditor={(editor) => {
              editorInstanceRef.current = editor;
            }}
          />
        </section>

        {/* Right Side: View Switcher (Terminal / Graphical Flow / Web Preview) */}
        <section className="ide-terminal-section">
          {/* View Switcher Header Bar */}
          <div className="view-mode-bar">
            <div className="view-mode-tabs">
              <button
                className={`view-mode-btn ${rightPaneView === 'console' ? 'active' : ''}`}
                onClick={() => setRightPaneView('console')}
                id="btn-view-console"
              >
                <Terminal size={14} />
                <span>Compiler Terminal</span>
                {lastStats && (
                  <span className={`pill-badge ${lastStats.code === 0 ? 'success' : 'error'}`} />
                )}
              </button>

              <button
                className={`view-mode-btn ${rightPaneView === 'graphical' ? 'active' : ''}`}
                onClick={() => setRightPaneView('graphical')}
                id="btn-view-graphical"
              >
                <GitFork size={14} />
                <span>Graphical Flowchart</span>
              </button>

              {activeLanguage === 'html' && (
                <button
                  className={`view-mode-btn ${rightPaneView === 'preview' ? 'active' : ''}`}
                  onClick={() => setRightPaneView('preview')}
                  id="btn-view-preview"
                >
                  <Globe size={14} />
                  <span>Web Sandbox</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Pane Body */}
          <div className="right-pane-body">
            {rightPaneView === 'console' && (
              <ConsolePanel
                terminalEntries={terminalEntries}
                isRunning={isRunning}
                onSendStdin={handleSendStdin}
                onStopProcess={handleStopProcess}
                onClearConsole={handleClearConsole}
                onRun={handleRun}
                lastStats={lastStats}
                activeLanguage={activeLanguage}
              />
            )}

            {rightPaneView === 'graphical' && (
              <GraphicalView
                code={activeFile.code}
                language={activeLanguage}
                onSelectLine={handleSelectLine}
                selectedLine={selectedLine}
              />
            )}

            {rightPaneView === 'preview' && (
              <WebPreview code={activeFile.code} isRunning={isRunning} />
            )}
          </div>
        </section>
      </main>

      {/* Algorithm & Data Structures Template Library Modal */}
      <AlgorithmModal
        isOpen={isAlgorithmModalOpen}
        onClose={() => setIsAlgorithmModalOpen(false)}
        onOpenInNewTab={handleOpenAlgorithmInNewTab}
        onLoadIntoCurrent={handleLoadAlgorithmIntoCurrent}
        currentLanguage={activeLanguage}
      />
    </div>
  );
}
