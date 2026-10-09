import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GitFork, 
  Layers, 
  Variable, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause,
  ChevronRight,
  Compass,
  Sparkles,
  Maximize2,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { parseCodeToGraph, extractVariables, generateAstTree } from '../services/astFlowchart';

export default function GraphicalView({ 
  code, 
  language, 
  onSelectLine, 
  selectedLine 
}) {
  const [tab, setTab] = useState('flowchart'); // 'flowchart' | 'ast' | 'variables'
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeNodeIndex, setActiveNodeIndex] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showZoomPresets, setShowZoomPresets] = useState(false);

  const containerRef = useRef(null);
  const simulationTimerRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const graph = parseCodeToGraph(code, language);
  const variables = extractVariables(code);
  const astTree = generateAstTree(code, language);

  const totalHeight = Math.max((graph.nodes.length + 1) * 82 + 100, 480);
  const svgWidth = 720;

  // Center / Focus on a specific node and smoothly glide the canvas camera
  const focusNode = useCallback((targetIdx) => {
    setActiveNodeIndex(targetIdx);
    const node = graph.nodes[targetIdx];
    if (!node) return;

    if (onSelectLine && node.line) {
      onSelectLine(node.line);
    }

    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const currentZoom = zoomRef.current;
      // Center the node in viewport smoothly
      const targetX = Math.round(clientWidth / 2 - node.x * currentZoom);
      const targetY = Math.round(clientHeight / 2 - node.y * currentZoom);
      setPan({ x: targetX, y: targetY });
    }
  }, [graph.nodes, onSelectLine]);

  // Fit view automatically
  const handleFitView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;
    const paddingX = clientWidth < 600 ? 30 : 60;
    const paddingY = clientWidth < 600 ? 40 : 80;
    const scaleX = (clientWidth - paddingX) / svgWidth;
    const scaleY = (clientHeight - paddingY) / totalHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.2);
    const safeScale = Math.max(Number(fitScale.toFixed(2)), 0.15);
    setZoom(safeScale);
    const offsetX = (clientWidth - svgWidth * safeScale) / 2;
    setPan({ x: Math.round(offsetX), y: clientWidth < 600 ? 15 : 30 });
  }, [totalHeight, svgWidth]);

  // Auto-fit on mount and when graph changes
  useEffect(() => {
    const t = setTimeout(() => {
      handleFitView();
    }, 120);
    return () => clearTimeout(t);
  }, [tab, graph.nodes.length, handleFitView]);

  // Mouse drag panning
  const handleMouseDown = (e) => {
    if (e.target.closest('.flow-node-group') || e.target.closest('.canvas-floating-toolbar')) return;
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

  // Touch panning & pinch-to-zoom state tracking
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

  // Touch Start Handler
  const handleTouchStart = (e) => {
    if (e.target.closest('.canvas-floating-toolbar') || e.target.closest('.canvas-status-tag')) {
      return;
    }

    const state = touchStateRef.current;
    state.isInteracting = true;
    state.startPan = { ...pan };
    state.touchStartTime = Date.now();
    state.hasMoved = false;

    if (e.touches.length === 1) {
      // 1-finger pan
      state.startTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      setIsDragging(true);

      // Check double tap to auto-fit view
      const now = Date.now();
      if (now - state.lastTapTime < 320) {
        handleFitView();
        state.lastTapTime = 0;
      } else {
        state.lastTapTime = now;
      }
    } else if (e.touches.length >= 2) {
      // 2-finger pinch-to-zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      state.initialPinchDist = dist;
      state.initialZoom = zoomRef.current;

      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      state.zoomCenter = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top
      };
      setIsDragging(true);
    }
  };

  // Touch Move Handler
  const handleTouchMove = (e) => {
    const state = touchStateRef.current;
    if (!state.isInteracting) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length === 1 && state.startTouches.length >= 1) {
      const curX = e.touches[0].clientX;
      const curY = e.touches[0].clientY;
      const deltaX = curX - state.startTouches[0].x;
      const deltaY = curY - state.startTouches[0].y;

      if (Math.hypot(deltaX, deltaY) > 5) {
        state.hasMoved = true;
      }

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

      const targetZoom = Math.min(Math.max(state.initialZoom * scale, 0.05), 20.0);
      const roundedZoom = Number(targetZoom.toFixed(2));

      const zCenter = state.zoomCenter;
      const curZoom = state.initialZoom;
      const nextPanX = zCenter.x - (zCenter.x - state.startPan.x) * (roundedZoom / curZoom);
      const nextPanY = zCenter.y - (zCenter.y - state.startPan.y) * (roundedZoom / curZoom);

      setZoom(roundedZoom);
      setPan({
        x: Math.round(nextPanX),
        y: Math.round(nextPanY)
      });
    }
  };

  // Touch End Handler
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

  // Smooth Unlimited Mouse Wheel Zoom (5% to 2000%)
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
        const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.05), 20.0);
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

  // Zoom by step (+ / -)
  const handleZoomChange = (delta) => {
    setZoom((prev) => {
      const next = delta > 0 ? prev * 1.25 : prev / 1.25;
      return Number(Math.min(Math.max(next, 0.05), 20.0).toFixed(2));
    });
  };

  // Set explicit preset zoom
  const handleSetPresetZoom = (val) => {
    setZoom(val);
    setShowZoomPresets(false);
  };

  // Step-by-Step Flow Simulation with Auto-Scroll Camera Follow
  const handleToggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simulationTimerRef.current);
      setIsSimulating(false);
      setActiveNodeIndex(null);
    } else {
      setIsSimulating(true);
      let idx = 0;
      focusNode(0);

      simulationTimerRef.current = setInterval(() => {
        idx++;
        if (idx >= graph.nodes.length) {
          clearInterval(simulationTimerRef.current);
          setIsSimulating(false);
          setActiveNodeIndex(null);
        } else {
          focusNode(idx);
        }
      }, 750);
    }
  };

  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Step forward in variables tracker
  const stepVariables = () => {
    if (variables.length === 0) return;
    const next = (activeStep + 1) % variables.length;
    setActiveStep(next);
    if (variables[next] && onSelectLine) {
      onSelectLine(variables[next].line);
    }
  };

  return (
    <div className="graphical-container">
      {/* Graphical Sub-header with Responsive Tabs */}
      <div className="graphical-header">
        <div className="graphical-tabs">
          <button 
            className={`graph-tab-btn ${tab === 'flowchart' ? 'active' : ''}`}
            onClick={() => setTab('flowchart')}
            id="tab-flowchart"
          >
            <GitFork size={14} />
            <span className="tab-full-label">Interactive Flowchart</span>
            <span className="tab-short-label">Flow</span>
            <span className="badge-count">{graph.nodes.length}</span>
          </button>

          <button 
            className={`graph-tab-btn ${tab === 'ast' ? 'active' : ''}`}
            onClick={() => setTab('ast')}
            id="tab-ast"
          >
            <Layers size={14} />
            <span className="tab-full-label">AST Structure</span>
            <span className="tab-short-label">AST</span>
          </button>

          <button 
            className={`graph-tab-btn ${tab === 'variables' ? 'active' : ''}`}
            onClick={() => setTab('variables')}
            id="tab-variables"
          >
            <Variable size={14} />
            <span className="tab-full-label">Memory & State</span>
            <span className="tab-short-label">State</span>
            {variables.length > 0 && <span className="badge-count">{variables.length}</span>}
          </button>
        </div>

        {tab === 'flowchart' && (
          <div className="graph-header-actions">
            <button 
              className={`simulate-btn ${isSimulating ? 'active' : ''}`}
              onClick={handleToggleSimulation}
              title={isSimulating ? 'Pause Flow Simulation' : 'Follow execution flow down node by node'}
            >
              {isSimulating ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              <span className="sim-btn-full">{isSimulating ? 'Following Flow...' : 'Simulate Flow'}</span>
              <span className="sim-btn-short">{isSimulating ? 'Pause' : 'Simulate'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Visualizer Body */}
      <div className="graphical-body">
        {/* TAB 1: UNLIMITED ZOOM FLOWCHART CANVAS WITH AUTO-SCROLL FOLLOW */}
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
            {/* Top Status & Instructions Badge */}
            <div className="canvas-status-tag">
              <Sparkles size={12} className="sparkle-cyan" />
              <span className="status-tag-desktop">
                {isSimulating 
                  ? 'Auto-following flow down node-by-node...' 
                  : 'Pinch / Drag to pan & zoom • Tap node to focus line'}
              </span>
              <span className="status-tag-mobile">
                {isSimulating ? 'Following flow...' : 'Pinch / Drag to explore'}
              </span>
            </div>

            {/* Floating Zoom Controls Toolbar */}
            <div className="canvas-floating-toolbar">
              <button 
                className="canvas-tool-btn" 
                title="Zoom Out (or Scroll Wheel Down)"
                onClick={() => handleZoomChange(-1)}
              >
                <ZoomOut size={15} />
              </button>

              {/* Interactive Zoom Slider */}
              <div className="zoom-slider-container" title="Drag to zoom freely">
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={Math.min(zoom, 5.0)}
                  onChange={(e) => setZoom(Number(Number(e.target.value).toFixed(2)))}
                  className="zoom-range-slider"
                />
              </div>

              <button 
                className="canvas-tool-btn" 
                title="Zoom In (or Scroll Wheel Up)"
                onClick={() => handleZoomChange(1)}
              >
                <ZoomIn size={15} />
              </button>

              {/* Preset Zoom Menu Toggle */}
              <div className="zoom-preset-wrapper">
                <button
                  className="zoom-percentage-btn"
                  onClick={() => setShowZoomPresets(!showZoomPresets)}
                  title="Select Zoom Preset"
                >
                  {Math.round(zoom * 100)}%
                </button>

                {showZoomPresets && (
                  <div className="zoom-presets-dropdown">
                    <button onClick={() => handleSetPresetZoom(0.25)}>25%</button>
                    <button onClick={() => handleSetPresetZoom(0.5)}>50%</button>
                    <button onClick={() => handleSetPresetZoom(0.75)}>75%</button>
                    <button onClick={() => handleSetPresetZoom(1.0)}>100% (Normal)</button>
                    <button onClick={() => handleSetPresetZoom(1.5)}>150%</button>
                    <button onClick={() => handleSetPresetZoom(2.0)}>200%</button>
                    <button onClick={() => handleSetPresetZoom(4.0)}>400%</button>
                    <button onClick={() => handleSetPresetZoom(8.0)}>800%</button>
                  </div>
                )}
              </div>

              {/* Fit Entire Flowchart to Screen */}
              <button 
                className="canvas-tool-btn" 
                title="Fit Entire Flowchart to Screen"
                onClick={handleFitView}
              >
                <Maximize2 size={14} />
              </button>

              {/* Reset to 100% Center View */}
              <button 
                className="canvas-tool-btn" 
                title="Reset to 100% Center View"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              >
                <Compass size={14} />
              </button>
            </div>

            {/* SVG Canvas with Infinite Dot Grid and Scale Transform */}
            <svg 
              width="100%" 
              height="100%" 
              className="canvas-svg"
            >
              <defs>
                {/* Dynamic Blueprint Dot Grid Pattern */}
                <pattern id="dotGridInfinite" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="rgba(255, 255, 255, 0.08)" />
                </pattern>

                {/* Arrowhead Markers */}
                <marker id="flowArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                </marker>
                <marker id="loopArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
                </marker>

                {/* Card Shadow Filters */}
                <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="rgba(0, 0, 0, 0.55)" />
                </filter>
                <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#38bdf8" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Dot Grid Canvas Background */}
              <rect width="100%" height="100%" fill="url(#dotGridInfinite)" />

              {/* Scalable & Zoomable Flowchart Graph Group with Smooth Camera Glide */}
              <g 
                className="zoomable-canvas-content"
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{
                  transformOrigin: '0 0',
                  transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.4, 1)'
                }}
              >
                {/* Connecting Edges with Smooth Orthogonal Curves */}
                {graph.edges.map((edge, idx) => {
                  const source = graph.nodes.find(n => n.id === edge.from);
                  const target = graph.nodes.find(n => n.id === edge.to);
                  if (!source || !target) return null;

                  const startX = source.x;
                  const startY = source.y + source.height / 2;
                  const endX = target.x;
                  const endY = target.y - target.height / 2;

                  const isLoopBack = target.y <= source.y;
                  let pathD = '';

                  if (isLoopBack) {
                    const rightOffset = Math.max(startX, endX) + 160;
                    pathD = `M ${startX + 100} ${source.y} C ${rightOffset} ${source.y}, ${rightOffset} ${target.y}, ${endX + 110} ${target.y}`;
                  } else {
                    const midY = (startY + endY) / 2;
                    pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
                  }

                  return (
                    <g key={`edge-${idx}`}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isLoopBack ? "rgba(168, 85, 247, 0.5)" : "rgba(56, 189, 248, 0.35)"}
                        strokeWidth="2.2"
                        strokeDasharray={isLoopBack ? "4 4" : "none"}
                        markerEnd={isLoopBack ? "url(#loopArrow)" : "url(#flowArrow)"}
                      />

                      {/* Edge Label Badge */}
                      {edge.label && !isLoopBack && (
                        <g transform={`translate(${(startX + endX) / 2 + 10}, ${(startY + endY) / 2 - 8})`}>
                          <rect 
                            x="-4" 
                            y="-8" 
                            width={edge.label.length * 7 + 10} 
                            height="16" 
                            rx="4" 
                            fill="#1e293b" 
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x="2"
                            y="4"
                            fill="#94a3b8"
                            fontSize="9.5"
                            fontWeight="600"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {edge.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Node Cards */}
                {graph.nodes.map((node, i) => {
                  const isSelected = selectedLine === node.line;
                  const isCurrentSim = activeNodeIndex === i;
                  const x = node.x - node.width / 2;
                  const y = node.y - node.height / 2;

                  let accentColor = '#38bdf8';
                  let typeBadge = 'STATEMENT';

                  if (node.category === 'start') {
                    accentColor = '#10b981';
                    typeBadge = 'ENTRY';
                  } else if (node.category === 'end') {
                    accentColor = '#ef4444';
                    typeBadge = 'TERMINAL';
                  } else if (node.category === 'decision') {
                    accentColor = '#f59e0b';
                    typeBadge = 'DECISION';
                  } else if (node.category === 'loop') {
                    accentColor = '#a855f7';
                    typeBadge = 'LOOP';
                  } else if (node.category === 'io') {
                    accentColor = '#ec4899';
                    typeBadge = 'I / O';
                  } else if (node.category === 'function') {
                    accentColor = '#06b6d4';
                    typeBadge = 'FUNCTION';
                  } else if (node.category === 'placeholder') {
                    accentColor = '#64748b';
                    typeBadge = 'GUIDE';
                  }

                  return (
                    <g 
                      key={node.id} 
                      className="flow-node-group"
                      onClick={() => focusNode(i)}
                      onTouchEnd={(e) => {
                        if (!touchStateRef.current?.hasMoved) {
                          e.stopPropagation();
                          focusNode(i);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Active glowing ring during execution / selection */}
                      {(isSelected || isCurrentSim) && (
                        <rect
                          x={x - 5}
                          y={y - 5}
                          width={node.width + 10}
                          height={node.height + 10}
                          rx="14"
                          fill="none"
                          stroke={isCurrentSim ? '#38bdf8' : '#fbbf24'}
                          strokeWidth="2.8"
                          filter="url(#activeGlow)"
                        />
                      )}

                      {/* Main Card Background */}
                      <rect
                        x={x}
                        y={y}
                        width={node.width}
                        height={node.height}
                        rx="8"
                        fill="#1e222b"
                        stroke={isSelected ? '#fbbf24' : isCurrentSim ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}
                        strokeWidth={isSelected || isCurrentSim ? '1.8' : '1'}
                        filter="url(#cardShadow)"
                      />

                      {/* Left Accent Strip */}
                      <rect
                        x={x}
                        y={y}
                        width="4.5"
                        height={node.height}
                        rx="2"
                        fill={accentColor}
                      />

                      {/* Line Number Chip */}
                      <rect
                        x={x + 10}
                        y={y + 8}
                        width="26"
                        height="16"
                        rx="3"
                        fill="rgba(0, 0, 0, 0.35)"
                        stroke="rgba(255, 255, 255, 0.08)"
                      />
                      <text
                        x={x + 23}
                        y={y + 19.5}
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        L{node.line}
                      </text>

                      {/* Category Badge */}
                      <text
                        x={x + 42}
                        y={y + 20}
                        fill={accentColor}
                        fontSize="8.5"
                        fontWeight="700"
                        letterSpacing="0.4"
                        fontFamily="'Inter', sans-serif"
                      >
                        {typeBadge}
                      </text>

                      {/* Node Primary Label */}
                      <text
                        x={x + 12}
                        y={y + 40}
                        fill="#f8fafc"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {node.label.length > 25 ? node.label.slice(0, 23) + '…' : node.label}
                      </text>
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
                        onClick={() => child.line && onSelectLine(child.line)}
                      >
                        <ChevronRight size={13} className="ast-arrow" />
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
                              onClick={() => sub.line && onSelectLine(sub.line)}
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
                <span className="vars-title">State & Stack Memory</span>
                <p className="vars-subtitle">Track memory allocation, variable bindings, and stepping order</p>
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
