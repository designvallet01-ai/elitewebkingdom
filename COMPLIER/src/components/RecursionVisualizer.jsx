import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  Layers, 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  CornerDownRight, 
  Flame 
} from 'lucide-react';

export default function RecursionVisualizer({ code, language }) {
  const [selectedAlgo, setSelectedAlgo] = useState('fibonacci');
  const [paramN, setParamN] = useState(4);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate recursion call tree & call stack frames based on algorithm and input
  const simulationData = useMemo(() => {
    const steps = [];
    const stack = [];

    if (selectedAlgo === 'fibonacci') {
      let callId = 1;
      const rootNode = { id: 'node-1', name: `fib(${paramN})`, n: paramN, children: [], status: 'pending', result: null };

      const runFib = (n, parentNode, depth = 0) => {
        const currentId = `node-${callId++}`;
        const frame = { id: currentId, func: `fib(${n})`, depth, n };
        stack.push(frame);

        steps.push({
          action: `Call fib(${n})`,
          stack: [...stack],
          activeNodeId: currentId,
          type: 'push'
        });

        if (n <= 0) {
          stack.pop();
          steps.push({
            action: `fib(${n}) reached base case ➔ returns 0`,
            stack: [...stack],
            activeNodeId: currentId,
            result: 0,
            type: 'base_case'
          });
          return 0;
        }
        if (n === 1) {
          stack.pop();
          steps.push({
            action: `fib(${n}) reached base case ➔ returns 1`,
            stack: [...stack],
            activeNodeId: currentId,
            result: 1,
            type: 'base_case'
          });
          return 1;
        }

        const leftRes = runFib(n - 1, parentNode, depth + 1);
        const rightRes = runFib(n - 2, parentNode, depth + 1);
        const res = leftRes + rightRes;

        stack.pop();
        steps.push({
          action: `fib(${n}) returns ${leftRes} + ${rightRes} = ${res}`,
          stack: [...stack],
          activeNodeId: currentId,
          result: res,
          type: 'pop'
        });
        return res;
      };

      runFib(paramN, rootNode, 0);
    } else if (selectedAlgo === 'factorial') {
      let callId = 1;
      const runFact = (n, depth = 0) => {
        const currentId = `fact-${callId++}`;
        stack.push({ id: currentId, func: `factorial(${n})`, depth, n });

        steps.push({
          action: `Call factorial(${n})`,
          stack: [...stack],
          activeNodeId: currentId,
          type: 'push'
        });

        if (n <= 1) {
          stack.pop();
          steps.push({
            action: `factorial(${n}) base case ➔ returns 1`,
            stack: [...stack],
            activeNodeId: currentId,
            result: 1,
            type: 'base_case'
          });
          return 1;
        }

        const subRes = runFact(n - 1, depth + 1);
        const res = n * subRes;
        stack.pop();
        steps.push({
          action: `factorial(${n}) returns ${n} * ${subRes} = ${res}`,
          stack: [...stack],
          activeNodeId: currentId,
          result: res,
          type: 'pop'
        });
        return res;
      };

      runFact(Math.min(paramN, 6), 0);
    }

    return steps;
  }, [selectedAlgo, paramN]);

  const currentStepData = simulationData[activeStep] || simulationData[0] || { stack: [], action: '' };

  const handleNext = () => {
    setActiveStep(prev => Math.min(simulationData.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let step = activeStep;
      const interval = setInterval(() => {
        step++;
        if (step >= simulationData.length) {
          clearInterval(interval);
          setIsPlaying(false);
        } else {
          setActiveStep(step);
        }
      }, 700);
    }
  };

  return (
    <div className="recursion-visualizer-container">
      {/* Header Bar */}
      <div className="recursion-header">
        <div className="recursion-title-group">
          <GitCommit size={17} className="text-pink-400" />
          <span>Recursive Call Stack & Tree Engine</span>
          <span className="rec-badge">STACK TRACE</span>
        </div>

        <div className="recursion-controls">
          <select 
            className="rec-select"
            value={selectedAlgo}
            onChange={(e) => { setSelectedAlgo(e.target.value); setActiveStep(0); }}
          >
            <option value="fibonacci">Fibonacci Tree (Branching Recursion)</option>
            <option value="factorial">Factorial Stack (Linear Recursion)</option>
          </select>

          <div className="rec-param-group">
            <span className="rec-label">N:</span>
            <input 
              type="number" 
              min={1} 
              max={selectedAlgo === 'fibonacci' ? 5 : 6}
              value={paramN}
              onChange={(e) => { setParamN(Math.max(1, Math.min(6, parseInt(e.target.value) || 1))); setActiveStep(0); }}
              className="rec-number-input"
            />
          </div>

          <button 
            type="button" 
            className={`rec-btn ${isPlaying ? 'active' : ''}`}
            onClick={togglePlay}
          >
            <Play size={13} fill={isPlaying ? "currentColor" : "none"} />
            <span>{isPlaying ? 'Pause' : 'Auto Step'}</span>
          </button>

          <button type="button" className="rec-btn" onClick={handlePrev} disabled={activeStep === 0}>
            <ChevronLeft size={14} />
          </button>

          <button type="button" className="rec-btn" onClick={handleNext} disabled={activeStep >= simulationData.length - 1}>
            <ChevronRight size={14} />
          </button>

          <button type="button" className="rec-btn" onClick={handleReset} title="Reset">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Simulation View Split */}
      <div className="recursion-grid">
        {/* Left Side: Call Stack Frame Arena */}
        <div className="rec-stack-card">
          <div className="rec-card-header">
            <div className="rec-card-title">
              <Layers size={14} className="text-cyan-400" />
              <span>Call Stack Frames (LIFO Memory)</span>
            </div>
            <span className="rec-stack-depth">
              Depth: {currentStepData.stack?.length || 0} Frames
            </span>
          </div>

          <div className="rec-stack-body">
            {(!currentStepData.stack || currentStepData.stack.length === 0) ? (
              <div className="rec-stack-empty">
                <CheckCircle2 size={24} className="text-emerald-400" />
                <p>Call Stack Empty (Execution Completed)</p>
              </div>
            ) : (
              <div className="rec-stack-frames-list">
                {[...currentStepData.stack].reverse().map((frame, idx) => (
                  <div 
                    key={frame.id} 
                    className={`rec-frame-item ${idx === 0 ? 'top-frame' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="frame-meta">
                      <span className="frame-pointer">{idx === 0 ? '► ACTIVE (SP)' : `#${currentStepData.stack.length - 1 - idx}`}</span>
                      <span className="frame-depth">depth: {frame.depth}</span>
                    </div>
                    <div className="frame-func">
                      <code>{frame.func}</code>
                    </div>
                    <div className="frame-memory">
                      <span>arg: {frame.n}</span>
                      <span className="frame-addr">0x{((1000 + frame.depth * 32).toString(16)).toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Step Action & Explanation Terminal */}
        <div className="rec-action-card">
          <div className="rec-card-header">
            <div className="rec-card-title">
              <Flame size={14} className="text-amber-400" />
              <span>Execution Trace (Step {activeStep + 1} of {simulationData.length})</span>
            </div>
            <span className={`rec-event-badge ${currentStepData.type || 'info'}`}>
              {currentStepData.type ? currentStepData.type.toUpperCase() : 'STEP'}
            </span>
          </div>

          <div className="rec-action-content">
            <div className="rec-current-action-box">
              <CornerDownRight size={18} className="text-pink-400 flex-shrink-0" />
              <div className="rec-action-text">
                <strong>{currentStepData.action}</strong>
                {currentStepData.result !== undefined && (
                  <span className="rec-result-pill">Returned Value: {currentStepData.result}</span>
                )}
              </div>
            </div>

            <div className="rec-history-log">
              <div className="rec-history-header">Recent Stack History</div>
              <div className="rec-log-scroll">
                {simulationData.slice(0, activeStep + 1).map((s, idx) => (
                  <div key={idx} className={`rec-log-row ${idx === activeStep ? 'active-row' : ''}`}>
                    <span className="rec-log-index">#{idx + 1}</span>
                    <span className="rec-log-msg">{s.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
