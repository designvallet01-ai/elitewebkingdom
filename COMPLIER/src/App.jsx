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
import CollegeAdminPortal from './components/CollegeAdminPortal';
import SystemLockedOverlay from './components/SystemLockedOverlay';
import { 
  subscribeToCollegeEvents, 
  broadcastMessage, 
  updateSystemStatus, 
  getCurrentMachineSystem,
  autoBindCurrentMachine
} from './services/collegeService';
import { detectLanguage } from './services/languageDetector';
import { Terminal, GitFork, Globe, Code2, FolderTree, ShieldAlert, Lock } from 'lucide-react';

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

// Extract interactive input prompts (e.g. input("Enter your name: ")) from code
export const extractPromptsFromCode = (code, lang) => {
  if (!code) return [];
  const prompts = [];
  if (lang === 'python' || lang === 'py') {
    const regex = /input\s*\(\s*(?:(['"])(.*?)\1)?\s*\)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      prompts.push(match[2] !== undefined ? match[2] : '');
    }
  } else if (lang === 'cpp' || lang === 'c') {
    const cinCount = (code.match(/cin\s*>>/g) || []).length;
    const scanfCount = (code.match(/scanf\s*\(/g) || []).length;
    const total = cinCount + scanfCount;
    for (let i = 0; i < total; i++) {
      prompts.push('');
    }
  } else if (lang === 'java') {
    const scCount = (code.match(/\.next(Line|Int|Double|Float)?\s*\(/g) || []).length;
    for (let i = 0; i < scCount.length; i++) {
      prompts.push('');
    }
  }
  return prompts;
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
  
  // URL routing helper for /compilercollegeadmin
  const checkIsCollegeAdminUrl = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const search = window.location.search.toLowerCase();
    return (
      path.endsWith('compilercollegeadmin') ||
      path.includes('compilercollegeadmin') ||
      search.includes('portal=college-admin')
    );
  };

  const [isCollegeAdminPortalOpen, setIsCollegeAdminPortalOpen] = useState(checkIsCollegeAdminUrl);

  // Dedicated Kiosk Lock State (Activated when locked by admin, shows PIN input + Accept button ONLY)
  const [isSystemLocked, setIsSystemLocked] = useState(() => {
    try {
      return localStorage.getItem('elite_system_locked_active') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isFullscreenActive, setIsFullscreenActive] = useState(() => {
    return typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  });
  
  // Stdin & Inline Terminal Interactive Input State
  const [currentStdin, setCurrentStdin] = useState(() => {
    try {
      return localStorage.getItem('elite_ide_last_stdin_v1') || '';
    } catch (e) {
      return '';
    }
  });
  const [awaitingPrompt, setAwaitingPrompt] = useState(null);

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
  const runHttpFallback = useCallback(async (codeToRun, lang, customStdin = '', inlineContext = null) => {
    setIsRunning(true);
    setRightPaneView('console');
    setLastStats(null);
    if (!inlineContext) {
      setTerminalEntries([
        { type: 'system', text: `[Elite Engine]: Compiling & executing ${lang.toUpperCase()} code in cloud sandbox...\n` }
      ]);
    }

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
      if (inlineContext && inlineContext.answeredPrompts?.length) {
        // Authentically construct terminal stream: display prompt line + user response, then program output
        let remainingStdout = data.stdout || '';
        inlineContext.answeredPrompts.forEach((p, idx) => {
          const userInp = inlineContext.answeredInputs?.[idx] || '';
          entries.push({ type: 'stdout', text: `${p}${userInp}\n` });
          if (p && remainingStdout.includes(p)) {
            remainingStdout = remainingStdout.replace(p, '');
          }
        });
        if (remainingStdout.trim()) {
          const cleanRemaining = remainingStdout.startsWith('\n') ? remainingStdout.slice(1) : remainingStdout;
          entries.push({ type: 'stdout', text: cleanRemaining });
        }
      } else {
        if (data.stdout) {
          entries.push({ type: 'stdout', text: data.stdout });
        }
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

    // If customStdin was passed explicitly as string, execute directly
    if (typeof customStdin === 'string') {
      setCurrentStdin(customStdin);
      try { localStorage.setItem('elite_ide_last_stdin_v1', customStdin); } catch (e) {}
      setAwaitingPrompt(null);
      runHttpFallback(currentCode, activeLanguage, customStdin);
      return;
    }

    // Check if code has input statements (e.g. input("Enter your name: "))
    const prompts = extractPromptsFromCode(currentCode, activeLanguage);
    if (prompts.length > 0) {
      setRightPaneView('console');
      setLastStats(null);
      setTerminalEntries([
        { type: 'system', text: `[Elite Engine]: Compiling & executing ${activeLanguage.toUpperCase()} code...\n` }
      ]);
      setAwaitingPrompt({
        prompts,
        currentIndex: 0,
        collected: [],
        codeToRun: currentCode,
        language: activeLanguage
      });
      return;
    }

    // Otherwise run directly with empty stdin
    setAwaitingPrompt(null);
    runHttpFallback(currentCode, activeLanguage, '');
  }, [isRunning, activeFile.code, activeLanguage, isMobile, runHttpFallback]);

  // Handle submitting input from inline terminal input prompt
  const handleInlinePromptSubmit = useCallback((userInput) => {
    if (!awaitingPrompt) return;
    const { prompts, currentIndex, collected, codeToRun, language } = awaitingPrompt;
    const promptText = prompts[currentIndex] || '';

    // Echo input into terminal stream
    setTerminalEntries(prev => [
      ...prev,
      { type: 'stdout', text: `${promptText}${userInput}\n` }
    ]);

    const newCollected = [...collected, userInput];
    if (currentIndex + 1 < prompts.length) {
      setAwaitingPrompt(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        collected: newCollected
      }));
    } else {
      setAwaitingPrompt(null);
      const fullStdin = newCollected.join('\n') + '\n';
      setCurrentStdin(fullStdin);
      try { localStorage.setItem('elite_ide_last_stdin_v1', fullStdin); } catch (e) {}

      runHttpFallback(codeToRun, language, fullStdin, {
        answeredPrompts: prompts,
        answeredInputs: newCollected
      });
    }
  }, [awaitingPrompt, runHttpFallback]);

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
      const isNowFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreenActive(isNowFs);

      if (!isNowFs) {
        setCollegeViolations(v => {
          const next = v + 1;
          const bound = getCurrentMachineSystem();
          if (bound) {
            updateSystemStatus(bound.systemId, { violationsCount: next });
            broadcastMessage({
              type: 'VIOLATION_REPORTED',
              systemName: bound.systemName,
              studentRoll: bound.currentStudentRoll,
              reason: 'Exited Fullscreen Kiosk Mode'
            });
          }
          return next;
        });
        setCollegeModalState({ isOpen: true, mode: 'locked_screen' });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // 3. Tab switch / Window blur detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCollegeViolations(v => {
          const next = v + 1;
          const bound = getCurrentMachineSystem();
          if (bound) {
            updateSystemStatus(bound.systemId, { violationsCount: next });
            broadcastMessage({
              type: 'VIOLATION_REPORTED',
              systemName: bound.systemName,
              studentRoll: bound.currentStudentRoll,
              reason: 'Switched Browser Tab or Minimized'
            });
          }
          return next;
        });
        setCollegeModalState({ isOpen: true, mode: 'locked_screen' });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleWindowBlur = () => {
      setCollegeViolations(v => {
        const next = v + 1;
        const bound = getCurrentMachineSystem();
        if (bound) {
          updateSystemStatus(bound.systemId, { violationsCount: next });
          broadcastMessage({
            type: 'VIOLATION_REPORTED',
            systemName: bound.systemName,
            studentRoll: bound.currentStudentRoll,
            reason: 'Lost Window Focus / Switched Application'
          });
        }
        return next;
      });
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
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleSecurityKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isCollegeMode, isMobile]);

  // Helper function to trigger Direct Fullscreen with vendor fallbacks
  const requestSystemFullscreen = useCallback(() => {
    try {
      const el = document.documentElement;
      const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (rfs) {
        const p = rfs.call(el);
        if (p && typeof p.then === 'function') {
          p.then(() => setIsFullscreenActive(true)).catch((err) => {
            console.warn('Direct Fullscreen deferred for user click:', err);
          });
        } else {
          setIsFullscreenActive(true);
        }
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  }, []);

  // When college mode is active but browser hasn't entered fullscreen, listen for any interaction to enter fullscreen immediately
  useEffect(() => {
    if (!isCollegeMode || isFullscreenActive || isMobile) return;

    const enforceFullscreen = () => {
      if (!document.fullscreenElement) {
        requestSystemFullscreen();
      }
    };

    window.addEventListener('click', enforceFullscreen, true);
    window.addEventListener('pointerdown', enforceFullscreen, true);
    window.addEventListener('keydown', enforceFullscreen, true);

    return () => {
      window.removeEventListener('click', enforceFullscreen, true);
      window.removeEventListener('pointerdown', enforceFullscreen, true);
      window.removeEventListener('keydown', enforceFullscreen, true);
    };
  }, [isCollegeMode, isFullscreenActive, isMobile, requestSystemFullscreen]);

  // College Mode Activation Handler
  const handleActivateCollegeMode = useCallback((config) => {
    setCollegePin(config.pin);
    const info = {
      examName: config.examName || 'University Lab Practical Examination',
      studentRoll: config.studentRoll || 'LAB-STUDENT',
      studentName: config.studentName || 'Student'
    };
    setCollegeStudentInfo(info);
    setCollegeViolations(0);
    const now = Date.now();
    setCollegeStartTime(now);
    setIsCollegeMode(true);
    setIsSystemLocked(true);
    setCollegeModalState({ isOpen: false, mode: 'setup' });
    setIsCollegeAdminPortalOpen(false);

    try {
      localStorage.setItem('elite_college_exam_active', 'true');
      localStorage.setItem('elite_system_locked_active', 'true');
      localStorage.setItem('elite_college_exam_pin', config.pin);
      localStorage.setItem('elite_college_exam_info', JSON.stringify({ ...info, startTime: now }));
    } catch (e) {}

    // Update bound system status if registered
    const bound = getCurrentMachineSystem();
    if (bound) {
      updateSystemStatus(bound.systemId, {
        status: 'locked',
        currentStudentRoll: info.studentRoll,
        currentStudentName: info.studentName,
        currentExamName: info.examName,
        examStartTime: now,
        violationsCount: 0,
        currentLockPin: config.pin
      });
    }

    // DIRECT FULLSCREEN TRIGGER
    requestSystemFullscreen();
  }, [requestSystemFullscreen]);

  // College Mode Deactivation Handler
  const handleDeactivateCollegeMode = useCallback(() => {
    setIsCollegeMode(false);
    setIsSystemLocked(false);
    setIsFullscreenActive(false);
    setCollegeModalState({ isOpen: true, mode: 'summary' });

    try {
      localStorage.removeItem('elite_college_exam_active');
      localStorage.removeItem('elite_system_locked_active');
      localStorage.removeItem('elite_college_exam_pin');
      localStorage.removeItem('elite_college_exam_info');
    } catch (e) {}

    const bound = getCurrentMachineSystem();
    if (bound) {
      updateSystemStatus(bound.systemId, {
        status: 'idle',
        currentExamName: '',
        examStartTime: null
      });
    }

    // Exit Browser Fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Handle unlock when student/invigilator enters correct PIN and clicks Accept in SystemLockedOverlay
  const handleUnlockFromSystemLock = useCallback(() => {
    setIsSystemLocked(false);
    setIsCollegeMode(false);
    setIsFullscreenActive(false);

    try {
      localStorage.removeItem('elite_system_locked_active');
      localStorage.removeItem('elite_college_exam_active');
      localStorage.removeItem('elite_college_exam_pin');
      localStorage.removeItem('elite_college_exam_info');
    } catch (e) {}

    const bound = getCurrentMachineSystem();
    if (bound) {
      updateSystemStatus(bound.systemId, {
        status: 'idle',
        currentExamName: '',
        examStartTime: null
      });

      broadcastMessage({
        type: 'TARGET_UNLOCK',
        targetSystemId: bound.systemId,
        collegeId: bound.collegeId,
        systemName: bound.systemName
      });
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }, []);

  // Navigation helpers for College Admin Portal at /compilercollegeadmin
  const handleOpenCollegeAdmin = useCallback(() => {
    setIsCollegeAdminPortalOpen(true);
    if (typeof window !== 'undefined' && !window.location.pathname.includes('compilercollegeadmin')) {
      window.history.pushState(null, '', '/compilercollegeadmin');
    }
  }, []);

  const handleCloseCollegeAdmin = useCallback(() => {
    setIsCollegeAdminPortalOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname.includes('compilercollegeadmin')) {
      window.history.pushState(null, '', '/compiler');
    }
  }, []);

  // Sync popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      setIsCollegeAdminPortalOpen(checkIsCollegeAdminUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-bind current machine as a registered lab PC on mount so it's visible in admin portal
  useEffect(() => {
    autoBindCurrentMachine();
  }, []);

  // Listen to remote Broadcast Commands from College Admin Portal
  useEffect(() => {
    const unsubscribe = subscribeToCollegeEvents((msg) => {
      if (!msg) return;

      if (msg.type === 'TARGET_LOCKDOWN' || msg.type === 'BROADCAST_LOCKDOWN') {
        const bound = getCurrentMachineSystem();

        if (msg.type === 'TARGET_LOCKDOWN') {
          if (!bound || (bound.systemId !== msg.targetSystemId && bound.systemName !== msg.targetSystemId)) {
            return;
          }
        }

        if (msg.type === 'BROADCAST_LOCKDOWN') {
          if (bound && bound.collegeId !== msg.collegeId) {
            return;
          }
        }

        // Close Admin Portal & setup modal on this machine
        setIsCollegeAdminPortalOpen(false);
        setCollegeModalState({ isOpen: false, mode: 'setup' });

        const lockPin = String(msg.pin || '1234').trim();
        setCollegePin(lockPin);
        setIsSystemLocked(true);

        // Activate College Mode & Direct Fullscreen
        handleActivateCollegeMode({
          pin: lockPin,
          examName: msg.examName || 'University Lab Practical Examination',
          studentRoll: bound?.currentStudentRoll || 'LAB-STUDENT',
          studentName: bound?.currentStudentName || 'Student'
        });
      }

      if (msg.type === 'TARGET_UNLOCK' || msg.type === 'BROADCAST_UNLOCK') {
        const bound = getCurrentMachineSystem();

        if (msg.type === 'TARGET_UNLOCK') {
          if (!bound || (bound.systemId !== msg.targetSystemId && bound.systemName !== msg.targetSystemId)) {
            return;
          }
        }

        if (msg.type === 'BROADCAST_UNLOCK') {
          if (bound && bound.collegeId !== msg.collegeId) {
            return;
          }
        }

        setIsSystemLocked(false);
        try {
          localStorage.removeItem('elite_system_locked_active');
        } catch (e) {}

        handleDeactivateCollegeMode();
      }
    });

    return () => unsubscribe();
  }, [handleActivateCollegeMode, handleDeactivateCollegeMode]);

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
                awaitingPrompt={awaitingPrompt}
                onInlinePromptSubmit={handleInlinePromptSubmit}
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
        onOpenAdminPortal={() => {
          setCollegeModalState({ isOpen: false, mode: 'setup' });
          handleOpenCollegeAdmin();
        }}
        currentPin={collegePin}
        violationsCount={collegeViolations}
        studentInfo={collegeStudentInfo}
        examDuration={collegeStartTime ? Math.floor((Date.now() - collegeStartTime) / 1000) : 0}
        code={activeFile.code}
      />

      {/* Separate College Admin Portal */}
      <CollegeAdminPortal
        isOpen={isCollegeAdminPortalOpen}
        onClose={handleCloseCollegeAdmin}
        onLockSystemFromPortal={(config) => handleActivateCollegeMode(config)}
        onUnlockSystemFromPortal={() => handleDeactivateCollegeMode()}
      />

      {/* Strict System Locked Overlay (Only PIN Text and Accept Button) */}
      <SystemLockedOverlay
        isLocked={isSystemLocked}
        correctPin={collegePin}
        onUnlock={handleUnlockFromSystemLock}
      />

      {/* Direct Fullscreen Enforcer Takeover Screen (Desktop Only) */}
      {isCollegeMode && !isMobile && !isFullscreenActive && (
        <div 
          className="college-fullscreen-takeover"
          onClick={requestSystemFullscreen}
          onPointerDown={requestSystemFullscreen}
          role="dialog"
          aria-modal="true"
        >
          <div className="takeover-box">
            <div className="takeover-radar">
              <ShieldAlert size={52} className="takeover-icon" />
            </div>
            <h2 className="takeover-title">🔒 COLLEGE EXAM LOCKDOWN ACTIVATED</h2>
            <p className="takeover-desc">
              The College Administrator has placed this lab terminal into strict Exam Kiosk Mode.
            </p>
            <div className="takeover-action-prompt">
              <span className="takeover-pulse-circle"></span>
              <span>CLICK ANYWHERE ON SCREEN TO ENTER FULLSCREEN MODE</span>
            </div>
            <button 
              type="button" 
              className="takeover-launch-btn"
              onClick={requestSystemFullscreen}
              id="btn-takeover-fullscreen"
            >
              Enter Fullscreen Exam Now ➔
            </button>
            <p className="takeover-fineprint">
              ⚠️ Note: Exiting fullscreen, switching tabs (Alt+Tab), or inspecting code will be reported to the College Admin Portal as a cheating violation.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
