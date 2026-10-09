import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import EditorPanel from './components/EditorPanel';
import ConsolePanel from './components/ConsolePanel';
import GraphicalView from './components/GraphicalView';
import WebPreview from './components/WebPreview';
import FileSidebar from './components/FileSidebar';
import AlgorithmModal from './components/AlgorithmModal';
import MobileAccessoryBar from './components/MobileAccessoryBar';
import CollegeModeModal from './components/CollegeModeModal';
import CollegeExamBanner from './components/CollegeExamBanner';
import ProgramInputModal from './components/ProgramInputModal';
import { detectLanguage } from './services/languageDetector';
import { Terminal, GitFork, Globe, Code2, FolderTree } from 'lucide-react';

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

// Detect if source code contains interactive input statements
const codeNeedsInput = (code, lang) => {
  if (!code) return false;
  switch (lang) {
    case 'python':
    case 'py':
      return /input\s*\(|sys\.stdin/m.test(code);
    case 'cpp':
    case 'c':
      return /cin\s*>>|scanf\s*\(|getchar\s*\(|getline\s*\(|fgets\s*\(/m.test(code);
    case 'java':
      return /Scanner\s*|System\.in|readLine\s*\(/m.test(code);
    case 'javascript':
    case 'js':
      return /prompt\s*\(|readline/m.test(code);
    default:
      return false;
  }
};

export default function App() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [mobileActiveTab, setMobileActiveTab] = useState('editor'); // 'editor' | 'terminal' | 'graphical' | 'preview'

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
      if (typeof window !== 'undefined' && window.innerWidth <= 768) return false;
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
  
  // College Exam Lockdown Mode State (Desktop Only)
  const [isCollegeMode, setIsCollegeMode] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) return false;
      return localStorage.getItem('elite_college_exam_active') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [collegePin, setCollegePin] = useState(() => {
    try {
      return localStorage.getItem('elite_college_exam_pin') || '1234';
    } catch (e) {
      return '1234';
    }
  });
  const [collegeStudentInfo, setCollegeStudentInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('elite_college_exam_info');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { examName: 'College Lab Exam', studentRoll: '', studentName: '' };
  });
  const [collegeViolations, setCollegeViolations] = useState(0);
  const [collegeStartTime, setCollegeStartTime] = useState(() => {
    try {
      const saved = localStorage.getItem('elite_college_exam_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.startTime) return parsed.startTime;
      }
    } catch (e) {}
    return null;
  });
  const [collegeModalState, setCollegeModalState] = useState({ isOpen: false, mode: 'setup' });
  
  // Stdin & Input Modal State
  const [currentStdin, setCurrentStdin] = useState(() => {
    try {
      return localStorage.getItem('elite_ide_last_stdin_v1') || '';
    } catch (e) {
      return '';
    }
  });
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  const editorInstanceRef = useRef(null);
  const wsRef = useRef(null);

  // Mobile viewport resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (editorInstanceRef.current) {
        editorInstanceRef.current.layout();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When switching views on mobile, trigger Monaco layout recalculation
  useEffect(() => {
    if (mobileActiveTab === 'editor' && editorInstanceRef.current) {
      const t = setTimeout(() => {
        editorInstanceRef.current?.layout();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [mobileActiveTab]);

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
    if (isMobile) {
      setIsSidebarOpen(false);
      setMobileActiveTab('editor');
    }
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

  // Robust Cloud & Local Code Runner with Stdin Support
  const runHttpFallback = useCallback(async (codeToRun, lang, customStdin = '') => {
    setIsRunning(true);
    setRightPaneView('console');
    setLastStats(null);
    setTerminalEntries([
      { type: 'system', text: `[Elite Engine]: Compiling & executing ${lang.toUpperCase()} code in cloud sandbox...\n` }
    ]);

    try {
      // 1. If HTML / Web sandbox, switch to preview
      if (lang === 'html') {
        setRightPaneView('preview');
        setTerminalEntries([
          { type: 'system', text: '[Web Preview]: Rendering HTML, CSS & JavaScript in live browser canvas...\n' }
        ]);
        setLastStats({ code: 0, executionTime: 5, status: 'SUCCESS', runner: 'Browser DOM Sandbox' });
        setIsRunning(false);
        return;
      }

      let data;
      try {
        const response = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang, code: codeToRun, stdin: customStdin || '' })
        });
        if (!response.ok) {
          throw new Error(`Server status ${response.status}`);
        }
        data = await response.json();
      } catch (apiErr) {
        console.warn('Local /api/run unavailable, engaging direct Cloud Judge0 fallback:', apiErr);
        // Direct Judge0 CE fallback
        const JUDGE0_MAP = {
          cpp: { id: 105, name: 'C++ (GCC 14.1)' },
          c: { id: 50, name: 'C (GCC 9.2)' },
          python: { id: 92, name: 'Python (3.11.2)' },
          java: { id: 91, name: 'Java (OpenJDK 17)' },
          javascript: { id: 102, name: 'JavaScript (Node.js 22)' },
          typescript: { id: 101, name: 'TypeScript (5.6.2)' }
        };
        const target = JUDGE0_MAP[lang] || JUDGE0_MAP['python'];
        let src = codeToRun;
        if (lang === 'java' && !src.includes('class ')) {
          src = `public class Main {\n    public static void main(String[] args) {\n${src}\n    }\n}`;
        }
        const directRes = await fetch('https://ce.judge0.com/submissions?wait=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language_id: target.id, source_code: src, stdin: customStdin || '' })
        });
        const judgeData = await directRes.json();
        const isSuccess = judgeData.status?.id === 3;
        data = {
          stdout: judgeData.stdout || '',
          stderr: judgeData.compile_output || judgeData.stderr || (isSuccess ? '' : judgeData.status?.description || ''),
          code: isSuccess ? 0 : 1,
          executionTime: judgeData.time ? Math.round(parseFloat(judgeData.time) * 1000) : 15,
          status: isSuccess ? 'SUCCESS' : (judgeData.status?.id === 6 ? 'COMPILE_ERROR' : 'RUNTIME_ERROR'),
          runner: `Elite Cloud (${target.name})`
        };
      }

      const entries = [];
      if (data.stdout) {
        entries.push({ type: 'stdout', text: data.stdout });
      }
      if (data.stderr) {
        entries.push({ type: 'stderr', text: data.stderr });
      }
      if (!data.stdout && !data.stderr) {
        entries.push({ type: 'system', text: '[Execution completed with no console output]\n' });
      }
      entries.push({
        type: 'system',
        text: `\r\n[Process completed in ${data.executionTime || 0}ms with exit code ${data.code || 0}]\r\n`
      });

      setTerminalEntries(entries);
      setLastStats(data);
    } catch (err) {
      // In-browser JavaScript execution fallback if offline
      if (lang === 'javascript') {
        try {
          const logs = [];
          const customConsole = {
            log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
            warn: (...args) => logs.push('[WARN] ' + args.join(' '))
          };
          const fn = new Function('console', codeToRun);
          fn(customConsole);
          setTerminalEntries([
            { type: 'stdout', text: (logs.join('\n') || '[Finished without output]') + '\n' },
            { type: 'system', text: '\r\n[Executed in Browser JavaScript Engine]\r\n' }
          ]);
          setLastStats({ code: 0, executionTime: 3, status: 'SUCCESS', runner: 'Browser V8 Engine' });
          return;
        } catch (jsErr) {
          setTerminalEntries([
            { type: 'stderr', text: `[JavaScript Error]: ${jsErr.message}\n` }
          ]);
          setLastStats({ code: 1, executionTime: 0, status: 'ERROR', runner: 'Browser V8 Engine' });
          return;
        }
      }

      setTerminalEntries([
        { type: 'stderr', text: `[Execution failed]: ${err.message}\nPlease check your network connection or try again.\n` }
      ]);
      setLastStats({ code: 1, executionTime: 0, status: 'ERROR', runner: 'Network' });
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run Code with auto-detected language & optional custom standard input (stdin)
  const handleRun = useCallback((customStdin) => {
    if (isRunning) return;

    const currentCode = activeFile.code;
    const stdinToUse = typeof customStdin === 'string' ? customStdin : '';

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

    // If language is HTML, render live WebPreview immediately
    if (activeLanguage === 'html') {
      setRightPaneView('preview');
      if (isMobile) setMobileActiveTab('preview');
      setTerminalEntries([
        { type: 'system', text: '[Web Preview]: Rendering HTML & CSS in live browser canvas...\n' }
      ]);
      setLastStats({ code: 0, executionTime: 5, status: 'SUCCESS', runner: 'Browser DOM Sandbox' });
      return;
    }

    if (isMobile) {
      setMobileActiveTab('terminal');
    }

    // Determine stdin to pass to program
    let finalStdin = '';
    if (typeof customStdin === 'string') {
      finalStdin = customStdin;
      setCurrentStdin(customStdin);
      try { localStorage.setItem('elite_ide_last_stdin_v1', customStdin); } catch (e) {}
    } else if (currentStdin) {
      finalStdin = currentStdin;
    } else if (codeNeedsInput(currentCode, activeLanguage)) {
      // Prompt user for input so program doesn't crash with EOFError
      setIsInputModalOpen(true);
      return;
    }

    // Check if running in local dev with dev server
    const isLocalDev = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '5173';

    if (isLocalDev) {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }

      setIsRunning(true);
      setRightPaneView('console');
      setLastStats(null);
      setTerminalEntries([]);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:3001/api/terminal`;

      let socket;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;
      } catch (e) {
        runHttpFallback(currentCode, activeLanguage, finalStdin);
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

      socket.onerror = () => {
        runHttpFallback(currentCode, activeLanguage, finalStdin);
      };

      socket.onclose = () => {
        setIsRunning(false);
      };
    } else {
      // In production / Web, directly invoke the Cloud HTTP execution pipeline with stdin
      runHttpFallback(currentCode, activeLanguage, finalStdin);
    }
  }, [isRunning, activeFile.code, activeLanguage, detectedLangInfo, runHttpFallback, isMobile, currentStdin]);

  // Handle submitting input from ProgramInputModal
  const handleInputModalSubmit = (inputVal) => {
    setIsInputModalOpen(false);
    setCurrentStdin(inputVal);
    try {
      localStorage.setItem('elite_ide_last_stdin_v1', inputVal);
    } catch (e) {}
    runHttpFallback(activeFile.code, activeLanguage, inputVal);
  };

  const handleInputModalSkip = () => {
    setIsInputModalOpen(false);
    runHttpFallback(activeFile.code, activeLanguage, '');
  };

  // College Exam Mode Anti-Cheating & Lockdown Event Listeners (Desktop Only)
  useEffect(() => {
    if (!isCollegeMode || isMobile) return;

    // 1. Prevent leaving / reloading page
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'College Exam Session is active! Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Fullscreen change detection (Esc or exiting fullscreen)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setCollegeViolations(v => v + 1);
        setCollegeModalState({ isOpen: true, mode: 'locked_screen' });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 3. Tab switch / Window blur detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCollegeViolations(v => v + 1);
        setCollegeModalState({ isOpen: true, mode: 'locked_screen' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleWindowBlur = () => {
      setCollegeViolations(v => v + 1);
      setCollegeModalState({ isOpen: true, mode: 'locked_screen' });
    };
    window.addEventListener('blur', handleWindowBlur);

    // 4. Block Developer Tools & Bypass shortcuts
    const handleSecurityKeyDown = (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      if (e.key === 'F5' || (e.ctrlKey && ['r', 'R'].includes(e.key))) {
        e.preventDefault();
        return false;
      }
    };
    window.addEventListener('keydown', handleSecurityKeyDown, true);

    // 5. Disable context menu during College Exam
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleSecurityKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isCollegeMode, isMobile]);

  // College Mode Activation Handler
  const handleActivateCollegeMode = useCallback((config) => {
    setCollegePin(config.pin);
    const info = {
      examName: config.examName,
      studentRoll: config.studentRoll,
      studentName: config.studentName
    };
    setCollegeStudentInfo(info);
    setCollegeViolations(0);
    const now = Date.now();
    setCollegeStartTime(now);
    setIsCollegeMode(true);
    setCollegeModalState({ isOpen: false, mode: 'setup' });

    try {
      localStorage.setItem('elite_college_exam_active', 'true');
      localStorage.setItem('elite_college_exam_pin', config.pin);
      localStorage.setItem('elite_college_exam_info', JSON.stringify({ ...info, startTime: now }));
    } catch (e) {}

    // Enter Browser Fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // College Mode Deactivation Handler
  const handleDeactivateCollegeMode = useCallback(() => {
    setIsCollegeMode(false);
    setCollegeModalState({ isOpen: true, mode: 'summary' });

    try {
      localStorage.removeItem('elite_college_exam_active');
      localStorage.removeItem('elite_college_exam_pin');
      localStorage.removeItem('elite_college_exam_info');
    } catch (e) {}

    // Exit Browser Fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, []);

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

  // Mobile Code Accessory Bar Actions
  const handleInsertText = useCallback((text) => {
    if (!editorInstanceRef.current) return;
    const editor = editorInstanceRef.current;
    const selection = editor.getSelection();
    if (!selection) return;

    const isPair = ['()', '{}', '[]', '""', "''"].includes(text);

    const op = {
      identifier: { major: 1, minor: 1 },
      range: selection,
      text: text,
      forceMoveMarkers: true
    };
    editor.executeEdits('mobile-accessory', [op]);

    if (isPair) {
      const pos = editor.getPosition();
      if (pos) {
        editor.setPosition({ lineNumber: pos.lineNumber, column: pos.column - 1 });
      }
    }
    editor.focus();
  }, []);

  const handleUndo = useCallback(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.trigger('mobile-accessory', 'undo');
      editorInstanceRef.current.focus();
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.trigger('mobile-accessory', 'redo');
      editorInstanceRef.current.focus();
    }
  }, []);

  const handleEnter = useCallback(() => {
    if (editorInstanceRef.current) {
      const editor = editorInstanceRef.current;
      const selection = editor.getSelection();
      if (!selection) return;
      const op = {
        identifier: { major: 1, minor: 1 },
        range: selection,
        text: '\n',
        forceMoveMarkers: true
      };
      editor.executeEdits('mobile-accessory', [op]);
      editor.focus();
    }
  }, []);

  return (
    <div className={`ide-root ${theme} ${isMobile ? 'is-mobile-device' : ''}`}>
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
        isMobile={isMobile}
        isCollegeMode={isCollegeMode}
        onOpenCollegeMode={() => setCollegeModalState({ isOpen: true, mode: 'setup' })}
        onExitCollegeMode={() => setCollegeModalState({ isOpen: true, mode: 'unlock' })}
      />

      {/* College Exam Active Banner (Desktop Only) */}
      {isCollegeMode && !isMobile && (
        <CollegeExamBanner
          studentInfo={collegeStudentInfo}
          violationsCount={collegeViolations}
          startTime={collegeStartTime}
          onOpenExitModal={() => setCollegeModalState({ isOpen: true, mode: 'unlock' })}
        />
      )}

      {/* Main Workspace: Split Pane on Desktop, Tabbed Switcher on Mobile */}
      <main className="ide-workspace">
        {/* Mobile Backdrop for Sidebar Drawer */}
        {isMobile && isSidebarOpen && (
          <div 
            className="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close files sidebar overlay"
          />
        )}

        {/* Workspace Files Sidebar (Drawer overlay on Mobile, Left pane on Desktop) */}
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
          isMobile={isMobile}
        />

        {/* Editor Section */}
        <section className={`ide-editor-section ${isMobile && mobileActiveTab !== 'editor' ? 'mobile-hidden' : ''}`}>
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
            isMobile={isMobile}
            onMountEditor={(editor) => {
              editorInstanceRef.current = editor;
            }}
          />
        </section>

        {/* Right Side: View Switcher (Terminal / Graphical Flow / Web Preview) */}
        <section className={`ide-terminal-section ${isMobile && mobileActiveTab === 'editor' ? 'mobile-hidden' : ''}`}>
          {/* View Switcher Header Bar (Desktop Only) */}
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
                isMobile={isMobile}
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

      {/* Mobile Code Typing Accessory Bar (Symbols, Tab, Undo/Redo) */}
      {isMobile && mobileActiveTab === 'editor' && (
        <MobileAccessoryBar
          onInsertText={handleInsertText}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onEnter={handleEnter}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      {isMobile && (
        <nav className="mobile-view-tabs" aria-label="Mobile workspace view tabs">
          <button
            className={`mobile-tab-btn ${mobileActiveTab === 'editor' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('editor')}
            id="mobile-tab-editor"
          >
            <Code2 size={16} />
            <span>Code</span>
          </button>

          <button
            className={`mobile-tab-btn ${mobileActiveTab === 'terminal' ? 'active' : ''}`}
            onClick={() => { setMobileActiveTab('terminal'); setRightPaneView('console'); }}
            id="mobile-tab-terminal"
          >
            <Terminal size={16} />
            <span>Terminal</span>
            {lastStats && (
              <span className={`mobile-tab-dot ${lastStats.code === 0 ? 'success' : 'error'}`} />
            )}
          </button>

          <button
            className={`mobile-tab-btn ${mobileActiveTab === 'graphical' ? 'active' : ''}`}
            onClick={() => { setMobileActiveTab('graphical'); setRightPaneView('graphical'); }}
            id="mobile-tab-flowchart"
          >
            <GitFork size={16} />
            <span>Flowchart</span>
          </button>

          {activeLanguage === 'html' && (
            <button
              className={`mobile-tab-btn ${mobileActiveTab === 'preview' ? 'active' : ''}`}
              onClick={() => { setMobileActiveTab('preview'); setRightPaneView('preview'); }}
              id="mobile-tab-preview"
            >
              <Globe size={16} />
              <span>Preview</span>
            </button>
          )}

          <button
            className={`mobile-tab-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsSidebarOpen(prev => !prev)}
            id="mobile-tab-files"
          >
            <FolderTree size={16} />
            <span>Files</span>
          </button>
        </nav>
      )}

      {/* Algorithm & Data Structures Template Library Modal */}
      <AlgorithmModal
        isOpen={isAlgorithmModalOpen}
        onClose={() => setIsAlgorithmModalOpen(false)}
        onOpenInNewTab={handleOpenAlgorithmInNewTab}
        onLoadIntoCurrent={handleLoadAlgorithmIntoCurrent}
        currentLanguage={activeLanguage}
      />

      {/* College Exam Mode Setup / PIN Exit / Security Lockdown Modal */}
      <CollegeModeModal
        isOpen={collegeModalState.isOpen}
        mode={collegeModalState.mode}
        onClose={() => setCollegeModalState({ isOpen: false, mode: 'setup' })}
        onActivateCollegeMode={handleActivateCollegeMode}
        onDeactivateCollegeMode={handleDeactivateCollegeMode}
        currentPin={collegePin}
        violationsCount={collegeViolations}
        studentInfo={collegeStudentInfo}
        examDuration={collegeStartTime ? Math.floor((Date.now() - collegeStartTime) / 1000) : 0}
        code={activeFile.code}
      />

      {/* Program Input (Stdin) Modal */}
      <ProgramInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSubmitInput={handleInputModalSubmit}
        onSkip={handleInputModalSkip}
        code={activeFile.code}
        language={activeLanguage}
        savedStdin={currentStdin}
      />
    </div>
  );
}
