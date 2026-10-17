import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  GitFork, 
  Layers, 
  Variable, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause,
  SkipForward,
  SkipBack,
  Sparkles, 
  Maximize2, 
  Compass,
  Download,
  Copy,
  Check,
  Search,
  Activity,
  Code2,
  FileCode,
  Zap,
  Info,
  X,
  Palette,
  Eye
} from 'lucide-react';
import { parseCodeToGraph, extractVariables, generateAstTree } from '../services/astFlowchart';

// Built-in Flowchart Examples for Instant Visualization
const FLOWCHART_EXAMPLES = [
  {
    id: 'ifelse',
    name: 'If-Else Branching',
    category: 'Decisions',
    code: `# Check if number is Positive, Negative, or Zero
num = 15

if num > 0:
    print("Number is Positive")
    status = "valid"
else:
    print("Number is Negative or Zero")
    status = "check"

print("Evaluation Complete")
`
  },
  {
    id: 'while_loop',
    name: 'While Loop Counter',
    category: 'Loops',
    code: `# While loop with countdown and accumulator
count = 5
total = 0

while count > 0:
    total = total + count
    print("Current Count:", count)
    count = count - 1

print("Countdown Finished! Total:", total)
`
  },
  {
    id: 'for_sum',
    name: 'For Loop & Array Sum',
    category: 'Loops',
    code: `# Iterate and compute sum of elements
numbers = [10, 20, 30, 40]
sum_val = 0

for n in numbers:
    sum_val = sum_val + n
    print("Added:", n)

print("Final Sum:", sum_val)
`
  },
  {
    id: 'factorial',
    name: 'Factorial Function',
    category: 'Functions',
    code: `def factorial(n):
    result = 1
    i = 1
    while i <= n:
        result = result * i
        i = i + 1
    return result

ans = factorial(5)
print("Factorial is:", ans)
`
  },
  {
    id: 'binary_search',
    name: 'Binary Search Logic',
    category: 'Algorithms',
    code: `target = 42
low = 0
high = 100
found = False

while low <= high:
    mid = (low + high) // 2
    if mid == target:
        found = True
        print("Found target at:", mid)
        break
    elif mid < target:
        low = mid + 1
    else:
        high = mid - 1

print("Search Complete")
`
  }
];

export default function GraphicalView({ 
  code = '', 
  language = 'python', 
  onSelectLine, 
  selectedLine,
  onUpdateCode,
  onOpenAiExplainer
}) {
  const [tab, setTab] = useState('flowchart'); // 'flowchart' | 'ast' | 'variables'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeNodeIndex, setActiveNodeIndex] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // 0.5 | 1 | 2
  const [activeStep, setActiveStep] = useState(0);
  const [showZoomPresets, setShowZoomPresets] = useState(false);
  const [showThemesMenu, setShowThemesMenu] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [themeMode, setThemeMode] = useState('neon'); // 'neon' | 'slate' | 'blueprint'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const [showExamplesMenu, setShowExamplesMenu] = useState(false);

  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationTimerRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Memoized graph parsing with 2D DAG layout
  const graph = useMemo(() => {
    return parseCodeToGraph(code, language);
  }, [code, language]);

  const variables = useMemo(() => {
    return extractVariables(code);
  }, [code]);

  const astTree = useMemo(() => {
    return generateAstTree(code, language);
  }, [code, language]);

  const svgBounds = graph.bounds || { width: 900, height: 600, minX: 100, maxX: 700 };

  // Center / Focus on a specific node and smoothly glide camera
  const focusNode = useCallback((targetIdx) => {
    if (targetIdx < 0 || targetIdx >= graph.nodes.length) return;
    setActiveNodeIndex(targetIdx);
    const node = graph.nodes[targetIdx];
    if (!node) return;

    setSelectedNodeDetails(node);

    if (onSelectLine && node.line) {
      onSelectLine(node.line);
    }

    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const currentZoom = zoomRef.current;
      const targetX = Math.round(clientWidth / 2 - node.x * currentZoom);
      const targetY = Math.round(clientHeight / 2 - node.y * currentZoom);
      setPan({ x: targetX, y: targetY });
    }
  }, [graph.nodes, onSelectLine]);

  // Fit view automatically based on graph bounds
  const handleFitView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const b = graph.bounds || { minX: 200, maxX: 600, minY: 0, maxY: 500, width: 800, height: 500 };
    const padding = clientWidth < 600 ? 30 : 60;
    const graphW = Math.max(b.maxX - b.minX + padding * 2, 600);
    const graphH = Math.max(b.maxY - b.minY + padding * 2, 500);

    const scaleX = clientWidth / graphW;
    const scaleY = clientHeight / graphH;
    const fitScale = Math.min(scaleX, scaleY, 1.25);
    const safeScale = Math.max(Number(fitScale.toFixed(2)), 0.2);

    setZoom(safeScale);
    const centerX = (b.minX + b.maxX) / 2;
    const centerY = (b.minY + b.maxY) / 2;

    setPan({
      x: Math.round(clientWidth / 2 - centerX * safeScale),
      y: Math.round(clientHeight / 2 - centerY * safeScale)
    });
  }, [graph.bounds]);

  const initialFitDoneRef = useRef(false);

  // Auto-fit view once on initial mount and when switching tabs (NOT on every keystroke)
  useEffect(() => {
    if (!initialFitDoneRef.current || tab !== 'flowchart') {
      const t = setTimeout(() => {
        handleFitView();
        initialFitDoneRef.current = true;
      }, 80);
      return () => clearTimeout(t);
    }
  }, [tab, handleFitView]);

  // Synchronize active node highlight with editor cursor line in real-time
  useEffect(() => {
    if (selectedLine && graph.nodes) {
      const matchedIdx = graph.nodes.findIndex(n => n.line === selectedLine);
      if (matchedIdx !== -1) {
        setActiveNodeIndex(matchedIdx);
      }
    }
  }, [selectedLine, graph.nodes]);

  // Mouse drag panning
  const handleMouseDown = (e) => {
    if (e.target.closest('.flow-node-group') || e.target.closest('.canvas-floating-toolbar') || e.target.closest('.flow-minimap') || e.target.closest('.flow-hud-badge')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch panning & pinch-to-zoom
  const touchStateRef = useRef({
    isInteracting: false,
    startPan: { x: 0, y: 0 },
    startTouches: [],
    initialPinchDist: 0,
    initialZoom: 1,
    zoomCenter: { x: 0, y: 0 },
    touchStartTime: 0,
    hasMoved: false,
    lastTapTime: 0
  });

  const handleTouchStart = (e) => {
    if (e.target.closest('.canvas-floating-toolbar') || e.target.closest('.flow-minimap') || e.target.closest('.flow-hud-badge')) return;

    const state = touchStateRef.current;
    state.isInteracting = true;
    state.startPan = { ...pan };
    state.touchStartTime = Date.now();
    state.hasMoved = false;

    if (e.touches.length === 1) {
      state.startTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      setIsDragging(true);

      const now = Date.now();
      if (now - state.lastTapTime < 300) {
        handleFitView();
        state.lastTapTime = 0;
      } else {
        state.lastTapTime = now;
      }
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      state.initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      state.initialZoom = zoomRef.current;
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      state.zoomCenter = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    const state = touchStateRef.current;
    if (!state.isInteracting) return;
    if (e.cancelable) e.preventDefault();

    if (e.touches.length === 1 && state.startTouches.length >= 1) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const deltaX = curX - state.startTouches[0].x;
      const deltaY = curY - state.startTouches[0].y;
      if (Math.hypot(deltaX, deltaY) > 5) state.hasMoved = true;

      setPan({
        x: Math.round(state.startPan.x + deltaX),
        y: Math.round(state.startPan.y + deltaY)
      });
    } else if (e.touches.length >= 2 && state.initialPinchDist > 0) {
      state.hasMoved = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = currentDist / state.initialPinchDist;
      const targetZoom = Math.min(Math.max(state.initialZoom * scale, 0.1), 15.0);
      const roundedZoom = Number(targetZoom.toFixed(2));
      const zCenter = state.zoomCenter;
      const curZoom = state.initialZoom;
      const nextPanX = zCenter.x - (zCenter.x - state.startPan.x) * (roundedZoom / curZoom);
      const nextPanY = zCenter.y - (zCenter.y - state.startPan.y) * (roundedZoom / curZoom);

      setZoom(roundedZoom);
      setPan({ x: Math.round(nextPanX), y: Math.round(nextPanY) });
    }
  };

  const handleTouchEnd = (e) => {
    const state = touchStateRef.current;
    if (e.touches.length === 0) {
      state.isInteracting = false;
      setIsDragging(false);
      state.initialPinchDist = 0;
    } else if (e.touches.length === 1) {
      state.startTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      state.startPan = { ...pan };
      state.initialPinchDist = 0;
    }
  };

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.08), 12.0);
        const roundedZoom = Number(nextZoom.toFixed(2));

        setPan((prevPan) => ({
          x: Math.round(mouseX - (mouseX - prevPan.x) * (roundedZoom / prevZoom)),
          y: Math.round(mouseY - (mouseY - prevPan.y) * (roundedZoom / prevZoom))
        }));

        return roundedZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Zoom step
  const handleZoomChange = (delta) => {
    setZoom((prev) => {
      const next = delta > 0 ? prev * 1.25 : prev / 1.25;
      return Number(Math.min(Math.max(next, 0.08), 12.0).toFixed(2));
    });
  };

  // Step debugger simulation
  const handleToggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      let idx = activeNodeIndex !== null ? activeNodeIndex : 0;
      focusNode(idx);

      const intervalMs = Math.round(800 / simSpeed);
      simulationTimerRef.current = setInterval(() => {
        idx++;
        if (idx >= graph.nodes.length) {
          clearInterval(simulationTimerRef.current);
          setIsSimulating(false);
        } else {
          focusNode(idx);
        }
      }, intervalMs);
    }
  };

  const handleStepForward = () => {
    if (isSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
    }
    const nextIdx = activeNodeIndex !== null ? (activeNodeIndex + 1) % graph.nodes.length : 0;
    focusNode(nextIdx);
  };

  const handleStepBackward = () => {
    if (isSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
    }
    const prevIdx = activeNodeIndex !== null 
      ? (activeNodeIndex - 1 + graph.nodes.length) % graph.nodes.length 
      : 0;
    focusNode(prevIdx);
  };

  const handleResetSimulation = () => {
    if (isSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
    }
    setActiveNodeIndex(null);
    setSelectedNodeDetails(null);
    handleFitView();
  };

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Copy Mermaid Syntax
  const handleCopyMermaid = () => {
    if (!graph.mermaidCode) return;
    navigator.clipboard.writeText(graph.mermaidCode);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  // Export Flowchart as SVG File
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart_${language}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Flowchart as High-Res PNG
  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const bounds = graph.bounds || { width: 1200, height: 800 };
    const scale = 2; // 2x high resolution
    canvas.width = Math.max(bounds.width, 1000) * scale;
    canvas.height = Math.max(bounds.height, 800) * scale;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = themeMode === 'blueprint' ? '#0f172a' : '#090a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `flowchart_${language}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = url;
  };

  // Load Example into Editor
  const handleLoadExample = (example) => {
    if (onUpdateCode) {
      onUpdateCode(example.code);
    } else {
      window.dispatchEvent(new CustomEvent('load_code', { detail: example.code }));
    }
    setShowExamplesMenu(false);
  };

  // Step forward in variables tracker
  const stepVariables = () => {
    if (variables.length === 0) return;
    const next = (activeStep + 1) % variables.length;
    setActiveStep(next);
    if (variables[next] && onSelectLine) {
      onSelectLine(variables[next].line);
    }
  };

  // Search filter node highlights
  const matchedNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set();
    const q = searchQuery.toLowerCase().trim();
    const set = new Set();
    graph.nodes.forEach(n => {
      if (
        (n.label && n.label.toLowerCase().includes(q)) ||
        (n.raw && n.raw.toLowerCase().includes(q)) ||
        (n.subtitle && n.subtitle.toLowerCase().includes(q))
      ) {
        set.add(n.id);
      }
    });
    return set;
  }, [searchQuery, graph.nodes]);

  // Jump to first search match
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (matchedNodeIds.size > 0) {
      const firstId = Array.from(matchedNodeIds)[0];
      const idx = graph.nodes.findIndex(n => n.id === firstId);
      if (idx !== -1) focusNode(idx);
    }
  };

  const stats = graph.stats || {};

  return (
    <div className={`graphical-container theme-${themeMode}`}>
      {/* 1. Header Toolbar (Single Sleek Bar) */}
      <div className="graphical-header">
        <div className="graphical-status-info">
          <div className="hud-metric live-sync">
            <span className="live-dot-pulse" />
            <span className="metric-label font-bold text-emerald">REAL-TIME SYNC</span>
          </div>
          <span className="hud-metric-chip">
            Complexity: <strong style={{ color: stats.complexityColor || '#38bdf8' }}>M = {stats.cyclomaticComplexity || 1}</strong>
          </span>
          <span className="hud-metric-chip">
            Nodes: <strong>{graph.nodes.length}</strong>
          </span>
        </div>

        {/* Action Controls for Flowchart */}
        <div className="graph-header-actions">
          {/* Quick Flowchart Template Library */}
          <div className="dropdown-wrapper">
            <button
              className="flow-action-btn"
              onClick={() => setShowExamplesMenu(!showExamplesMenu)}
              title="Load standard flowchart algorithm examples"
            >
              <Code2 size={13} className="text-cyan" />
              <span className="action-btn-text">Presets</span>
            </button>

            {showExamplesMenu && (
              <div className="flow-dropdown-menu">
                <div className="dropdown-menu-title">Select Flow Example</div>
                {FLOWCHART_EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    className="dropdown-item"
                    onClick={() => handleLoadExample(ex)}
                  >
                    <span className="item-name">{ex.name}</span>
                    <span className="item-tag">{ex.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stepper Controls */}
          <div className="stepper-group">
            <button
              className="step-icon-btn"
              onClick={handleStepBackward}
              title="Step Backward (Previous Statement)"
            >
              <SkipBack size={12} />
            </button>

            <button 
              className={`simulate-btn ${isSimulating ? 'active' : ''}`}
              onClick={handleToggleSimulation}
              title={isSimulating ? 'Pause Flow' : 'Auto Play Simulation'}
            >
              {isSimulating ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              <span className="sim-btn-full">{isSimulating ? 'Pause' : 'Play'}</span>
            </button>

            <button
              className="step-icon-btn"
              onClick={handleStepForward}
              title="Step Forward (Next Statement)"
            >
              <SkipForward size={12} />
            </button>

            <button
              className="step-icon-btn reset"
              onClick={handleResetSimulation}
              title="Reset Execution Pointer"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Speed Toggle */}
          <button
            className="speed-toggle-btn"
            onClick={() => setSimSpeed(s => s === 1 ? 2 : s === 2 ? 0.5 : 1)}
            title="Execution Animation Speed"
          >
            {simSpeed}x
          </button>

          {/* Theme Picker */}
          <div className="dropdown-wrapper">
            <button
              className="flow-icon-btn"
              onClick={() => setShowThemesMenu(!showThemesMenu)}
              title="Change Flowchart Theme"
            >
              <Palette size={14} />
            </button>

            {showThemesMenu && (
              <div className="flow-dropdown-menu right-aligned">
                <div className="dropdown-menu-title">Flowchart Aesthetic</div>
                <button 
                  className={`dropdown-item ${themeMode === 'neon' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('neon'); setShowThemesMenu(false); }}
                >
                  🌌 Cyberpunk Neon
                </button>
                <button 
                  className={`dropdown-item ${themeMode === 'slate' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('slate'); setShowThemesMenu(false); }}
                >
                  💎 Deep Obsidian
                </button>
                <button 
                  className={`dropdown-item ${themeMode === 'blueprint' ? 'active' : ''}`}
                  onClick={() => { setThemeMode('blueprint'); setShowThemesMenu(false); }}
                >
                  📐 Blueprint Tech
                </button>
              </div>
            )}
          </div>

          {/* Export Menu */}
          <button
            className="flow-icon-btn"
            onClick={handleExportPng}
            title="Export as High-Resolution PNG"
          >
            <Download size={14} />
          </button>

          <button
            className="flow-icon-btn"
            onClick={handleCopyMermaid}
            title={copiedMermaid ? 'Copied Mermaid!' : 'Copy Mermaid Markdown Code'}
          >
            {copiedMermaid ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
          </button>

          {/* Clean Header Search Bar */}
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <Search size={12} className="text-muted" />
            <input
              type="text"
              placeholder="Find node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={10} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 2. Main Visualizer Body */}
      <div className="graphical-body">
        {tab === 'flowchart' && (
          <div 
            ref={containerRef}
            className="svg-viewport-wrapper"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          >
            {/* Floating Zoom Controls Toolbar */}
            <div className="canvas-floating-toolbar">
              <button 
                className="canvas-tool-btn" 
                title="Zoom Out"
                onClick={() => handleZoomChange(-1)}
              >
                <ZoomOut size={14} />
              </button>

              <div className="zoom-slider-container" title="Drag zoom slider">
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={Math.min(zoom, 4.0)}
                  onChange={(e) => setZoom(Number(Number(e.target.value).toFixed(2)))}
                  className="zoom-range-slider"
                />
              </div>

              <button 
                className="canvas-tool-btn" 
                title="Zoom In"
                onClick={() => handleZoomChange(1)}
              >
                <ZoomIn size={14} />
              </button>

              <button
                className="zoom-percentage-btn"
                onClick={() => setShowZoomPresets(!showZoomPresets)}
                title="Presets"
              >
                {Math.round(zoom * 100)}%
              </button>

              {showZoomPresets && (
                <div className="zoom-presets-dropdown">
                  <button onClick={() => { setZoom(0.5); setShowZoomPresets(false); }}>50%</button>
                  <button onClick={() => { setZoom(1.0); setShowZoomPresets(false); }}>100% (Default)</button>
                  <button onClick={() => { setZoom(1.5); setShowZoomPresets(false); }}>150%</button>
                  <button onClick={() => { setZoom(2.5); setShowZoomPresets(false); }}>250%</button>
                </div>
              )}

              <button 
                className="canvas-tool-btn" 
                title="Fit to Screen"
                onClick={handleFitView}
              >
                <Maximize2 size={14} />
              </button>

              <button 
                className="canvas-tool-btn" 
                title="Center View"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              >
                <Compass size={14} />
              </button>

              <button 
                className={`canvas-tool-btn ${showMinimap ? 'active' : ''}`}
                title={showMinimap ? "Hide Mini-Map Radar" : "Show Mini-Map Radar"}
                onClick={() => setShowMinimap(!showMinimap)}
              >
                <Eye size={14} />
              </button>
            </div>

            {/* Interactive Mini-Map Preview (Toggled On Demand) */}
            {showMinimap && (
              <div className="flow-minimap">
                <div className="minimap-header">
                  <span>RADAR</span>
                  <span className="minimap-dot" />
                </div>
                <svg 
                  viewBox={`${svgBounds.minX || 0} ${svgBounds.minY || 0} ${svgBounds.width || 800} ${svgBounds.height || 600}`} 
                  className="minimap-svg"
                >
                  {graph.edges.map((e, idx) => {
                    const s = graph.nodes.find(n => n.id === e.from);
                    const t = graph.nodes.find(n => n.id === e.to);
                    if (!s || !t) return null;
                    return (
                      <line 
                        key={`mm-e-${idx}`} 
                        x1={s.x} 
                        y1={s.y} 
                        x2={t.x} 
                        y2={t.y} 
                        stroke="rgba(255, 255, 255, 0.2)" 
                        strokeWidth="3"
                      />
                    );
                  })}
                  {graph.nodes.map((n) => (
                    <rect
                      key={`mm-n-${n.id}`}
                      x={n.x - 15}
                      y={n.y - 10}
                      width={30}
                      height={20}
                      rx="3"
                      fill={n.category === 'start' ? '#10b981' : n.category === 'decision' ? '#f59e0b' : '#38bdf8'}
                    />
                  ))}
                </svg>
              </div>
            )}

            {/* Node Inspector Drawer */}
            {selectedNodeDetails && (
              <div className="node-inspector-card">
                <div className="inspector-header">
                  <div className="inspector-type">
                    <span className={`type-tag ${selectedNodeDetails.category}`}>
                      {selectedNodeDetails.category.toUpperCase()}
                    </span>
                    <span className="line-tag">Line {selectedNodeDetails.line}</span>
                  </div>
                  <button 
                    className="close-inspector-btn"
                    onClick={() => setSelectedNodeDetails(null)}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="inspector-body">
                  <div className="inspector-label">{selectedNodeDetails.label}</div>
                  <div className="inspector-sub">{selectedNodeDetails.subtitle}</div>
                  {selectedNodeDetails.raw && (
                    <div className="inspector-code">
                      <code>{selectedNodeDetails.raw}</code>
                    </div>
                  )}
                </div>
                {onSelectLine && selectedNodeDetails.line && (
                  <button 
                    className="jump-editor-btn"
                    onClick={() => onSelectLine(selectedNodeDetails.line)}
                  >
                    <FileCode size={12} />
                    <span>Focus in Editor</span>
                  </button>
                )}
              </div>
            )}

            {/* SVG Canvas with True ISO Shapes & Branching */}
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              className="canvas-svg"
            >
              <defs>
                {/* Canvas Grid Background */}
                <pattern id="flowGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill={themeMode === 'blueprint' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.07)'} />
                </pattern>

                {/* Arrowhead Markers */}
                <marker id="arrowDefault" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                </marker>
                <marker id="arrowTrue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>
                <marker id="arrowFalse" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                </marker>
                <marker id="arrowLoop" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
                </marker>

                {/* Filters */}
                <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0, 0, 0, 0.6)" />
                </filter>
                <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#38bdf8" floodOpacity="0.8" />
                </filter>
                <filter id="glowAmber" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
                <filter id="glowEmerald" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#10b981" floodOpacity="0.8" />
                </filter>

                {/* Node Gradients */}
                <linearGradient id="gradProcess" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e222b" />
                  <stop offset="100%" stopColor="#151820" />
                </linearGradient>
                <linearGradient id="gradDecision" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a1f11" />
                  <stop offset="100%" stopColor="#1a140a" />
                </linearGradient>
                <linearGradient id="gradIo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#271424" />
                  <stop offset="100%" stopColor="#170c15" />
                </linearGradient>
                <linearGradient id="gradTerminalStart" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#022c22" />
                </linearGradient>
                <linearGradient id="gradTerminalEnd" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4c0519" />
                  <stop offset="100%" stopColor="#2b030f" />
                </linearGradient>
              </defs>

              {/* Infinite Grid */}
              <rect width="100%" height="100%" fill="url(#flowGrid)" />

              {/* Scalable & Zoomable Graph Content */}
              <g 
                className="zoomable-canvas-content"
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{
                  transformOrigin: '0 0',
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.9, 0.35, 1)'
                }}
              >
                {/* 1. EDGES / CONNECTORS */}
                {graph.edges.map((edge, idx) => {
                  const source = graph.nodes.find(n => n.id === edge.from);
                  const target = graph.nodes.find(n => n.id === edge.to);
                  if (!source || !target) return null;

                  let strokeColor = 'rgba(56, 189, 248, 0.4)';
                  let markerEnd = 'url(#arrowDefault)';

                  if (edge.isBranchTrue) {
                    strokeColor = '#10b981';
                    markerEnd = 'url(#arrowTrue)';
                  } else if (edge.isBranchFalse) {
                    strokeColor = '#f43f5e';
                    markerEnd = 'url(#arrowFalse)';
                  } else if (edge.isLoopBack) {
                    strokeColor = '#a855f7';
                    markerEnd = 'url(#arrowLoop)';
                  }

                  // Calculate start & end anchors based on geometry
                  let startX = source.x;
                  let startY = source.y + source.height / 2;
                  let endX = target.x;
                  let endY = target.y - target.height / 2;

                  if (source.isDiamond) {
                    if (edge.isBranchTrue) {
                      startX = source.x + source.width / 2;
                      startY = source.y;
                    } else if (edge.isBranchFalse) {
                      startX = source.x - source.width / 2;
                      startY = source.y;
                    }
                  }

                  if (target.isMerge) {
                    endY = target.y - target.height / 2;
                  }

                  let pathD = '';
                  let labelX = (startX + endX) / 2;
                  let labelY = (startY + endY) / 2;

                  if (edge.isLoopBack) {
                    // Generous loop-back curve routed along the side
                    const sideX = Math.max(startX, endX) + 160;
                    pathD = `M ${startX + source.width / 2} ${source.y} C ${sideX} ${source.y}, ${sideX} ${target.y}, ${endX + target.width / 2} ${target.y}`;
                    labelX = sideX - 10;
                    labelY = (source.y + target.y) / 2;
                  } else if (edge.isBypass) {
                    // False branch direct bypass down to merge
                    const bypassX = Math.min(startX, endX) - 60;
                    pathD = `M ${startX} ${startY} C ${bypassX} ${startY + 20}, ${bypassX} ${endY - 20}, ${endX} ${endY}`;
                    labelX = bypassX + 10;
                    labelY = (startY + endY) / 2;
                  } else {
                    // Smooth Orthogonal Bezier
                    const midY = (startY + endY) / 2;
                    pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
                  }

                  return (
                    <g key={edge.id || `edge-${idx}`}>
                      {/* Base Path */}
                      <path
                        id={`edge_path_${idx}`}
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={edge.isBranchTrue || edge.isBranchFalse ? '2.5' : '2'}
                        strokeDasharray={edge.isLoopBack ? '5 5' : 'none'}
                        markerEnd={markerEnd}
                      />

                      {/* Real-time Animated Energy Particle Traveling Along Edge */}
                      <circle 
                        r="3" 
                        fill={edge.isBranchTrue ? '#10b981' : edge.isBranchFalse ? '#f43f5e' : edge.isLoopBack ? '#c084fc' : '#38bdf8'}
                        filter={edge.isBranchTrue ? 'url(#glowEmerald)' : edge.isBranchFalse ? 'url(#glowAmber)' : 'url(#glowCyan)'}
                      >
                        <animateMotion
                          dur={edge.isLoopBack ? '2.4s' : edge.isBranchTrue || edge.isBranchFalse ? '2.0s' : '2.8s'}
                          repeatCount="indefinite"
                          path={pathD}
                        />
                      </circle>

                      {/* Edge Label Badge */}
                      {edge.label && (
                        <g transform={`translate(${labelX}, ${labelY})`}>
                          <rect
                            x="-32"
                            y="-9"
                            width="64"
                            height="18"
                            rx="5"
                            fill="#0d1117"
                            stroke={strokeColor}
                            strokeWidth="1.2"
                          />
                          <text
                            x="0"
                            y="4"
                            fill={strokeColor}
                            fontSize="9"
                            fontWeight="800"
                            textAnchor="middle"
                            fontFamily="'JetBrains Mono', monospace"
                            letterSpacing="0.4"
                          >
                            {edge.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. NODES (ISO Shapes) */}
                {graph.nodes.map((node, i) => {
                  const isSelected = selectedLine === node.line;
                  const isCurrentSim = activeNodeIndex === i;
                  const isMatch = matchedNodeIds.has(node.id);

                  const x = node.x - node.width / 2;
                  const y = node.y - node.height / 2;
                  const cx = node.x;
                  const cy = node.y;
                  const w = node.width;
                  const h = node.height;

                  let accentColor = '#38bdf8';
                  if (node.category === 'start') accentColor = '#10b981';
                  else if (node.category === 'end') accentColor = '#ef4444';
                  else if (node.category === 'decision') accentColor = '#f59e0b';
                  else if (node.category === 'loop') accentColor = '#a855f7';
                  else if (node.category === 'io') accentColor = '#ec4899';
                  else if (node.category === 'function') accentColor = '#06b6d4';
                  else if (node.category === 'merge') accentColor = '#818cf8';

                  return (
                    <g
                      key={node.id}
                      className="flow-node-group"
                      onClick={() => focusNode(i)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Active Simulation / Search Halo */}
                      {(isSelected || isCurrentSim || isMatch) && (
                        <rect
                          x={x - 6}
                          y={y - 6}
                          width={w + 12}
                          height={h + 12}
                          rx={node.isStadium ? (h + 12) / 2 : 12}
                          fill="none"
                          stroke={isCurrentSim ? '#38bdf8' : isMatch ? '#10b981' : '#fbbf24'}
                          strokeWidth="2.5"
                          filter={isCurrentSim ? 'url(#glowCyan)' : 'url(#glowAmber)'}
                        />
                      )}

                      {/* SHAPE 1: TERMINAL (Capsule / Stadium Pill) */}
                      {node.isStadium && (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            rx={h / 2}
                            fill={node.category === 'start' ? 'url(#gradTerminalStart)' : 'url(#gradTerminalEnd)'}
                            stroke={accentColor}
                            strokeWidth="1.8"
                            filter="url(#nodeShadow)"
                          />
                          <circle
                            cx={x + 22}
                            cy={cy}
                            r="6"
                            fill={accentColor}
                          />
                          <text
                            x={cx + 5}
                            y={cy + 4.5}
                            fill="#ffffff"
                            fontSize="12.5"
                            fontWeight="800"
                            textAnchor="middle"
                            fontFamily="'JetBrains Mono', monospace"
                            letterSpacing="0.8"
                          >
                            {node.label}
                          </text>
                        </g>
                      )}

                      {/* SHAPE 2: DECISION / LOOP (Real Diamond / Rhombus) */}
                      {node.isDiamond && (
                        <g>
                          <polygon
                            points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
                            fill="url(#gradDecision)"
                            stroke={accentColor}
                            strokeWidth="1.8"
                            filter="url(#nodeShadow)"
                          />
                          {/* Anchor ports */}
                          <circle cx={x + w} cy={cy} r="4" fill="#10b981" />
                          <circle cx={x} cy={cy} r="4" fill="#f43f5e" />
                          {/* Diamond Condition Text */}
                          <text
                            x={cx}
                            y={cy - 6}
                            fill={accentColor}
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            letterSpacing="0.4"
                          >
                            {node.category === 'loop' ? 'LOOP ITERATION' : 'CONDITION EVAL'}
                          </text>
                          <text
                            x={cx}
                            y={cy + 12}
                            fill="#ffffff"
                            fontSize="11.5"
                            fontWeight="700"
                            textAnchor="middle"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label}
                          </text>
                        </g>
                      )}

                      {/* SHAPE 3: INPUT / OUTPUT (Parallelogram) */}
                      {node.isParallelogram && (
                        <g>
                          <polygon
                            points={`${x + 18},${y} ${x + w + 10},${y} ${x + w - 10},${y + h} ${x - 18},${y + h}`}
                            fill="url(#gradIo)"
                            stroke={accentColor}
                            strokeWidth="1.6"
                            filter="url(#nodeShadow)"
                          />
                          <text
                            x={x + 10}
                            y={y + 18}
                            fill={accentColor}
                            fontSize="8.5"
                            fontWeight="bold"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            L{node.line} • I/O
                          </text>
                          <text
                            x={x + 10}
                            y={y + 36}
                            fill="#fdf2f8"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {node.label.length > 24 ? node.label.slice(0, 22) + '…' : node.label}
                          </text>
                        </g>
                      )}

                      {/* SHAPE 4: MERGE CONNECTOR JUNCTION (⨁) */}
                      {node.isMerge && (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r="17"
                            fill="#1e1b4b"
                            stroke="#818cf8"
                            strokeWidth="2"
                            filter="url(#nodeShadow)"
                          />
                          <text
                            x={cx}
                            y={cy + 5}
                            fill="#c7d2fe"
                            fontSize="13"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ⨁
                          </text>
                        </g>
                      )}

                      {/* SHAPE 5: PROCESS / STATEMENT / FUNCTION (Crisp Card) */}
                      {!node.isStadium && !node.isDiamond && !node.isParallelogram && !node.isMerge && (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            rx="8"
                            fill="url(#gradProcess)"
                            stroke={accentColor}
                            strokeWidth="1.2"
                            filter="url(#nodeShadow)"
                          />
                          {/* Accent Strip */}
                          <rect
                            x={x}
                            y={y}
                            width="4"
                            height={h}
                            rx="2"
                            fill={accentColor}
                          />
                          {/* Subroutine Pinstripes */}
                          {node.isSubroutine && (
                            <>
                              <line x1={x + 14} y1={y} x2={x + 14} y2={y + h} stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 2" />
                              <line x1={x + w - 14} y1={y} x2={x + w - 14} y2={y + h} stroke={accentColor} strokeWidth="1.5" strokeDasharray="3 2" />
                            </>
                          )}
                          {/* Line Number Pill */}
                          <text
                            x={x + 14}
                            y={y + 18}
                            fill="#94a3b8"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            L{node.line}
                          </text>
                          <text
                            x={x + 36}
                            y={y + 18}
                            fill={accentColor}
                            fontSize="8.5"
                            fontWeight="bold"
                            letterSpacing="0.4"
                          >
                            {node.subtitle}
                          </text>
                          {/* Statement Text */}
                          <text
                            x={x + 14}
                            y={y + 36}
                            fill="#f8fafc"
                            fontSize="11.5"
                            fontWeight="600"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {node.label.length > 25 ? node.label.slice(0, 23) + '…' : node.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}

        {/* TAB 2: AST STRUCTURE */}
        {tab === 'ast' && (
          <div className="ast-container">
            <div className="ast-tree-view">
              <div className="ast-node root">
                <div className="ast-node-header root-header">
                  <span className="ast-tag root-tag">PROGRAM ROOT</span>
                  <span className="ast-title">{astTree.name}</span>
                </div>
                <div className="ast-children">
                  {astTree.children.map((child, idx) => (
                    <div key={idx} className="ast-node child">
                      <div 
                        className="ast-node-header hoverable"
                        onClick={() => child.line && onSelectLine && onSelectLine(child.line)}
                      >
                        <span className={`ast-tag ${child.type.toLowerCase()}`}>
                          {child.type}
                        </span>
                        <span className="ast-title">{child.name}</span>
                        {child.line && <span className="ast-line">Line {child.line}</span>}
                      </div>

                      {child.children && child.children.length > 0 && (
                        <div className="ast-sub-children">
                          {child.children.map((sub, sIdx) => (
                            <div 
                              key={sIdx} 
                              className="ast-leaf hoverable"
                              onClick={() => sub.line && onSelectLine && onSelectLine(sub.line)}
                            >
                              <span className="ast-leaf-bullet">•</span>
                              <span className="ast-tag-mini">{sub.type}</span>
                              <span className="ast-leaf-text">{sub.name}</span>
                              {sub.line && <span className="ast-line-mini">L{sub.line}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VARIABLES & STATE */}
        {tab === 'variables' && (
          <div className="variables-container">
            <div className="variables-toolbar">
              <div>
                <span className="vars-title">Memory Allocation & Variables Watcher</span>
                <p className="vars-subtitle">Track detected variables, value bindings, and execution state</p>
              </div>

              {variables.length > 0 && (
                <button className="step-btn" onClick={stepVariables}>
                  <Play size={13} />
                  <span>Step Variable ({activeStep + 1}/{variables.length})</span>
                </button>
              )}
            </div>

            {variables.length === 0 ? (
              <div className="no-vars-notice">
                <Variable size={32} className="text-muted" />
                <p>No variables declared in the code yet.<br />Declare variables (e.g. <code>x = 42</code> or <code>int total = 100;</code>) to inspect live state.</p>
              </div>
            ) : (
              <div className="vars-grid">
                {variables.map((v, i) => {
                  const isActive = activeStep === i;
                  return (
                    <div 
                      key={i} 
                      className={`var-card ${isActive ? 'active-step' : ''}`}
                      onClick={() => {
                        setActiveStep(i);
                        if (onSelectLine) onSelectLine(v.line);
                      }}
                    >
                      <div className="var-header">
                        <span className="var-name">{v.name}</span>
                        <span className={`var-type-badge ${v.type}`}>{v.type}</span>
                      </div>
                      <div className="var-value-box">
                        <code>{v.value}</code>
                      </div>
                      <div className="var-footer">
                        <span>Line {v.line}</span>
                        {isActive && <span className="active-tag">Active Pointer</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
