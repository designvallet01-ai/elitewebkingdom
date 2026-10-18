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
  Plus,
  ArrowRight,
  Eye,
  Hash
} from 'lucide-react';

// Advanced Variable & Memory Parser for Python, C++, C, Java, JS
function parseMemoryFromCode(code = '', language = 'python') {
  if (!code || !code.trim()) {
    return {
      variables: [],
      arrays: [{ name: 'arr', type: 'int[]', values: [10, 20, 30, 40, 50], address: '0x7ffcc010' }]
    };
  }

  const variables = [];
  const arrays = [];
  let baseAddress = 0x7ffe0000;
  const nextHex = (offset = 4) => {
    baseAddress += offset;
    return '0x' + baseAddress.toString(16);
  };

  const lines = code.split('\n');

  // 1. Scan for Array / List definitions across all languages
  // Python: arr = [1, 2, 3]
  // C/C++: int arr[] = {1, 2, 3} or vector<int> arr = {1, 2, 3}
  // Java: int[] arr = {1, 2, 3} or new int[]{...}
  // JS: const arr = [1, 2, 3]
  const arrayRegex = /(?:(?:int|float|double|char|long|String|vector<[a-zA-Z0-9_]+>|let|const|var)\s+)?([a-zA-Z_]\w*)\s*(?:\[\s*\d*\s*\])?\s*=\s*(?:\[|\{)([^\]\}]+)(?:\]|\})/g;
  let arrMatch;
  while ((arrMatch = arrayRegex.exec(code)) !== null) {
    const arrName = arrMatch[1];
    if (['if', 'for', 'while', 'return'].includes(arrName)) continue;
    const itemsRaw = arrMatch[2];
    const items = itemsRaw
      .split(',')
      .map(x => x.trim().replace(/^['"]|['"]$/g, ''))
      .filter(x => x.length > 0)
      .map(x => {
        const num = Number(x);
        return isNaN(num) ? x : num;
      });

    if (items.length > 0) {
      arrays.push({
        name: arrName,
        type: typeof items[0] === 'number' ? 'int[]' : 'String[]',
        values: items.slice(0, 16),
        address: nextHex(32)
      });
    }
  }

  // 2. Scan for Primitive Variables (integers, floats, strings, booleans, pointers)
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return;

    // Python assignments: varName = value
    const pyVarMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*([^#;]+)$/);
    if (pyVarMatch && !trimmed.includes('[') && !trimmed.includes('{') && !trimmed.includes('def ')) {
      const varName = pyVarMatch[1];
      const valStr = pyVarMatch[2].trim();
      if (!['if', 'elif', 'else', 'return', 'import', 'from'].includes(varName)) {
        let type = 'str';
        let val = valStr;
        if (/^-?\d+$/.test(valStr)) { type = 'int'; val = parseInt(valStr, 10); }
        else if (/^-?\d+\.\d+$/.test(valStr)) { type = 'float'; val = parseFloat(valStr); }
        else if (valStr === 'True' || valStr === 'False') { type = 'bool'; val = valStr; }
        else { val = valStr.replace(/^['"]|['"]$/g, ''); }

        variables.push({ name: varName, type, value: val, address: nextHex(4) });
      }
    }

    // C / C++ / Java variable declarations: int x = 10; float f = 3.14; etc.
    const cVarMatch = trimmed.match(/^(?:int|float|double|char|bool|long|String|auto)\s+([a-zA-Z_]\w*)\s*=\s*([^;]+);/);
    if (cVarMatch) {
      const varName = cVarMatch[1];
      const valStr = cVarMatch[2].trim();
      variables.push({
        name: varName,
        type: trimmed.split(/\s+/)[0],
        value: valStr.replace(/^['"]|['"]$/g, ''),
        address: nextHex(4)
      });
    }

    // C / C++ Pointers: int *ptr = &x;
    const ptrMatch = trimmed.match(/([a-zA-Z0-9_]+)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*&([a-zA-Z_]\w*);/);
    if (ptrMatch) {
      variables.push({
        name: ptrMatch[2],
        type: `${ptrMatch[1]}* (Pointer)`,
        value: `&${ptrMatch[3]}`,
        isPointer: true,
        pointsTo: ptrMatch[3],
        address: nextHex(8)
      });
    }
  });

  // Fallback defaults if code has no declared arrays
  if (arrays.length === 0) {
    arrays.push({
      name: 'arr',
      type: 'int[]',
      values: [15, 8, 42, 23, 4, 16],
      address: '0x7ffce010'
    });
  }

  return { variables, arrays };
}

export default function MemoryArrayVisualizer({
  code = '',
  language = 'python'
}) {
  const parsedMemory = useMemo(() => {
    return parseMemoryFromCode(code, language);
  }, [code, language]);

  const [selectedArrName, setSelectedArrName] = useState(() => parsedMemory.arrays[0]?.name || 'arr');

  useEffect(() => {
    if (parsedMemory.arrays.length > 0 && !parsedMemory.arrays.some(a => a.name === selectedArrName)) {
      setSelectedArrName(parsedMemory.arrays[0].name);
    }
  }, [parsedMemory.arrays, selectedArrName]);

  const activeArrayObj = parsedMemory.arrays.find(a => a.name === selectedArrName) || parsedMemory.arrays[0];
  const [arrayData, setArrayData] = useState(() => activeArrayObj.values);

  // Sync array data whenever active array changes
  useEffect(() => {
    setArrayData(activeArrayObj.values);
    setActivePointers({ i: 0, j: 1 });
    setComparingIndices([]);
    setSwappingIndices([]);
  }, [activeArrayObj]);

  const [activePointers, setActivePointers] = useState({ i: 0, j: 1 });
  const [comparingIndices, setComparingIndices] = useState([]);
  const [swappingIndices, setSwappingIndices] = useState([]);
  const [isSorting, setIsSorting] = useState(false);
  const [stepSpeed, setStepSpeed] = useState(500);

  // Animated Bubble Sort Tracer on user's current array
  const runSortSimulation = async () => {
    if (isSorting) return;
    setIsSorting(true);
    const arr = [...arrayData];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setActivePointers({ i: j, j: j + 1 });
        setComparingIndices([j, j + 1]);
        setSwappingIndices([]);
        await new Promise(r => setTimeout(r, stepSpeed));

        if (Number(arr[j]) > Number(arr[j + 1])) {
          setSwappingIndices([j, j + 1]);
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          setArrayData([...arr]);
          await new Promise(r => setTimeout(r, stepSpeed));
        }
      }
    }
    setComparingIndices([]);
    setSwappingIndices([]);
    setIsSorting(false);
  };

  const handleResetArray = () => {
    setIsSorting(false);
    setArrayData(activeArrayObj.values);
    setActivePointers({ i: 0, j: 1 });
    setComparingIndices([]);
    setSwappingIndices([]);
  };

  return (
    <div className="memory-workbench-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top Header & Status */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '6px', borderRadius: '6px' }}>
            <Database size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                3D Memory Matrix & Variable Inspector
              </span>
              <span style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38bdf8',
                padding: '2px 8px',
                borderRadius: '10px',
                fontWeight: 700
              }}>
                Live Code Parsed
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
              {parsedMemory.variables.length} Stack Variables • {parsedMemory.arrays.length} Heap Array(s) Detected
            </p>
          </div>
        </div>

        {/* Array Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {parsedMemory.arrays.length > 1 && (
            <select
              value={selectedArrName}
              onChange={(e) => setSelectedArrName(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              {parsedMemory.arrays.map(a => (
                <option key={a.name} value={a.name}>{a.name}[] ({a.values.length} elements)</option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="view-mode-action-btn"
            onClick={runSortSimulation}
            disabled={isSorting}
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.78rem'
            }}
          >
            <Play size={13} fill="currentColor" />
            <span>{isSorting ? 'Tracing...' : 'Trace Sort'}</span>
          </button>

          <button
            type="button"
            className="view-mode-action-btn"
            onClick={handleResetArray}
            title="Reset Array to Original State"
            style={{ padding: '5px 8px' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left is Stack Frame Variables, Right is Heap Memory Array */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Left: Stack Segment (Local Variables) */}
        <div style={{
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.4)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            📦 Stack Segment ({parsedMemory.variables.length} Variables)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parsedMemory.variables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 8px', color: '#64748b', fontSize: '0.8rem' }}>
                No primitive variables declared in current code yet. Write <code>x = 10</code> or <code>int a = 5;</code> in editor.
              </div>
            ) : (
              parsedMemory.variables.map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#38bdf8' }}>{v.name}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      color: '#cbd5e1'
                    }}>
                      {v.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span style={{ color: '#94a3b8' }}>Value: <strong style={{ color: '#f8fafc' }}>{String(v.value)}</strong></span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.7rem' }}>{v.address}</span>
                  </div>
                  {v.isPointer && (
                    <div style={{ fontSize: '0.7rem', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ArrowRight size={11} /> Points to: &{v.pointsTo}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Heap Segment (Array / Matrix Memory Blocks) */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Array: <code>{activeArrayObj.name}</code></span>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  Base Address: {activeArrayObj.address}
                </span>
              </h4>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Contiguous memory allocation with 4-byte index strides
              </span>
            </div>
            
            {/* Legend */}
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }} /> Pointer (i)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ec4899' }} /> Pointer (j)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} /> Comparing
              </span>
            </div>
          </div>

          {/* Array Memory Grid */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            borderRadius: '12px'
          }}>
            {arrayData.map((val, idx) => {
              const isI = activePointers.i === idx;
              const isJ = activePointers.j === idx;
              const isComparing = comparingIndices.includes(idx);
              const isSwapping = swappingIndices.includes(idx);

              // Compute simulated 4-byte contiguous hex address
              const hexAddr = '0x' + (0x7ffe0000 + idx * 4).toString(16);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {/* Pointer Marker above cell */}
                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isI && isJ ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b' }}>i, j ↓</span>
                    ) : isI ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38bdf8' }}>i ↓</span>
                    ) : isJ ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ec4899' }}>j ↓</span>
                    ) : null}
                  </div>

                  {/* Memory Cell */}
                  <div style={{
                    width: '62px',
                    height: '62px',
                    borderRadius: '8px',
                    background: isSwapping 
                      ? 'rgba(239, 68, 68, 0.35)' 
                      : isComparing 
                      ? 'rgba(245, 158, 11, 0.3)' 
                      : 'rgba(30, 41, 59, 0.8)',
                    border: isSwapping 
                      ? '2px solid #ef4444' 
                      : isComparing 
                      ? '2px solid #f59e0b' 
                      : isI 
                      ? '2px solid #38bdf8' 
                      : isJ 
                      ? '2px solid #ec4899' 
                      : '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: (isI || isJ || isComparing) ? '0 0 14px rgba(56, 189, 248, 0.25)' : 'none',
                    transition: 'all 0.18s ease'
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                      {String(val)}
                    </span>
                  </div>

                  {/* Index and Byte Address below cell */}
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                    [{idx}]
                  </span>
                  <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {hexAddr}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick info note */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#64748b' }}>
            <Sparkles size={14} color="#06b6d4" />
            <span>
              Write arrays (e.g. <code>arr = [5, 2, 9, 1]</code>) or variables in your code. This visualizer automatically updates in real-time!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
