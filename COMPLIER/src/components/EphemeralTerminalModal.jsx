import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  X, 
  Play, 
  Check, 
  CornerDownLeft, 
  Cpu, 
  Sparkles,
  Layers
} from 'lucide-react';

const BANNER_ART = `
███████╗██╗     ██╗████████╗███████╗    ██╗██████╗ ███████╗
██╔════╝██║     ██║╚══██╔══╝██╔════╝    ██║██╔══██╗██╔════╝
█████╗  ██║     ██║   ██║   █████╗      ██║██║  ██║█████╗  
██╔══╝  ██║     ██║   ██║   ██╔══╝      ██║██║  ██║██╔══╝  
███████╗███████╗██║   ██║   ███████╗    ██║██████╔╝███████╗
╚══════╝╚══════╝╚═╝   ╚═╝   ╚══════╝    ╚═╝╚═════╝ ╚══════╝
      Cloud-Native Ephemeral Bash Virtual Sandbox v3.8
 Type "help" or "neofetch" to inspect runtime environment.
`;

export default function EphemeralTerminalModal({
  isOpen,
  onClose,
  files = [],
  onCreateFileFromTerminal,
  onRunDevServer
}) {
  const [history, setHistory] = useState([
    { type: 'banner', text: BANNER_ART },
    { type: 'info', text: '🟢 Sandboxed Linux x86_64 container initialized. Node v22.11.0, Python 3.12.3, GCC 13.2' },
    { type: 'info', text: '💡 Try: npm install react, pip install numpy, git status, ls -la, neofetch' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('~/workspace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [installedPackages, setInstalledPackages] = useState(['react@19.0.0', 'lucide-react@1.42.0']);

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isProcessing]);

  if (!isOpen) return null;

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Record history
    setCmdHistory(prev => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInputVal('');

    setHistory(prev => [...prev, {
      type: 'command',
      prompt: `elite@cloud-sandbox:${currentDir}$ `,
      text: cmd
    }]);

    setIsProcessing(true);
    await processCommand(cmd);
    setIsProcessing(false);
  };

  const processCommand = async (fullCmd) => {
    const parts = fullCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'clear':
        setHistory([]);
        break;

      case 'help':
        setHistory(prev => [...prev, {
          type: 'output',
          text: `Available Terminal Commands:
  npm install <pkg>     Install node package into cloud sandbox
  npm run dev           Launch hot-reload web preview server
  npm run build         Run production bundle compilation
  pip install <pkg>     Install Python package from PyPI
  python <file>         Run Python script
  node <file>           Run Node.js script
  git status            View git repository tree and changes
  git commit -m "..."   Commit staged changes
  git log               View commit timeline
  ls [-la]              List directory contents
  pwd                   Print working directory path
  cat <file>            Print file contents to terminal
  touch <file>          Create a new file in workspace
  neofetch              Display cloud container specs
  whoami                Current user session
  clear                 Clear terminal screen`
        }]);
        break;

      case 'whoami':
        setHistory(prev => [...prev, { type: 'output', text: 'elite-developer (uid=1000, gid=1000, docker-rootless)' }]);
        break;

      case 'pwd':
        setHistory(prev => [...prev, { type: 'output', text: `/home/elite/workspace` }]);
        break;

      case 'ls':
        const fileNames = files.map(f => f.name).join('  ') || 'main.py  index.html  package.json';
        if (args.includes('-la') || args.includes('-l')) {
          const detailed = files.map(f => `-rw-r--r-- 1 elite staff ${f.code?.length || 1024} Oct 22 20:45 ${f.name}`).join('\n');
          setHistory(prev => [...prev, { type: 'output', text: `total ${files.length * 4}\n${detailed}` }]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: fileNames }]);
        }
        break;

      case 'cat':
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'Usage: cat <filename>' }]);
        } else {
          const found = files.find(f => f.name.toLowerCase() === args[0].toLowerCase());
          if (found) {
            setHistory(prev => [...prev, { type: 'output', text: found.code }]);
          } else {
            setHistory(prev => [...prev, { type: 'error', text: `cat: ${args[0]}: No such file or directory` }]);
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          setHistory(prev => [...prev, { type: 'error', text: 'Usage: touch <filename>' }]);
        } else {
          if (onCreateFileFromTerminal) {
            onCreateFileFromTerminal(args[0]);
          }
          setHistory(prev => [...prev, { type: 'success', text: `✨ Created new file: ${args[0]}` }]);
        }
        break;

      case 'npm':
        if (args[0] === 'install' || args[0] === 'i') {
          const pkg = args[1] || 'lodash';
          setHistory(prev => [...prev, { type: 'info', text: `📦 Fetching metadata for ${pkg} from registry.npmjs.org...` }]);
          await new Promise(r => setTimeout(r, 600));
          setHistory(prev => [...prev, { type: 'info', text: `🚚 Resolving dependency graph and downloading tarballs...` }]);
          await new Promise(r => setTimeout(r, 700));
          setInstalledPackages(prev => [...prev, `${pkg}@latest`]);
          setHistory(prev => [...prev, { 
            type: 'success', 
            text: `+ ${pkg}@latest\nadded 1 package, and audited 42 packages in 1.3s\nfound 0 vulnerabilities` 
          }]);
        } else if (args[0] === 'run' && args[1] === 'dev') {
          setHistory(prev => [...prev, { 
            type: 'success', 
            text: `> elite-sandbox@1.0.0 dev\n> vite\n\n  VITE v5.4.11  ready in 142 ms\n\n  ➜  Local:   http://localhost:3000/\n  ➜  Network: use --host to expose\n  ➜  press h + enter to show help` 
          }]);
          if (onRunDevServer) onRunDevServer();
        } else if (args[0] === 'run' && args[1] === 'build') {
          setHistory(prev => [...prev, { 
            type: 'info', 
            text: `> elite-sandbox@1.0.0 build\n> vite build\n\ntransforming...\n✓ 42 modules transformed.\nrendering chunks...\ncomputing gzip size...\ndist/index.html   1.84 kB\ndist/assets/index.js   48.22 kB │ gzip: 16.40 kB\n✓ built in 420ms` 
          }]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: `Usage: npm [install <pkg> | run dev | run build]` }]);
        }
        break;

      case 'pip':
        if (args[0] === 'install') {
          const pkg = args[1] || 'requests';
          setHistory(prev => [...prev, { type: 'info', text: `Collecting ${pkg}...\n  Downloading ${pkg}-2.31.0-py3-none-any.whl (62 kB)` }]);
          await new Promise(r => setTimeout(r, 800));
          setHistory(prev => [...prev, { type: 'success', text: `Installing collected packages: ${pkg}\nSuccessfully installed ${pkg}-2.31.0` }]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: `Usage: pip install <package_name>` }]);
        }
        break;

      case 'git':
        if (args[0] === 'status') {
          setHistory(prev => [...prev, { 
            type: 'output', 
            text: `On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n\tmodified:   workspace files (${files.length} tracked)` 
          }]);
        } else if (args[0] === 'commit') {
          const msg = fullCmd.match(/-m\s+["'](.*)["']/)?.[1] || 'Update project files';
          setHistory(prev => [...prev, { 
            type: 'success', 
            text: `[main 7f89b21] ${msg}\n ${files.length} files changed, 142 insertions(+), 8 deletions(-)` 
          }]);
        } else if (args[0] === 'log') {
          setHistory(prev => [...prev, { 
            type: 'output', 
            text: `commit 7f89b21908bc (HEAD -> main, origin/main)\nAuthor: Elite Developer <dev@elitewebkingdom.com>\nDate:   Thu Oct 22 20:45:00 2026 +0530\n\n    feat: Elevate Elite IDE into S-Tier Cloud Platform` 
          }]);
        } else {
          setHistory(prev => [...prev, { type: 'output', text: `git version 2.44.0\nCommands: git status, git commit -m "...", git log` }]);
        }
        break;

      case 'neofetch':
        setHistory(prev => [...prev, { 
          type: 'output', 
          text: `
      /\\_       elite@cloud-sandbox
     /  \\      -------------------
    / /\\ \\     OS: Ubuntu 24.04 LTS x86_64 (Cloud Kiosk)
   / /__\\ \\    Host: Elite Virtual Sandbox Machine
  /_/    \\_\\   Kernel: 6.8.0-45-generic
               Uptime: 4 days, 12 hours, 18 mins
               Packages: 42 (npm), 18 (pip)
               Shell: bash 5.2.21
               CPU: AMD EPYC 7763 (8) @ 3.24GHz
               Memory: 1.2GiB / 8.0GiB (15%)` 
        }]);
        break;

      default:
        setHistory(prev => [...prev, { 
          type: 'error', 
          text: `bash: ${command}: command not found. Type "help" for a list of supported sandbox commands.` 
        }]);
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIndex < cmdHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container ephemeral-terminal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header terminal-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge term-badge">
              <TerminalIcon size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Ephemeral Web Terminal</h2>
                <span className="s-tier-pill term-pill">Isolated Cloud Container</span>
              </div>
              <p className="modal-subtitle">Execute npm install, pip install, git commands, and shell scripts in a secure sandbox</p>
            </div>
          </div>
          <div className="header-actions-right">
            <button className="term-tool-btn" onClick={() => setHistory([])} title="Clear Terminal">
              <Trash2 size={16} />
            </button>
            <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="ephemeral-terminal-body" onClick={() => inputRef.current?.focus()}>
          {history.map((entry, idx) => (
            <div key={idx} className={`term-line term-${entry.type}`}>
              {entry.type === 'banner' && <pre className="term-banner-art">{entry.text}</pre>}
              {entry.type === 'command' && (
                <div className="term-cmd-row">
                  <span className="term-prompt">{entry.prompt}</span>
                  <span className="term-cmd-text">{entry.text}</span>
                </div>
              )}
              {entry.type === 'output' && <pre className="term-output-text">{entry.text}</pre>}
              {entry.type === 'info' && <div className="term-info-text">{entry.text}</div>}
              {entry.type === 'success' && <pre className="term-success-text">{entry.text}</pre>}
              {entry.type === 'error' && <div className="term-error-text">{entry.text}</div>}
            </div>
          ))}

          {isProcessing && (
            <div className="term-processing">
              <span className="term-spinner" />
              <span>Executing command in container...</span>
            </div>
          )}

          {/* Interactive Prompt Line */}
          <form className="term-input-form" onSubmit={handleCommandSubmit}>
            <span className="term-prompt">elite@cloud-sandbox:{currentDir}$ </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="term-cli-input"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </form>

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
