import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  Database, 
  ArrowRightLeft, 
  ChevronRight, 
  CheckCircle2, 
  Cpu, 
  Code2, 
  Zap,
  Sliders,
  Plus
} from 'lucide-react';

export default function MemoryArrayVisualizer({
  code = '',
  language = 'python'
}) {
  // Extract initial array from user's code if present
  const extractedArray = useMemo(() => {
    const match = code.match(/(?:arr|numbers|nums|list|values|data|array)\s*=\s*\[([0-9\s,-]+)\]/i) ||
                  code.match(/int\s+(?:arr|nums|numbers)\[\]\s*=\s*\{([0-9\s,-]+)\}/i);
    if (match && match[1]) {
      const parsed = match[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      if (parsed.length >= 2) return parsed.slice(0, 12);
    }
    return [45, 12, 89, 34, 71, 23, 60, 15];
  }, [code]);

  const [arrayData, setArrayData] = useState(extractedArray);
  const [activePointers, setActivePointers] = useState({ i: 0, j: 1 });
  const [comparingIndices, setComparingIndices] = useState([]);
  const [swappingIndices, setSwappingIndices] = useState([]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stepSpeed, setStepSpeed] = useState(600); // ms
  const [simAlgorithm, setSimAlgorithm] = useState('bubble'); // 'bubble' | 'binary' | 'reverse'
  const [customInputVal, setCustomInputVal] = useState(arrayData.join(', '));
  const [searchTarget, setSearchTarget] = useState(34);
  const [searchStatus, setSearchStatus] = useState('');

  // Synchronize when code changes extracted array
  useEffect(() => {
    setArrayData(extractedArray);
    setCustomInputVal(extractedArray.join(', '));
    resetVisualization();
  }, [extractedArray]);

  const resetVisualization = () => {
    setIsAnimating(false);
    setActivePointers({ i: 0, j: 1 });
    setComparingIndices([]);
    setSwappingIndices([]);
    setSortedIndices([]);
    setSearchStatus('');
  };

  const handleUpdateCustomArray = () => {
    const parsed = customInputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (parsed.length >= 2) {
      setArrayData(parsed.slice(0, 14));
      resetVisualization();
    }
  };

  // 1. Animated Bubble Sort Step Simulator
  const runBubbleSortSimulation = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const arr = [...arrayData];
    const n = arr.length;
    const sorted = [];

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setActivePointers({ i: j, j: j + 1 });
        setComparingIndices([j, j + 1]);
        setSwappingIndices([]);
        await new Promise(r => setTimeout(r, stepSpeed));

        if (arr[j] > arr[j + 1]) {
          setSwappingIndices([j, j + 1]);
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          setArrayData([...arr]);
          await new Promise(r => setTimeout(r, stepSpeed));
        }
      }
      sorted.push(n - i - 1);
      setSortedIndices([...sorted]);
    }
    setSortedIndices(arr.map((_, idx) => idx));
    setComparingIndices([]);
    setSwappingIndices([]);
    setIsAnimating(false);
  };

  // 2. Animated Binary Search Simulator
  const runBinarySearchSimulation = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Ensure sorted first
    const sortedArr = [...arrayData].sort((a, b) => a - b);
    setArrayData(sortedArr);
    resetVisualization();

    let low = 0;
    let high = sortedArr.length - 1;
    let found = false;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      setActivePointers({ low, mid, high });
      setComparingIndices([mid]);
      setSearchStatus(`Checking mid index ${mid} (Value: ${sortedArr[mid]})...`);
      await new Promise(r => setTimeout(r, stepSpeed + 200));

      if (sortedArr[mid] === searchTarget) {
        setSortedIndices([mid]);
        setSearchStatus(`🎯 Target ${searchTarget} discovered at index ${mid}!`);
        found = true;
        break;
      } else if (sortedArr[mid] < searchTarget) {
        setSearchStatus(`${sortedArr[mid]} < ${searchTarget} → Discarding left half [${low}...${mid}]`);
        low = mid + 1;
      } else {
        setSearchStatus(`${sortedArr[mid]} > ${searchTarget} → Discarding right half [${mid}...${high}]`);
        high = mid - 1;
      }
      await new Promise(r => setTimeout(r, stepSpeed));
    }

    if (!found) {
      setSearchStatus(`Target ${searchTarget} was not found in the array.`);
    }
    setIsAnimating(false);
  };

  const maxValue = Math.max(...arrayData, 100);

  return (
    <div className="memory-visualizer-container">
      {/* Header */}
      <div className="mem-header">
        <div className="mem-header-left">
          <div className="mem-title-pill">
            <Cpu size={15} className="text-cyan" />
            <span>Memory Matrix & Array Simulator</span>
          </div>
          <span className="mem-sub">Live memory address registers & algorithm pointer visualizer</span>
        </div>

        <div className="mem-header-actions">
          {/* Quick Algorithm Switcher */}
          <div className="mem-algo-tabs">
            <button
              className={`mem-algo-btn ${simAlgorithm === 'bubble' ? 'active' : ''}`}
              onClick={() => { setSimAlgorithm('bubble'); resetVisualization(); }}
            >
              Bubble Sort
            </button>
            <button
              className={`mem-algo-btn ${simAlgorithm === 'binary' ? 'active' : ''}`}
              onClick={() => { setSimAlgorithm('binary'); resetVisualization(); }}
            >
              Binary Search
            </button>
          </div>

          <button
            className="mem-action-btn primary"
            onClick={simAlgorithm === 'bubble' ? runBubbleSortSimulation : runBinarySearchSimulation}
            disabled={isAnimating}
          >
            <Play size={13} fill="currentColor" />
            <span>{isAnimating ? 'Simulating...' : `Simulate ${simAlgorithm === 'bubble' ? 'Sort' : 'Search'}`}</span>
          </button>

          <button className="mem-icon-btn" onClick={resetVisualization} title="Reset Array">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="mem-stage">
        {/* Top Control Strip */}
        <div className="mem-input-bar">
          <div className="input-group">
            <span className="input-label">Array Data:</span>
            <input
              type="text"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              placeholder="e.g. 10, 25, 4, 89, 32"
              className="mem-text-input"
            />
            <button className="mem-apply-btn" onClick={handleUpdateCustomArray}>
              Apply
            </button>
          </div>

          {simAlgorithm === 'binary' && (
            <div className="input-group">
              <span className="input-label">Target:</span>
              <input
                type="number"
                value={searchTarget}
                onChange={(e) => setSearchTarget(parseInt(e.target.value, 10) || 0)}
                className="mem-target-input"
              />
            </div>
          )}

          {searchStatus && (
            <div className="search-status-banner">
              <span>{searchStatus}</span>
            </div>
          )}
        </div>

        {/* 3D Glass Bar Chart Canvas */}
        <div className="array-bars-canvas">
          {arrayData.map((val, idx) => {
            const heightPercent = Math.max(Math.round((val / maxValue) * 100), 16);
            const isComparing = comparingIndices.includes(idx);
            const isSwapping = swappingIndices.includes(idx);
            const isSorted = sortedIndices.includes(idx);

            let barColor = '#38bdf8';
            if (isSwapping) barColor = '#f59e0b';
            else if (isComparing) barColor = '#ec4899';
            else if (isSorted) barColor = '#10b981';

            return (
              <div key={idx} className="array-column-wrapper">
                {/* Pointer indicator tags above bar */}
                <div className="pointer-tag-slot">
                  {simAlgorithm === 'bubble' && (
                    <>
                      {activePointers.i === idx && <span className="pointer-tag i">i</span>}
                      {activePointers.j === idx && <span className="pointer-tag j">j</span>}
                    </>
                  )}
                  {simAlgorithm === 'binary' && (
                    <>
                      {activePointers.low === idx && <span className="pointer-tag low">L</span>}
                      {activePointers.mid === idx && <span className="pointer-tag mid">MID</span>}
                      {activePointers.high === idx && <span className="pointer-tag high">H</span>}
                    </>
                  )}
                </div>

                {/* 3D Bar */}
                <div 
                  className={`array-bar ${isComparing ? 'comparing' : ''} ${isSwapping ? 'swapping' : ''} ${isSorted ? 'sorted' : ''}`}
                  style={{ 
                    height: `${heightPercent}%`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 16px ${barColor}55`
                  }}
                >
                  <span className="bar-val-top">{val}</span>
                </div>

                {/* Index label below */}
                <div className="bar-index-label">
                  <span>[{idx}]</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hex Memory Address Allocation Matrix */}
        <div className="memory-address-table">
          <div className="table-header">
            <span>RAM HEAP MATRIX (STACK & REGISTER ALLOCATIONS)</span>
            <span className="table-meta">Simulated 64-bit Architecture</span>
          </div>

          <div className="matrix-grid">
            {arrayData.slice(0, 8).map((val, idx) => {
              const hexAddr = `0x7ffee${(idx * 4 + 1024).toString(16).toUpperCase()}`;
              return (
                <div key={idx} className="matrix-cell">
                  <div className="cell-top">
                    <span className="cell-var">arr[{idx}]</span>
                    <span className="cell-type">int32 (4B)</span>
                  </div>
                  <div className="cell-mid">
                    <span className="cell-val">{val}</span>
                  </div>
                  <div className="cell-bot">
                    <code>{hexAddr}</code>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
