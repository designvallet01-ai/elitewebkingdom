import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Play, 
  Code2, 
  Sparkles, 
  Share2, 
  Download, 
  Trash2, 
  Sun, 
  Moon, 
  Terminal, 
  Languages, 
  FileCheck2, 
  Laptop, 
  GitFork, 
  FlaskConical, 
  Database, 
  GitCommit, 
  FolderTree, 
  BookOpen,
  ArrowRight,
  X,
  Keyboard
} from 'lucide-react';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onRun,
  onClearConsole,
  onFormatCode,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onOpenTemplates,
  onOpenAiExplainer,
  onOpenLabReport,
  onOpenTranspiler,
  onOpenCollegeMode,
  onOpenShareCode,
  onChangeRightPaneView,
  onSelectLanguage,
  onDownloadCode
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const ALL_ACTIONS = useMemo(() => [
    // Execution & Terminal
    {
      id: 'run-code',
      title: 'Run Code',
      shortcut: 'Ctrl + Enter',
      category: 'Execution',
      icon: <Play size={16} className="text-emerald" />,
      action: () => { onRun?.(); }
    },
    {
      id: 'format-code',
      title: 'Format Code (Prettify)',
      shortcut: 'Shift + Alt + F',
      category: 'Editor',
      icon: <Code2 size={16} className="text-cyan" />,
      action: () => { onFormatCode?.(); }
    },
    {
      id: 'clear-console',
      title: 'Clear Execution Terminal',
      shortcut: 'Ctrl + L',
      category: 'Terminal',
      icon: <Trash2 size={16} className="text-amber" />,
      action: () => { onClearConsole?.(); }
    },
    // Simulators & Tools
    {
      id: 'view-console',
      title: 'Open Execution Terminal / Stdout',
      category: 'Simulators',
      icon: <Terminal size={16} className="text-emerald" />,
      action: () => { onChangeRightPaneView?.('console'); }
    },
    {
      id: 'view-flowchart',
      title: 'Open ISO Flowchart Visualizer',
      category: 'Simulators',
      icon: <GitFork size={16} className="text-cyan" />,
      action: () => { onChangeRightPaneView?.('graphical'); }
    },
    {
      id: 'view-testcases',
      title: 'Open CP Judge Arena (Multi-TestCase Runner)',
      category: 'Simulators',
      icon: <FlaskConical size={16} className="text-amber" />,
      action: () => { onChangeRightPaneView?.('testcases'); }
    },
    {
      id: 'view-memory',
      title: 'Open 3D Memory Matrix & Pointer Simulator',
      category: 'Simulators',
      icon: <Database size={16} className="text-purple" />,
      action: () => { onChangeRightPaneView?.('memory'); }
    },
    {
      id: 'view-recursion',
      title: 'Open Recursion Call Stack Frame Visualizer',
      category: 'Simulators',
      icon: <GitCommit size={16} className="text-pink" />,
      action: () => { onChangeRightPaneView?.('recursion'); }
    },
    // AI & Academic
    {
      id: 'ai-auditor',
      title: 'AI Logic Breakdown & Big-O Auditor',
      category: 'AI & Analysis',
      icon: <Sparkles size={16} className="text-purple" />,
      action: () => { onOpenAiExplainer?.(); }
    },
    {
      id: 'transpiler',
      title: 'Polyglot Code Transpiler (Convert Code)',
      category: 'AI & Analysis',
      icon: <Languages size={16} className="text-cyan" />,
      action: () => { onOpenTranspiler?.(); }
    },
    {
      id: 'lab-record',
      title: 'Generate University Lab Practical Record PDF',
      category: 'Academic',
      icon: <FileCheck2 size={16} className="text-emerald" />,
      action: () => { onOpenLabReport?.(); }
    },
    {
      id: 'college-mode',
      title: 'College Exam Kiosk Lockdown Mode',
      category: 'Academic',
      icon: <Laptop size={16} className="text-amber" />,
      action: () => { onOpenCollegeMode?.(); }
    },
    // Workspace & Share
    {
      id: 'share-code',
      title: 'Share Code Snippet (WhatsApp / URL Link)',
      shortcut: 'Share',
      category: 'Collaboration',
      icon: <Share2 size={16} className="text-cyan" />,
      action: () => { onOpenShareCode?.(); }
    },
    {
      id: 'code-templates',
      title: 'Algorithm & Data Structure Templates Library',
      category: 'Templates',
      icon: <BookOpen size={16} className="text-amber" />,
      action: () => { onOpenTemplates?.(); }
    },
    {
      id: 'toggle-sidebar',
      title: 'Toggle File Tree Explorer Sidebar',
      shortcut: 'Ctrl + B',
      category: 'Workspace',
      icon: <FolderTree size={16} className="text-slate" />,
      action: () => { onToggleSidebar?.(); }
    },
    {
      id: 'toggle-theme',
      title: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Appearance',
      icon: theme === 'dark' ? <Sun size={16} className="text-amber" /> : <Moon size={16} className="text-indigo" />,
      action: () => { onToggleTheme?.(); }
    },
    {
      id: 'download-code',
      title: 'Download Source Code File',
      category: 'File',
      icon: <Download size={16} className="text-emerald" />,
      action: () => { onDownloadCode?.(); }
    },
    // Quick Language Switching
    {
      id: 'lang-python',
      title: 'Switch Language to Python 3',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-amber" />,
      action: () => { onSelectLanguage?.('python'); }
    },
    {
      id: 'lang-cpp',
      title: 'Switch Language to C++ (GCC 14)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-cyan" />,
      action: () => { onSelectLanguage?.('cpp'); }
    },
    {
      id: 'lang-c',
      title: 'Switch Language to C (GCC 14)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-indigo" />,
      action: () => { onSelectLanguage?.('c'); }
    },
    {
      id: 'lang-java',
      title: 'Switch Language to Java (JDK 17)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-red" />,
      action: () => { onSelectLanguage?.('java'); }
    },
    {
      id: 'lang-js',
      title: 'Switch Language to JavaScript (Node.js)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-amber" />,
      action: () => { onSelectLanguage?.('javascript'); }
    },
    {
      id: 'lang-rust',
      title: 'Switch Language to Rust (Cargo)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-orange" />,
      action: () => { onSelectLanguage?.('rust'); }
    },
    {
      id: 'lang-go',
      title: 'Switch Language to Go (Golang)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-cyan" />,
      action: () => { onSelectLanguage?.('go'); }
    },
    {
      id: 'lang-sql',
      title: 'Switch Language to SQL (SQLite 3)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-blue" />,
      action: () => { onSelectLanguage?.('sql'); }
    },
    {
      id: 'lang-jdbc',
      title: 'Switch Language to Java (JDBC Database)',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-orange" />,
      action: () => { onSelectLanguage?.('jdbc'); }
    },
    {
      id: 'lang-html',
      title: 'Switch Language to HTML / Web Sandbox',
      category: 'Language Switcher',
      icon: <Code2 size={16} className="text-orange" />,
      action: () => { onSelectLanguage?.('html'); }
    }
  ], [
    theme, 
    onRun, 
    onFormatCode, 
    onClearConsole, 
    onChangeRightPaneView, 
    onOpenAiExplainer, 
    onOpenTranspiler, 
    onOpenLabReport, 
    onOpenCollegeMode, 
    onOpenShareCode, 
    onOpenTemplates, 
    onToggleSidebar, 
    onToggleTheme, 
    onDownloadCode, 
    onSelectLanguage
  ]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return ALL_ACTIONS;
    const q = query.toLowerCase();
    return ALL_ACTIONS.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q) ||
      (item.shortcut && item.shortcut.toLowerCase().includes(q))
    );
  }, [query, ALL_ACTIONS]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const executeAction = (actionItem) => {
    onClose();
    setTimeout(() => {
      actionItem.action();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      scrollSelectedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      scrollSelectedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        executeAction(filteredActions[selectedIndex]);
      }
    }
  };

  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const activeEl = listRef.current?.querySelector('.command-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }, 10);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-box command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '92%',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(30, 41, 59, 0.4)'
        }}>
          <Search size={18} color="#38bdf8" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action (e.g. 'run', 'flowchart', 'python')..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.96rem',
              fontWeight: 500
            }}
          />
          <kbd style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontFamily: 'monospace'
          }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
            maxHeight: '440px'
          }}
        >
          {filteredActions.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
              <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No commands found matching "{query}"</p>
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  className={`command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {action.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isSelected ? '#38bdf8' : '#f1f5f9' }}>
                        {action.title}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                        {action.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {action.shortcut && (
                      <kbd style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        fontFamily: 'monospace'
                      }}>
                        {action.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight size={14} color="#38bdf8" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.74rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>esc Dismiss</span>
          </div>
          <div>
            <span>⚡ Elite IDE Quick Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
