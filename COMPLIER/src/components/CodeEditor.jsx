import React, { useRef, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Trash2, 
  Terminal as TerminalIcon, 
  Code2, 
  ChevronDown, 
  Maximize,
  Minimize
} from 'lucide-react';

export default function CodeEditor({
  code,
  onChange,
  language,
  selectedLine,
  stdin,
  onStdinChange,
  showStdin,
  onToggleStdin,
  onResetTemplate,
  onClear
}) {
  const [copied, setCopied] = React.useState(false);
  const textareaRef = useRef(null);
  const linesRef = useRef(null);

  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Tab key properly inside textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Synchronize scroll between line numbers and textarea
  const handleScroll = () => {
    if (linesRef.current && textareaRef.current) {
      linesRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Scroll to selected line when clicked in flowchart
  useEffect(() => {
    if (selectedLine && textareaRef.current) {
      const lineHeight = 22;
      const targetScroll = Math.max(0, (selectedLine - 4) * lineHeight);
      textareaRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [selectedLine]);

  return (
    <div className="editor-container">
      {/* Editor Top Bar */}
      <div className="editor-toolbar">
        <div className="editor-left-meta">
          <Code2 size={16} className="text-amber-400" />
          <span className="editor-file-title">main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'rust' ? 'rs' : language === 'go' ? 'go' : language === 'c' ? 'c' : 'txt'}</span>
          <span className="editor-line-badge">{lineCount} lines</span>
          {selectedLine && (
            <span className="active-line-badge">Focused: L{selectedLine}</span>
          )}
        </div>

        <div className="editor-actions">
          <button 
            className={`tool-action-btn ${showStdin ? 'active-stdin' : ''}`}
            onClick={onToggleStdin}
            title="Toggle Standard Input (stdin)"
          >
            <TerminalIcon size={14} />
            <span>Stdin {stdin ? '(Active)' : ''}</span>
          </button>

          <button 
            className="tool-action-btn"
            onClick={handleCopy}
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button 
            className="tool-action-btn"
            onClick={onResetTemplate}
            title="Reset to Template"
          >
            <RotateCcw size={14} />
            <span>Preset</span>
          </button>

          <button 
            className="tool-action-btn danger"
            onClick={onClear}
            title="Clear Code"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Code Textarea & Gutter */}
      <div className="editor-body">
        {/* Line Numbers Gutter */}
        <div className="editor-gutter" ref={linesRef}>
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isHighlighted = selectedLine === lineNum;
            return (
              <div 
                key={i} 
                className={`gutter-line ${isHighlighted ? 'highlighted-gutter' : ''}`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="code-textarea"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="Write or paste your code here..."
        />
      </div>

      {/* Collapsible Stdin Input Drawer */}
      {showStdin && (
        <div className="stdin-drawer">
          <div className="stdin-header">
            <span>Standard Input (stdin) - Program inputs passed on execution:</span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            className="stdin-textarea"
            placeholder="Type input values here (e.g. numbers, words on each line)..."
          />
        </div>
      )}
    </div>
  );
}
