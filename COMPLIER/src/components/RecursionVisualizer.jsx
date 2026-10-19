import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GitCommit, 
  Layers, 
  Play, 
  Pause,
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  CornerDownRight, 
  Flame,
  Code2,
  AlertCircle,
  FileCode,
  Zap,
  Info
} from 'lucide-react';

// Parser to extract recursive functions from user code
function parseRecursiveFunctions(code = '', language = 'python') {
  if (!code || !code.trim()) return [];
  const lang = (language || 'python').toLowerCase();
  const functions = [];

  // 1. Python Parser
  if (lang === 'python' || lang === 'py') {
    const pyRegex = /def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/g;
    let match;
    while ((match = pyRegex.exec(code)) !== null) {
      const funcName = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
      const startIndex = match.index;
      
      // Find indentation of this function
      const lines = code.slice(startIndex).split('\n');
      const headerLine = lines[0];
      const indentMatch = headerLine.match(/^(\s*)/);
      const baseIndent = indentMatch ? indentMatch[1].length : 0;
      
      let bodyLines = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const lineIndent = (line.match(/^(\s*)/) || [''])[0].length;
        if (lineIndent <= baseIndent) break;
        bodyLines.push(line);
      }
      const body = bodyLines.join('\n');

      // Check if function calls itself in its body
      const selfCallRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = body.match(selfCallRegex);
      if (calls && calls.length > 0) {
        // Detect branching: single call vs binary/multi branching
        const branchCount = calls.length;
        // Detect base case condition
        const baseCaseMatch = body.match(/if\s+([^:]+):\s*(?:return\s*([^;\n]+)|(\w+))/);
        functions.push({
          name: funcName,
          params,
          callCount: branchCount,
          isBranching: branchCount >= 2,
          baseCase: baseCaseMatch ? baseCaseMatch[1].trim() : 'Base Condition',
          rawBody: body
        });
      }
    }
  }

  // 2. C / C++ / Java / C# Parser
  if (['c', 'cpp', 'java', 'csharp', 'cs'].includes(lang)) {
    const cRegex = /(?:[a-zA-Z0-9_<>\*]+\s+)+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{/g;
    let match;
    while ((match = cRegex.exec(code)) !== null) {
      const funcName = match[1];
      if (['main', 'if', 'while', 'for', 'switch'].includes(funcName)) continue;
      const rawParams = match[2];
      const params = rawParams.split(',').map(p => {
        const parts = p.trim().split(/\s+/);
        return parts[parts.length - 1].replace(/[\*&]/g, '');
      }).filter(Boolean);

      // Find function body between matching braces
      const startIndex = match.index + match[0].length - 1;
      let depth = 0;
      let endIndex = startIndex;
      for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
      const body = code.slice(startIndex, endIndex);

      const selfCallRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = body.match(selfCallRegex);
      if (calls && calls.length > 0) {
        const branchCount = calls.length;
        const baseCaseMatch = body.match(/if\s*\(([^)]+)\)\s*(?:return\s*([^;\n]+)?;|\{([^}]+)\})/);
        functions.push({
          name: funcName,
          params,
          callCount: branchCount,
          isBranching: branchCount >= 2,
          baseCase: baseCaseMatch ? baseCaseMatch[1].trim() : 'Base Condition',
          rawBody: body
        });
      }
    }
  }

  // 3. JavaScript / TypeScript Parser
  if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
    const jsRegex = /(?:function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)|(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>))/g;
    let match;
    while ((match = jsRegex.exec(code)) !== null) {
      const funcName = match[1] || match[3];
      const rawParams = match[2] || match[4] || match[5] || '';
      const params = rawParams.split(',').map(p => p.trim()).filter(Boolean);

      const bodyChunk = code.slice(match.index, Math.min(code.length, match.index + 800));
      const selfCallRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const calls = bodyChunk.match(selfCallRegex);
      // More than 1 match means it calls itself (first match is definition if regex overlapped)
      if (calls && calls.length >= 1) {
        const branchCount = calls.length;
        functions.push({
          name: funcName,
          params,
          callCount: branchCount,
          isBranching: branchCount >= 2,
          baseCase: 'Base Condition',
          rawBody: bodyChunk
        });
      }
    }
  }

  return functions;
}

// Built-in Recursion Presets for instant 1-click loading if user's code has no recursion
const RECURSION_TEMPLATES = {
  fibonacci: {
    title: 'Fibonacci Tree (O(2^N) Branching)',
    codePython: `def fib(n):
    # Base Cases
    if n <= 0:
        return 0
    if n == 1:
        return 1
    # Binary Recursive Branching
    return fib(n - 1) + fib(n - 2)

print("Result for n=4:", fib(4))`,
    codeCpp: `#include <iostream>
using namespace std;

int fib(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    cout << "fib(4) = " << fib(4) << endl;
    return 0;
}`
  },
  factorial: {
    title: 'Factorial (O(N) Linear Stack)',
    codePython: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print("factorial(4) =", factorial(4))`,
    codeCpp: `#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    cout << "factorial(4) = " << factorial(4) << endl;
    return 0;
}`
  },
  gcd: {
    title: 'Euclidean GCD (O(log N) Divide & Conquer)',
    codePython: `def gcd(a, b):
    if b == 0:
        return a
    return gcd(b, a % b)

print("gcd(48, 18) =", gcd(48, 18))`,
    codeCpp: `#include <iostream>
using namespace std;

int gcd(int a, int b) {
    if (b == 0) return a;
    return gcd(b, a % b);
}

int main() {
    cout << "gcd(48, 18) = " << gcd(48, 18) << endl;
    return 0;
}`
  }
};

export default function RecursionVisualizer({
  code = '',
  language = 'python',
  onApplyCode = null,
  isMobile = false
}) {
  // 1. Detect recursive functions directly in user's active code
  const detectedFunctions = useMemo(() => {
    return parseRecursiveFunctions(code, language);
  }, [code, language]);

  const hasUserRecursion = detectedFunctions.length > 0;
  const activeFunc = hasUserRecursion ? detectedFunctions[0] : null;

  const [mobileRecTab, setMobileRecTab] = useState('stack'); // 'stack' | 'tree'
  const [inputValN, setInputValN] = useState(4);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(700);

  // Trace execution simulation for user's function or active preset
  const traceData = useMemo(() => {
    const steps = [];
    const stack = [];
    let callCounter = 1;
    const treeNodes = [];

    const funcName = activeFunc ? activeFunc.name : 'fib';
    const isBranching = activeFunc ? activeFunc.isBranching : true;
    const n = Math.max(0, Math.min(Number(inputValN) || 4, 6)); // Cap at 6 to avoid visual tree blowup

    if (isBranching) {
      // Tree branching recursion simulator (like fibonacci / divide & conquer)
      const simulateTree = (currN, depth = 0, parentId = null) => {
        const nodeId = `call-${callCounter++}`;
        const frame = { id: nodeId, func: `${funcName}(${currN})`, depth, val: currN };
        stack.push(frame);

        const node = { id: nodeId, label: `${funcName}(${currN})`, depth, parentId, val: currN, result: null, status: 'calling' };
        treeNodes.push(node);

        steps.push({
          action: `Push ${funcName}(${currN}) onto Call Stack (Depth: ${depth})`,
          stack: [...stack],
          activeNodeId: nodeId,
          type: 'push'
        });

        if (currN <= 0) {
          stack.pop();
          node.result = 0;
          node.status = 'returned';
          steps.push({
            action: `Base Case hit: ${funcName}(${currN}) returns 0`,
            stack: [...stack],
            activeNodeId: nodeId,
            result: 0,
            type: 'base_case'
          });
          return 0;
        }

        if (currN === 1) {
          stack.pop();
          node.result = 1;
          node.status = 'returned';
          steps.push({
            action: `Base Case hit: ${funcName}(1) returns 1`,
            stack: [...stack],
            activeNodeId: nodeId,
            result: 1,
            type: 'base_case'
          });
          return 1;
        }

        const leftRes = simulateTree(currN - 1, depth + 1, nodeId);
        const rightRes = simulateTree(currN - 2, depth + 1, nodeId);
        const total = leftRes + rightRes;

        stack.pop();
        node.result = total;
        node.status = 'returned';

        steps.push({
          action: `${funcName}(${currN}) combines (${leftRes} + ${rightRes}) ➔ returns ${total}`,
          stack: [...stack],
          activeNodeId: nodeId,
          result: total,
          type: 'pop'
        });

        return total;
      };

      simulateTree(n, 0, null);
    } else {
      // Linear recursion simulator (like factorial / sum)
      const simulateLinear = (currN, depth = 0) => {
        const nodeId = `call-${callCounter++}`;
        stack.push({ id: nodeId, func: `${funcName}(${currN})`, depth, val: currN });
        
        const node = { id: nodeId, label: `${funcName}(${currN})`, depth, val: currN, result: null };
        treeNodes.push(node);

        steps.push({
          action: `Call ${funcName}(${currN}) ➔ Stack Frame allocated at depth ${depth}`,
          stack: [...stack],
          activeNodeId: nodeId,
          type: 'push'
        });

        if (currN <= 1) {
          stack.pop();
          node.result = 1;
          steps.push({
            action: `Base Case: ${funcName}(${currN}) terminates recursion ➔ returns 1`,
            stack: [...stack],
            activeNodeId: nodeId,
            result: 1,
            type: 'base_case'
          });
          return 1;
        }

        const subRes = simulateLinear(currN - 1, depth + 1);
        const finalRes = currN * subRes;

        stack.pop();
        node.result = finalRes;

        steps.push({
          action: `${funcName}(${currN}) multiplies ${currN} * ${subRes} ➔ returns ${finalRes}`,
          stack: [...stack],
          activeNodeId: nodeId,
          result: finalRes,
          type: 'pop'
        });

        return finalRes;
      };

      simulateLinear(n, 0);
    }

    const maxDepth = Math.max(...treeNodes.map(t => t.depth), 0);
    return {
      steps,
      nodes: treeNodes,
      totalCalls: treeNodes.length,
      maxDepth: maxDepth + 1,
      finalResult: treeNodes[0]?.result
    };
  }, [activeFunc, inputValN]);

  // Reset step counter on code or input change
  useEffect(() => {
    setActiveStep(0);
    setIsPlaying(false);
  }, [code, inputValN]);

  // Playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && activeStep < traceData.steps.length - 1) {
      timer = setTimeout(() => {
        setActiveStep(prev => prev + 1);
      }, playbackSpeed);
    } else if (activeStep >= traceData.steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, traceData.steps.length, playbackSpeed]);

  const currentStepData = traceData.steps[activeStep] || traceData.steps[0] || { stack: [], action: '' };

  const handleLoadTemplate = (tplKey) => {
    if (!onApplyCode) return;
    const tpl = RECURSION_TEMPLATES[tplKey];
    if (tpl) {
      const src = (language === 'cpp' || language === 'c') ? tpl.codeCpp : tpl.codePython;
      onApplyCode(src);
    }
  };

  return (
    <div className="recursion-workbench-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Dynamic Header & Status Banner */}
      <div style={{
        padding: isMobile ? '8px 10px' : '12px 16px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: hasUserRecursion ? 'rgba(236, 72, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: hasUserRecursion ? '#f472b6' : '#38bdf8',
            padding: '5px',
            borderRadius: '6px'
          }}>
            <GitCommit size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? '0.82rem' : '0.9rem', color: '#f8fafc' }}>
                {hasUserRecursion ? `Live: ${activeFunc.name}()` : 'Recursion Engine'}
              </span>
              <span style={{
                fontSize: '0.66rem',
                textTransform: 'uppercase',
                background: hasUserRecursion ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: hasUserRecursion ? '#34d399' : '#fbbf24',
                padding: '1px 7px',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                {hasUserRecursion ? 'Detected' : 'Presets'}
              </span>
            </div>
            {!isMobile && (
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                {hasUserRecursion 
                  ? `Tracing "${activeFunc.name}" with ${activeFunc.callCount} recursive call(s) • Base Case: ${activeFunc.baseCase}`
                  : 'Write a recursive function in editor or pick an algorithm below to trace execution frames'}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Controls: Parameter Input & Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Param n:</span>
            <input 
              type="number"
              min="1"
              max="6"
              value={inputValN}
              onChange={(e) => setInputValN(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
              style={{
                width: '45px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '2px 4px'
              }}
              title="Test parameter value (1 to 6)"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="view-mode-action-btn"
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep <= 0}
              title="Step Backward"
              style={{ padding: '5px 8px' }}
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              className="view-mode-action-btn"
              onClick={() => setIsPlaying(p => !p)}
              style={{
                background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isPlaying ? '#f87171' : '#34d399',
                borderColor: isPlaying ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title={isPlaying ? 'Pause Simulation' : 'Play Step-by-Step Simulation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
              <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              className="view-mode-action-btn"
              onClick={() => setActiveStep(prev => Math.min(traceData.steps.length - 1, prev + 1))}
              disabled={activeStep >= traceData.steps.length - 1}
              title="Step Forward"
              style={{ padding: '5px 8px' }}
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              className="view-mode-action-btn"
              onClick={() => { setActiveStep(0); setIsPlaying(false); }}
              title="Reset Simulation"
              style={{ padding: '5px 8px' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* If user has no recursive function yet, show smart template loader chips */}
      {!hasUserRecursion && (
        <div style={{
          padding: isMobile ? '6px 10px' : '8px 16px',
          background: 'rgba(245, 158, 11, 0.08)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#fbbf24', flexShrink: 0 }}>
            <Sparkles size={14} />
            <span>{isMobile ? 'Templates:' : 'Load a recursive starter template directly into your editor:'}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {Object.entries(RECURSION_TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleLoadTemplate(key)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                + {tpl.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Stack vs Tree Tab Switcher */}
      {isMobile && (
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px 8px',
          gap: '6px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => setMobileRecTab('stack')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              background: mobileRecTab === 'stack' ? 'rgba(236, 72, 153, 0.25)' : 'transparent',
              color: mobileRecTab === 'stack' ? '#f472b6' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            🥞 Stack ({currentStepData.stack.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileRecTab('tree')}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              background: mobileRecTab === 'tree' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              color: mobileRecTab === 'tree' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            🌳 Tree Simulation
          </button>
        </div>
      )}

      {/* Main Split Layout: Left is LIFO Call Stack, Right is Call Tree & Narration */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Column: LIFO Call Stack Frames */}
        {(!isMobile || mobileRecTab === 'stack') && (
          <div style={{
            borderRight: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.4)',
            padding: isMobile ? '10px' : '14px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            height: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🥞 LIFO Call Stack ({currentStepData.stack.length} Frames)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                Depth: {currentStepData.stack.length > 0 ? currentStepData.stack[currentStepData.stack.length - 1].depth : 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '6px', flex: 1, minHeight: '120px' }}>
              {currentStepData.stack.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 8px', color: '#64748b', fontSize: '0.8rem' }}>
                  Stack is currently empty (All frames resolved)
                </div>
              ) : (
                currentStepData.stack.map((frame, idx) => {
                  const isTop = idx === currentStepData.stack.length - 1;
                  return (
                    <div
                      key={frame.id}
                      style={{
                        background: isTop ? 'rgba(236, 72, 153, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                        border: isTop ? '1px solid rgba(236, 72, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: isTop ? '0 0 12px rgba(236, 72, 153, 0.25)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isTop ? '#f472b6' : '#f1f5f9' }}>
                          {frame.func}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          Depth {frame.depth} • Param: {frame.val}
                        </span>
                      </div>
                      {isTop && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#ec4899', color: '#ffffff', padding: '1px 5px', borderRadius: '4px' }}>
                          TOP
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Stack Footprint Metrics */}
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.74rem',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div><strong>Max Stack Depth:</strong> {traceData.maxDepth} levels</div>
              <div><strong>Total Invocations:</strong> {traceData.totalCalls} calls</div>
              <div><strong>Space Complexity:</strong> O(Depth) = O({traceData.maxDepth})</div>
            </div>
          </div>
        )}

        {/* Right Column: Interactive Call Tree Visualization & Live Action Log */}
        {(!isMobile || mobileRecTab === 'tree') && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Action Step Bar */}
            <div style={{
              padding: isMobile ? '8px 12px' : '10px 16px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{
                  background: currentStepData.type === 'base_case' ? '#10b981' : currentStepData.type === 'push' ? '#ec4899' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  Step {activeStep + 1}/{traceData.steps.length}
                </span>
                <span style={{ fontSize: isMobile ? '0.76rem' : '0.84rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentStepData.action}
                </span>
              </div>

              {currentStepData.result !== undefined && (
                <span style={{ fontSize: isMobile ? '0.72rem' : '0.8rem', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Return: {currentStepData.result}
                </span>
              )}
            </div>

          {/* SVG Tree Display */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '650px' }}>
              {traceData.nodes.map((node) => {
                const isActive = node.id === currentStepData.activeNodeId;
                const isResolved = node.result !== null;
                return (
                  <div
                    key={node.id}
                    style={{
                      background: isActive 
                        ? 'rgba(236, 72, 153, 0.25)' 
                        : isResolved 
                        ? 'rgba(16, 185, 129, 0.12)' 
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isActive 
                        ? '2px solid #ec4899' 
                        : isResolved 
                        ? '1px solid rgba(16, 185, 129, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      textAlign: 'center',
                      minWidth: '100px',
                      boxShadow: isActive ? '0 0 15px rgba(236, 72, 153, 0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? '#f472b6' : '#f8fafc' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isResolved ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
                      {isResolved ? `returns ${node.result}` : 'waiting...'}
                    </div>
                  </div>
                );
              })}
            </div>

            {activeStep === traceData.steps.length - 1 && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '10px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={18} />
                <span>Recursion Finished! Final Computed Value: {traceData.finalResult}</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
