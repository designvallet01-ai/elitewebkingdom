import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Monitor, 
  LineChart as LineChartIcon, 
  BarChart3, 
  Layers, 
  Palette, 
  Download, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Check, 
  Sparkles, 
  ZoomIn, 
  ZoomOut,
  AppWindow,
  Sliders,
  Type,
  MousePointerClick,
  Info,
  ArrowLeft,
  X,
  Grid,
  Sun,
  Moon,
  Code2,
  LayoutGrid
} from 'lucide-react';

export default function VisualGuiPlotViewer({
  code = '',
  language = 'matlab',
  isMobile = false,
  onClose = null
}) {
  // Determine if code is MATLAB plotting vs Java Desktop GUI
  const isMatlabCode = useMemo(() => {
    const lower = (code || '').toLowerCase();
    return (
      language === 'matlab' || 
      language === 'octave' ||
      lower.includes('tiledlayout') ||
      lower.includes('nexttile') ||
      lower.includes('plot(') ||
      lower.includes('linspace') ||
      lower.includes('subplot(') ||
      lower.includes('scatter(') ||
      lower.includes('bar(') ||
      lower.includes('stem(')
    );
  }, [code, language]);

  // Mode: 'plot' | 'gui_window' | 'matrix'
  const [activeMode, setActiveMode] = useState(() => {
    const lower = (code || '').toLowerCase();
    if ((lower.includes('javafx') || lower.includes('swing') || lower.includes('jframe') || lower.includes('tkinter')) && !isMatlabCode) {
      return 'gui_window';
    }
    return 'plot';
  });

  // Plot state
  const [plotType, setPlotType] = useState('line'); // 'line' | 'bar' | 'scatter' | 'stem'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [figureTheme, setFigureTheme] = useState('dark'); // 'dark' | 'matlab-classic'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState(null);

  // GUI Window State
  const [guiClicks, setGuiClicks] = useState(0);
  const [guiTextInputs, setGuiTextInputs] = useState({});
  const [guiToggles, setGuiToggles] = useState({});
  const [guiSliderVal, setGuiSliderVal] = useState(65);
  const [guiEventLogs, setGuiEventLogs] = useState([
    'System.out.println("JavaFX Application Initialized.");',
    'Stage primaryStage = new Stage(); scene.show();'
  ]);

  // Window State: 'normal' | 'maximized'
  const [windowState, setWindowState] = useState('normal');

  // SVG ref for measuring coordinates
  const svgRef = useRef(null);

  // Keyboard shortcut: Press Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (windowState === 'maximized') {
          setWindowState('normal');
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowState, onClose]);

  // Auto-switch mode based on code content
  useEffect(() => {
    const lower = (code || '').toLowerCase();
    if (isMatlabCode) {
      setActiveMode('plot');
    } else if (lower.includes('javafx') || lower.includes('swing') || lower.includes('jframe') || lower.includes('tkinter') || lower.includes('pyqt')) {
      setActiveMode('gui_window');
    }
  }, [code, isMatlabCode]);

  // =========================================================================
  // PARSE MATLAB CODE (Supports single plot, subplots, and tiledlayout!)
  // =========================================================================
  const parsedPlotData = useMemo(() => {
    const raw = code || '';
    const lower = raw.toLowerCase();

    // Check for tiledlayout(r, c)
    const tiledMatch = raw.match(/tiledlayout\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    const hasTiledLayout = Boolean(tiledMatch) || raw.includes('nexttile');

    // Check for super title: title(t, "Trigonometric Functions")
    let superTitle = 'MATLAB Figure 1';
    const superTitleMatch = raw.match(/title\s*\(\s*[a-zA-Z_]\w*\s*,\s*["']([^"']+)["']\s*\)/i);
    if (superTitleMatch) {
      superTitle = superTitleMatch[1];
    }

    // MULTI-TILE LAYOUT HANDLER (e.g. tiledlayout(2,2) with nexttile)
    if (hasTiledLayout) {
      const rows = tiledMatch ? Number(tiledMatch[1]) : 2;
      const cols = tiledMatch ? Number(tiledMatch[2]) : 2;

      // Split code by 'nexttile'
      const chunks = raw.split(/nexttile/i).filter(Boolean);
      // Remove first chunk if it's just setup (e.g. tiledlayout(...))
      const tileChunks = chunks.length > 1 && !chunks[0].includes('plot(') ? chunks.slice(1) : chunks;

      const colors = ['#38bdf8', '#ec4899', '#a855f7', '#10b981', '#f59e0b', '#06b6d4'];

      const tiles = tileChunks.map((chunk, idx) => {
        let tileTitle = `Subplot ${idx + 1}`;
        const titleM = chunk.match(/title\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (titleM) tileTitle = titleM[1];

        const chunkLower = chunk.toLowerCase();
        let points = [];
        let fnLabel = 'y = f(x)';

        if (chunkLower.includes('sin(')) {
          fnLabel = 'y = sin(x)';
          for (let x = 0; x <= 6.28; x += 0.15) {
            points.push({ x: Number(x.toFixed(2)), y: Number(Math.sin(x).toFixed(3)) });
          }
        } else if (chunkLower.includes('cos(')) {
          fnLabel = 'y = cos(x)';
          for (let x = 0; x <= 6.28; x += 0.15) {
            points.push({ x: Number(x.toFixed(2)), y: Number(Math.cos(x).toFixed(3)) });
          }
        } else if (chunkLower.includes('tan(')) {
          fnLabel = 'y = tan(x)';
          for (let x = 0; x <= 6.28; x += 0.1) {
            const cosVal = Math.cos(x);
            // Skip points near asymptote
            if (Math.abs(cosVal) > 0.15) {
              const yVal = Math.tan(x);
              points.push({ x: Number(x.toFixed(2)), y: Number(Math.max(-4, Math.min(4, yVal)).toFixed(3)) });
            }
          }
        } else if (chunkLower.includes('sec(')) {
          fnLabel = 'y = sec(x)';
          for (let x = 0; x <= 6.28; x += 0.1) {
            const cosVal = Math.cos(x);
            if (Math.abs(cosVal) > 0.15) {
              const yVal = 1 / cosVal;
              points.push({ x: Number(x.toFixed(2)), y: Number(Math.max(-4, Math.min(4, yVal)).toFixed(3)) });
            }
          }
        } else {
          // Default harmonic curve
          fnLabel = `y = f_${idx + 1}(x)`;
          for (let x = 0; x <= 6.28; x += 0.15) {
            points.push({ x: Number(x.toFixed(2)), y: Number(Math.sin(x * (idx + 1) * 0.8).toFixed(3)) });
          }
        }

        return {
          id: `tile-${idx}`,
          title: tileTitle,
          fnLabel,
          color: colors[idx % colors.length],
          points,
          xlabel: 'x',
          ylabel: 'y'
        };
      });

      return {
        isMultiTile: true,
        superTitle,
        grid: { rows, cols },
        tiles
      };
    }

    // SINGLE PLOT HANDLER
    const lines = raw.split('\n');
    let title = 'MATLAB Figure 1';
    let xlabel = 'Time (seconds)';
    let ylabel = 'Signal Amplitude (V)';
    let detectedType = 'line';

    for (const l of lines) {
      const trimmed = l.trim();
      const titleM = trimmed.match(/title\(['"]([^'"]+)['"]\)/i);
      if (titleM) title = titleM[1];

      const xM = trimmed.match(/xlabel\(['"]([^'"]+)['"]\)/i);
      if (xM) xlabel = xM[1];

      const yM = trimmed.match(/ylabel\(['"]([^'"]+)['"]\)/i);
      if (yM) ylabel = yM[1];

      if (trimmed.includes('bar(')) detectedType = 'bar';
      else if (trimmed.includes('scatter(')) detectedType = 'scatter';
      else if (trimmed.includes('stem(')) detectedType = 'stem';
      else if (trimmed.includes('heatmap(') || trimmed.includes('surf(')) detectedType = 'heatmap';
    }

    let series = [];
    if (lower.includes('cos') && lower.includes('sin')) {
      const pts1 = [];
      const pts2 = [];
      for (let x = 0; x <= 6.28; x += 0.12) {
        pts1.push({ x: Number(x.toFixed(2)), y: Number(Math.sin(x).toFixed(3)) });
        pts2.push({ x: Number(x.toFixed(2)), y: Number(Math.cos(x).toFixed(3)) });
      }
      series = [
        { name: 'sin(x)', color: '#38bdf8', points: pts1 },
        { name: 'cos(x)', color: '#ec4899', points: pts2 }
      ];
    } else if (lower.includes('cos')) {
      const pts = [];
      for (let x = 0; x <= 10; x += 0.15) {
        pts.push({ x: Number(x.toFixed(2)), y: Number((Math.cos(x) * Math.exp(-0.15 * x)).toFixed(3)) });
      }
      series = [{ name: 'cos(x) · e^{-0.15x}', color: '#38bdf8', points: pts }];
    } else if (lower.includes('exp') || lower.includes('damped')) {
      const pts = [];
      for (let x = 0; x <= 8; x += 0.15) {
        pts.push({ x: Number(x.toFixed(2)), y: Number((Math.exp(-0.35 * x) * Math.sin(2.5 * x)).toFixed(3)) });
      }
      series = [{ name: 'Damped Oscillation', color: '#a855f7', points: pts }];
    } else if (lower.includes('bar') || detectedType === 'bar') {
      const categories = ['Task A', 'Task B', 'Task C', 'Task D', 'Task E', 'Task F'];
      const values = [28, 48, 76, 92, 64, 85];
      series = [{
        name: 'Dataset Metrics',
        color: '#38bdf8',
        bars: categories.map((cat, i) => ({ label: cat, value: values[i] }))
      }];
    } else {
      const pts = [];
      for (let x = 0; x <= 10; x += 0.2) {
        pts.push({ x: Number(x.toFixed(2)), y: Number((Math.sin(x) * (1 + 0.08 * x)).toFixed(3)) });
      }
      series = [{ name: 'f(x) = sin(x)', color: '#38bdf8', points: pts }];
    }

    return {
      isMultiTile: false,
      title,
      xlabel,
      ylabel,
      detectedType,
      series
    };
  }, [code]);

  // Coordinate calculations helper for any curve
  const computePlotSvgCoords = (points = [], width = 560, height = 300, padding = { l: 45, r: 25, t: 25, b: 35 }) => {
    if (!points.length) return { pathData: '', xs: [], ys: [], minX: 0, maxX: 10, minY: -1, maxY: 1 };
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(-1, Math.min(...ys));
    const maxY = Math.max(1, Math.max(...ys));
    const spanX = (maxX - minX) || 1;
    const spanY = (maxY - minY) || 1;
    const plotW = width - padding.l - padding.r;
    const plotH = height - padding.t - padding.b;

    const map = (x, y) => ({
      x: padding.l + ((x - minX) / spanX) * plotW,
      y: padding.t + plotH - ((y - minY) / spanY) * plotH
    });

    const pathData = points.map((p, i) => {
      const c = map(p.x, p.y);
      return `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    }).join(' ');

    return { pathData, minX, maxX, minY, maxY, map };
  };

  // Parse JavaFX / Desktop GUI components from code
  const parsedGuiComponents = useMemo(() => {
    const lines = (code || '').split('\n');
    let windowTitle = 'JavaFX Application - Virtual Desktop Stage';
    const buttons = [];
    const labels = [];
    const textfields = [];
    const checkboxes = [];
    let hasSlider = false;

    for (const l of lines) {
      const trimmed = l.trim();
      const titleM = trimmed.match(/(?:setTitle|title)\s*\(\s*["']([^"']+)["']\s*\)/i);
      if (titleM) windowTitle = titleM[1];

      const btnM = trimmed.match(/(?:new\s+(?:JButton|Button)|tk\.Button)\s*\(\s*(?:[^,"']*,\s*)?(?:text\s*=\s*)?["']([^"']+)["']/i);
      if (btnM) buttons.push({ id: `btn-${buttons.length}`, text: btnM[1] });

      const lblM = trimmed.match(/(?:new\s+(?:JLabel|Label)|tk\.Label)\s*\(\s*(?:[^,"']*,\s*)?(?:text\s*=\s*)?["']([^"']+)["']/i);
      if (lblM) labels.push({ id: `lbl-${labels.length}`, text: lblM[1] });

      const tfM = trimmed.match(/(?:new\s+(?:JTextField|TextField)|tk\.Entry)\s*\(\s*["']?([^"']*)["']?\s*\)/i);
      if (tfM) textfields.push({ id: `tf-${textfields.length}`, placeholder: tfM[1] || 'Enter parameter...' });

      const cbM = trimmed.match(/(?:new\s+(?:JCheckBox|CheckBox)|tk\.Checkbutton)\s*\(\s*(?:[^,"']*,\s*)?(?:text\s*=\s*)?["']([^"']+)["']/i);
      if (cbM) checkboxes.push({ id: `cb-${checkboxes.length}`, label: cbM[1] });

      if (trimmed.includes('Slider') || trimmed.includes('JSlider') || trimmed.includes('Scale(')) {
        hasSlider = true;
      }
    }

    if (buttons.length === 0 && labels.length === 0 && textfields.length === 0) {
      return {
        windowTitle: 'JavaFX Stage - Interactive Desktop GUI',
        labels: [{ id: 'lbl-1', text: 'Elite IDE Interactive JavaFX Runtime' }],
        buttons: [
          { id: 'btn-1', text: 'Execute Action' },
          { id: 'btn-2', text: 'Clear / Reset' }
        ],
        textfields: [{ id: 'tf-1', placeholder: 'Enter variable data...' }],
        checkboxes: [{ id: 'cb-1', label: 'Enable High Performance JIT Engine' }],
        hasSlider: true
      };
    }

    return { windowTitle, labels, buttons, textfields, checkboxes, hasSlider };
  }, [code]);

  const handleBackToEditor = () => {
    setWindowState('normal');
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`pro-visual-viewer-root ${windowState === 'maximized' ? 'is-fullscreen' : ''}`}>
      {/* =========================================================================
          1. FULLSCREEN PRO STUDIO TOPBAR
          ========================================================================= */}
      {windowState === 'maximized' && (
        <header className="pro-fullscreen-topbar">
          <div className="fs-topbar-left">
            <button
              type="button"
              className="fs-exit-btn"
              onClick={() => setWindowState('normal')}
              title="Exit Fullscreen (Esc)"
              id="btn-fs-exit"
            >
              <ArrowLeft size={16} />
              <span>Exit Fullscreen</span>
              <kbd className="fs-kbd-pill">Esc</kbd>
            </button>

            <span className="fs-v-divider" />

            <div className="fs-title-cluster">
              <span className="fs-figure-badge">MATLAB Figure</span>
              <span className="fs-figure-title">
                {parsedPlotData.isMultiTile ? parsedPlotData.superTitle : parsedPlotData.title}
              </span>
            </div>
          </div>

          <div className="fs-topbar-center">
            {/* Mode Switcher */}
            <div className="pro-segmented-control">
              <button
                type="button"
                className={`pro-segment-btn ${activeMode === 'plot' ? 'active' : ''}`}
                onClick={() => setActiveMode('plot')}
              >
                <LineChartIcon size={14} />
                <span>MATLAB Figure</span>
              </button>
              <button
                type="button"
                className={`pro-segment-btn ${activeMode === 'gui_window' ? 'active' : ''}`}
                onClick={() => setActiveMode('gui_window')}
              >
                <AppWindow size={14} />
                <span>Desktop GUI</span>
              </button>
              <button
                type="button"
                className={`pro-segment-btn ${activeMode === 'matrix' ? 'active' : ''}`}
                onClick={() => setActiveMode('matrix')}
              >
                <Palette size={14} />
                <span>Heatmap</span>
              </button>
            </div>
          </div>

          <div className="fs-topbar-right">
            <button
              type="button"
              className={`fs-icon-toggle-btn ${showGrid ? 'active' : ''}`}
              onClick={() => setShowGrid(prev => !prev)}
              title="Toggle Grid (grid on / off)"
            >
              <Grid size={14} />
              <span>Grid</span>
            </button>

            <button
              type="button"
              className="fs-icon-toggle-btn"
              onClick={() => setFigureTheme(prev => prev === 'dark' ? 'matlab-classic' : 'dark')}
              title="Toggle MATLAB Classic / Obsidian Dark Canvas"
            >
              {figureTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{figureTheme === 'dark' ? 'Classic' : 'Dark'}</span>
            </button>

            <span className="fs-v-divider" />

            {onClose && (
              <button
                type="button"
                className="fs-back-editor-btn"
                onClick={handleBackToEditor}
                title="Return to Code Editor & Console"
              >
                <Code2 size={14} />
                <span>Editor</span>
              </button>
            )}

            <button
              type="button"
              className="fs-close-x-btn"
              onClick={() => setWindowState('normal')}
              title="Exit Fullscreen (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </header>
      )}

      {/* =========================================================================
          2. NORMAL VIEW TOOLBAR (Compact, non-wrapping single line)
          ========================================================================= */}
      {windowState !== 'maximized' && (
        <div className="pro-panel-toolbar">
          {/* Left: Mode Switcher */}
          <div className="pro-segmented-control">
            <button
              type="button"
              className={`pro-segment-btn ${activeMode === 'plot' ? 'active' : ''}`}
              onClick={() => setActiveMode('plot')}
              title="MATLAB / Scientific Figure Plot"
            >
              <LineChartIcon size={13} className="text-cyan-400" />
              <span>MATLAB Figure</span>
            </button>
            <button
              type="button"
              className={`pro-segment-btn ${activeMode === 'gui_window' ? 'active' : ''}`}
              onClick={() => setActiveMode('gui_window')}
              title="JavaFX / Swing Desktop Window"
            >
              <AppWindow size={13} className="text-violet-400" />
              <span>GUI</span>
            </button>
            <button
              type="button"
              className={`pro-segment-btn ${activeMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveMode('matrix')}
              title="2D Matrix Numerical Heatmap"
            >
              <Palette size={13} className="text-amber-400" />
              <span>Matrix</span>
            </button>
          </div>

          {/* Center info */}
          <div className="pro-center-meta">
            {parsedPlotData.isMultiTile && (
              <span className="pro-tiled-badge">
                <LayoutGrid size={11} />
                <span>TiledLayout ({parsedPlotData.tiles.length} plots)</span>
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="pro-toolbar-actions">
            <button
              type="button"
              className="pro-action-btn fullscreen-btn"
              onClick={() => setWindowState('maximized')}
              title="Enter Fullscreen Canvas (F11)"
              id="btn-viewer-fullscreen"
            >
              <Maximize2 size={13} />
              <span>Fullscreen</span>
            </button>

            {onClose && (
              <button
                type="button"
                className="pro-action-btn close-btn"
                onClick={handleBackToEditor}
                title="Return to Terminal"
                id="btn-viewer-close"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. MAIN CANVAS VIEWPORT
          ========================================================================= */}
      <div className={`pro-viewport-canvas ${windowState === 'maximized' ? 'is-fullscreen' : ''}`}>
        {/* =====================================================================
            MODE 1: MATLAB SCIENTIFIC FIGURE (Single Plot OR TiledLayout Grid!)
            ===================================================================== */}
        {activeMode === 'plot' && (
          <div className={`matlab-pro-figure-frame ${figureTheme}`}>
            {/* Authentic MATLAB Figure Titlebar */}
            <div className="matlab-figure-titlebar">
              <div className="matlab-window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="matlab-title-text">
                <span>{parsedPlotData.isMultiTile ? parsedPlotData.superTitle : parsedPlotData.title}</span>
              </div>
              <div className="matlab-meta-right">
                <span className="matlab-backend-tag">MATLAB R2024b Graphics Engine</span>
              </div>
            </div>

            {/* Authentic MATLAB Figure Menu Strip */}
            <div className="matlab-menu-strip">
              <span className="matlab-menu-item">File</span>
              <span className="matlab-menu-item">Edit</span>
              <span className="matlab-menu-item">View</span>
              <span className="matlab-menu-item">Insert</span>
              <span className="matlab-menu-item active">Tools</span>
              <span className="matlab-menu-item">Desktop</span>
              <span className="matlab-menu-item">Window</span>
              <span className="matlab-menu-item">Help</span>

              <div className="matlab-menu-tools">
                <button
                  type="button"
                  className={`matlab-tool-btn ${showGrid ? 'active' : ''}`}
                  onClick={() => setShowGrid(prev => !prev)}
                  title="Toggle Grid (grid on / off)"
                >
                  <Grid size={12} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  className="matlab-tool-btn"
                  onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                  title="Zoom In"
                >
                  <ZoomIn size={12} />
                </button>
                <button
                  type="button"
                  className="matlab-tool-btn"
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                  title="Zoom Out"
                >
                  <ZoomOut size={12} />
                </button>
                <button
                  type="button"
                  className="matlab-tool-btn"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* FIGURE CANVAS AREA */}
            <div className="matlab-svg-stage">
              {/* CASE A: MULTI-TILE LAYOUT (e.g. tiledlayout(2,2)) */}
              {parsedPlotData.isMultiTile ? (
                <div className="matlab-multi-tile-wrapper" style={{ transform: `scale(${zoomLevel})` }}>
                  {parsedPlotData.superTitle && (
                    <div className="matlab-super-title">
                      <h3>{parsedPlotData.superTitle}</h3>
                    </div>
                  )}

                  <div className="matlab-tiles-grid" style={{ '--tile-cols': parsedPlotData.grid.cols || 2 }}>
                    {parsedPlotData.tiles.map((tile, tIdx) => {
                      const tileCoords = computePlotSvgCoords(tile.points, 320, 180, { l: 40, r: 18, t: 22, b: 28 });
                      return (
                        <div key={tile.id || tIdx} className="matlab-single-tile-card">
                          <div className="tile-card-header">
                            <span className="tile-badge">{tile.title}</span>
                            <span className="tile-fn-label" style={{ color: tile.color }}>{tile.fnLabel}</span>
                          </div>

                          <div className="tile-svg-box">
                            <svg className="tile-svg" viewBox="0 0 320 180">
                              {/* Grid */}
                              {showGrid && (
                                <g className="tile-grid-lines">
                                  {[40, 80, 120].map(y => (
                                    <line key={y} x1="40" y1={y} x2="300" y2={y} stroke={figureTheme === 'dark' ? '#1f2937' : '#e2e8f0'} strokeDasharray="2 2" strokeWidth="0.8" />
                                  ))}
                                  {[100, 170, 240].map(x => (
                                    <line key={x} x1={x} y1="20" x2={x} y2="150" stroke={figureTheme === 'dark' ? '#1f2937' : '#e2e8f0'} strokeDasharray="2 2" strokeWidth="0.8" />
                                  ))}
                                </g>
                              )}

                              {/* Axes */}
                              <line x1="40" y1="150" x2="302" y2="150" stroke={figureTheme === 'dark' ? '#4b5563' : '#64748b'} strokeWidth="1.2" />
                              <line x1="40" y1="20" x2="40" y2="150" stroke={figureTheme === 'dark' ? '#4b5563' : '#64748b'} strokeWidth="1.2" />

                              {/* Curve */}
                              <path
                                d={tileCoords.pathData}
                                fill="none"
                                stroke={tile.color}
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* Discrete Dots */}
                              {tile.points.filter((_, idx) => idx % 4 === 0).map((pt, pIdx) => {
                                const c = tileCoords.map(pt.x, pt.y);
                                return (
                                  <circle
                                    key={pIdx}
                                    cx={c.x}
                                    cy={c.y}
                                    r="2.5"
                                    fill={tile.color}
                                    stroke="#fff"
                                    strokeWidth="0.5"
                                  />
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* CASE B: SINGLE LARGE MATLAB PLOT */
                <div className="matlab-svg-scaler" style={{ transform: `scale(${zoomLevel})` }}>
                  {(() => {
                    const singleCoords = computePlotSvgCoords(parsedPlotData.series[0]?.points || [], 620, 340, { l: 55, r: 35, t: 30, b: 45 });
                    return (
                      <svg
                        ref={svgRef}
                        className="matlab-main-svg"
                        viewBox="0 0 620 340"
                        onMouseMove={(e) => {
                          if (!svgRef.current) return;
                          const rect = svgRef.current.getBoundingClientRect();
                          const clientX = e.clientX - rect.left;
                          const clientY = e.clientY - rect.top;
                          const scaleX = 620 / rect.width;
                          const scaleY = 340 / rect.height;
                          const cx = clientX * scaleX;
                          const cy = clientY * scaleY;
                          if (cx >= 55 && cx <= 585 && cy >= 30 && cy <= 295) {
                            const dataX = (cx - 55) / 530 * (singleCoords.maxX - singleCoords.minX) + singleCoords.minX;
                            const dataY = (295 - cy) / 265 * (singleCoords.maxY - singleCoords.minY) + singleCoords.minY;
                            setCrosshairPos({ svgX: cx, svgY: cy, x: Number(dataX.toFixed(2)), y: Number(dataY.toFixed(3)) });
                          } else {
                            setCrosshairPos(null);
                          }
                        }}
                        onMouseLeave={() => setCrosshairPos(null)}
                      >
                        {/* Grid */}
                        {showGrid && (
                          <g className="matlab-grid-lines">
                            {[65, 125, 185, 245].map(y => (
                              <line key={y} x1="55" y1={y} x2="585" y2={y} stroke={figureTheme === 'dark' ? '#1f2937' : '#e2e8f0'} strokeDasharray="3 3" strokeWidth="1" />
                            ))}
                            {[140, 225, 310, 395, 480].map(x => (
                              <line key={x} x1={x} y1="30" x2={x} y2="295" stroke={figureTheme === 'dark' ? '#1f2937' : '#e2e8f0'} strokeDasharray="3 3" strokeWidth="1" />
                            ))}
                          </g>
                        )}

                        {/* Axes */}
                        <line x1="55" y1="295" x2="585" y2="295" stroke={figureTheme === 'dark' ? '#4b5563' : '#64748b'} strokeWidth="1.5" />
                        <line x1="55" y1="30" x2="55" y2="295" stroke={figureTheme === 'dark' ? '#4b5563' : '#64748b'} strokeWidth="1.5" />

                        {/* Axis Labels */}
                        <text x="320" y="328" textAnchor="middle" fill={figureTheme === 'dark' ? '#cbd5e1' : '#334155'} fontSize="11" fontWeight="600">
                          {parsedPlotData.xlabel}
                        </text>
                        <text x="18" y="165" textAnchor="middle" fill={figureTheme === 'dark' ? '#cbd5e1' : '#334155'} fontSize="11" fontWeight="600" transform="rotate(-90 18 165)">
                          {parsedPlotData.ylabel}
                        </text>

                        {/* Curves */}
                        {parsedPlotData.series.map((s, idx) => {
                          const coords = computePlotSvgCoords(s.points, 620, 340, { l: 55, r: 35, t: 30, b: 45 });
                          return (
                            <g key={s.name || idx}>
                              <path
                                d={coords.pathData}
                                fill="none"
                                stroke={s.color}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {s.points.filter((_, i) => i % 2 === 0).map((p, pIdx) => {
                                const ptC = coords.map(p.x, p.y);
                                return (
                                  <circle
                                    key={pIdx}
                                    cx={ptC.x}
                                    cy={ptC.y}
                                    r="2.5"
                                    fill={s.color}
                                    stroke="#ffffff"
                                    strokeWidth="0.8"
                                    className="matlab-data-dot"
                                    onMouseEnter={() => setHoveredPoint(p)}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                  />
                                );
                              })}
                            </g>
                          );
                        })}

                        {/* Crosshair */}
                        {crosshairPos && (
                          <g className="matlab-crosshair">
                            <line x1="55" y1={crosshairPos.svgY} x2="585" y2={crosshairPos.svgY} stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                            <line x1={crosshairPos.svgX} y1="30" x2={crosshairPos.svgX} y2="295" stroke="#38bdf8" strokeDasharray="2 2" strokeWidth="1" opacity="0.8" />
                            <circle cx={crosshairPos.svgX} cy={crosshairPos.svgY} r="4" fill="#38bdf8" />
                          </g>
                        )}
                      </svg>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Authentic MATLAB Figure Footer */}
            <div className="matlab-figure-footer">
              <div className="matlab-legends">
                {parsedPlotData.isMultiTile ? (
                  parsedPlotData.tiles.map(t => (
                    <div key={t.id} className="matlab-legend-badge">
                      <span className="legend-color-box" style={{ backgroundColor: t.color }} />
                      <span className="legend-label">{t.title}</span>
                    </div>
                  ))
                ) : (
                  parsedPlotData.series.map(s => (
                    <div key={s.name} className="matlab-legend-badge">
                      <span className="legend-color-box" style={{ backgroundColor: s.color }} />
                      <span className="legend-label">{s.name}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="matlab-coord-readout">
                {crosshairPos ? (
                  <span>Cursor: X = {crosshairPos.x}, Y = {crosshairPos.y}</span>
                ) : hoveredPoint ? (
                  <span>Point: X = {hoveredPoint.x}, Y = {hoveredPoint.y}</span>
                ) : (
                  <span className="text-muted">Hover over plot to inspect coordinates</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODE 2: JAVAFX / SWING DESKTOP APPLICATION WINDOW
            ===================================================================== */}
        {activeMode === 'gui_window' && (
          <div className="javafx-desktop-frame">
            <div className="javafx-os-window">
              <div className="javafx-chrome-header">
                <div className="javafx-mac-controls">
                  <span className="mac-circle mac-close" />
                  <span className="mac-circle mac-min" />
                  <span className="mac-circle mac-max" />
                </div>
                <div className="javafx-window-title">
                  <AppWindow size={14} className="text-violet-400" />
                  <span>{parsedGuiComponents.windowTitle}</span>
                </div>
                <div className="javafx-window-actions">
                  <span className="javafx-platform-badge">JavaFX 21 (LTS)</span>
                </div>
              </div>

              <div className="javafx-scene-body">
                {parsedGuiComponents.labels.map((lbl, idx) => (
                  <div key={lbl.id || idx} className="javafx-label-item">
                    <span className="javafx-text-label">{lbl.text}</span>
                  </div>
                ))}

                <div className="javafx-event-counter-card">
                  <span className="event-title">Action Event Counter:</span>
                  <span className="event-count-badge">{guiClicks} Events Fired</span>
                </div>

                {parsedGuiComponents.textfields.map((tf, idx) => (
                  <div key={tf.id || idx} className="javafx-field-wrap">
                    <Type size={14} className="text-muted" />
                    <input
                      type="text"
                      className="javafx-input"
                      placeholder={tf.placeholder}
                      value={guiTextInputs[tf.id] || ''}
                      onChange={e => setGuiTextInputs(prev => ({ ...prev, [tf.id]: e.target.value }))}
                    />
                  </div>
                ))}

                {parsedGuiComponents.checkboxes.map((cb, idx) => {
                  const isChecked = !guiToggles[cb.id];
                  return (
                    <div
                      key={cb.id || idx}
                      className="javafx-toggle-row"
                      onClick={() => setGuiToggles(prev => ({ ...prev, [cb.id]: !prev[cb.id] }))}
                    >
                      <div className={`javafx-box ${isChecked ? 'active' : ''}`}>
                        {isChecked && <Check size={12} />}
                      </div>
                      <span className="javafx-toggle-label">{cb.label}</span>
                    </div>
                  );
                })}

                {parsedGuiComponents.hasSlider && (
                  <div className="javafx-slider-section">
                    <div className="slider-header-row">
                      <span className="slider-name">Slider Control:</span>
                      <span className="slider-readout">{guiSliderVal}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={guiSliderVal}
                      onChange={e => setGuiSliderVal(Number(e.target.value))}
                      className="javafx-range-slider"
                    />
                  </div>
                )}

                <div className="javafx-action-buttons-row">
                  {parsedGuiComponents.buttons.map((btn, idx) => (
                    <button
                      key={btn.id || idx}
                      type="button"
                      className={`javafx-interactive-btn ${idx === 0 ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        if (btn.text.toLowerCase().includes('clear') || btn.text.toLowerCase().includes('reset')) {
                          setGuiClicks(0);
                          setGuiEventLogs(prev => [...prev.slice(-4), `[Event]: Reset action triggered.`]);
                        } else {
                          const next = guiClicks + 1;
                          setGuiClicks(next);
                          setGuiEventLogs(prev => [...prev.slice(-4), `[Event #${next}]: Button "${btn.text}" clicked.`]);
                        }
                      }}
                    >
                      <MousePointerClick size={14} />
                      <span>{btn.text}</span>
                    </button>
                  ))}
                </div>

                <div className="javafx-mini-console">
                  <div className="console-title">Live JavaFX Event Stream:</div>
                  <div className="console-lines">
                    {guiEventLogs.map((log, i) => (
                      <div key={i} className="log-line">
                        <span className="log-arrow">&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="javafx-os-statusbar">
                <span className="status-live-dot" />
                <span>Active Scene Graph • 60 FPS Accelerated</span>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODE 3: MATRIX NUMERICAL HEATMAP
            ===================================================================== */}
        {activeMode === 'matrix' && (
          <div className="matrix-pro-heatmap-card">
            <div className="heatmap-header">
              <span className="heatmap-title">2D Numerical Matrix Heatmap Visualizer</span>
              <span className="heatmap-subtitle">Intensity distribution across matrix cells</span>
            </div>

            <div className="heatmap-grid-table">
              {[
                [18, 42, 75, 23, 88],
                [56, 89, 34, 67, 12],
                [90, 21, 65, 43, 99],
                [33, 76, 95, 15, 54]
              ].map((row, rIdx) => (
                <div key={rIdx} className="heatmap-grid-row">
                  {row.map((val, cIdx) => {
                    const intensity = val / 100;
                    return (
                      <div
                        key={cIdx}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: `rgba(56, 189, 248, ${0.12 + intensity * 0.78})`,
                          borderColor: `rgba(56, 189, 248, ${0.25 + intensity * 0.5})`
                        }}
                      >
                        <span className="cell-num">{val}</span>
                        <span className="cell-pos">[{rIdx},{cIdx}]</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="heatmap-scale-bar">
              <span>0 (Minimum)</span>
              <div className="scale-gradient" />
              <span>100 (Peak Value)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
