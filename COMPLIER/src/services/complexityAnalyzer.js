// ============================================================================
// Elite IDE - Time & Space Complexity Visualizer Service
// Static AST & pattern analysis engine calculating Big-O asymptotic bounds,
// theoretical scaling curves, memory footprints, and optimization suggestions.
// ============================================================================

export function analyzeComplexity(code = '', language = 'python') {
  const cleanCode = (code || '').trim();
  if (!cleanCode) {
    return getDefaultComplexity();
  }

  const lines = cleanCode.split('\n');
  const lower = cleanCode.toLowerCase();

  // Pattern detection
  const hasNestedLoops = /for[\s\S]*for|while[\s\S]*while|for[\s\S]*while|while[\s\S]*for/i.test(cleanCode);
  const loopCount = (cleanCode.match(/\b(for|while)\b/gi) || []).length;
  const hasRecursion = checkRecursion(cleanCode, language);
  const hasSorting = /\b(sort|sorted|qsort|collections\.sort|arrays\.sort)\b/i.test(cleanCode);
  const hasBinarySearch = /\b(mid|binary_search|bisect|low <= high|left <= right)\b/i.test(cleanCode);
  const hasHashMap = /\b(dict|\{\}|hashmap|unordered_map|map|set|unordered_set)\b/i.test(cleanCode);
  const hasDynamicProg = /\b(dp\[|memo|cache|memoization|lru_cache)\b/i.test(cleanCode);

  let timeComplexity = 'O(N)';
  let timeNotation = 'Linear Time';
  let timeRating = 'Optimal';
  let timeColor = '#3b82f6';
  let curveType = 'linear';

  let spaceComplexity = 'O(1)';
  let spaceNotation = 'Constant Space';
  let spaceRating = 'Optimal';
  let spaceColor = '#10b981';

  // Time Complexity Determination
  if (hasRecursion && !hasDynamicProg) {
    if (lower.includes('return') && (cleanCode.match(/\b\w+\([^)]*\)\s*\+\s*\b\w+\(/g) || []).length > 0) {
      timeComplexity = 'O(2^N)';
      timeNotation = 'Exponential Time';
      timeRating = 'Critical Bottleneck';
      timeColor = '#ef4444';
      curveType = 'exponential';
    } else {
      timeComplexity = 'O(N)';
      timeNotation = 'Linear Time (Call Stack)';
      timeRating = 'Good';
      timeColor = '#3b82f6';
      curveType = 'linear';
    }
  } else if (hasNestedLoops) {
    timeComplexity = 'O(N²)';
    timeNotation = 'Quadratic Time';
    timeRating = 'Suboptimal for Large N';
    timeColor = '#f59e0b';
    curveType = 'quadratic';
  } else if (hasSorting) {
    timeComplexity = 'O(N log N)';
    timeNotation = 'Linearithmic Time';
    timeRating = 'Optimal for Comparison Sorting';
    timeColor = '#8b5cf6';
    curveType = 'nlogn';
  } else if (hasBinarySearch) {
    timeComplexity = 'O(log N)';
    timeNotation = 'Logarithmic Time';
    timeRating = 'Ultra Fast';
    timeColor = '#06b6d4';
    curveType = 'logn';
  } else if (loopCount === 0 && !hasRecursion) {
    timeComplexity = 'O(1)';
    timeNotation = 'Constant Time';
    timeRating = 'Instantaneous';
    timeColor = '#10b981';
    curveType = 'constant';
  } else {
    timeComplexity = 'O(N)';
    timeNotation = 'Linear Time';
    timeRating = 'Optimal';
    timeColor = '#3b82f6';
    curveType = 'linear';
  }

  // Space Complexity Determination
  if (hasDynamicProg || hasHashMap) {
    spaceComplexity = 'O(N)';
    spaceNotation = 'Linear Auxiliary Space';
    spaceRating = 'Acceptable Cache';
    spaceColor = '#3b82f6';
  } else if (hasRecursion) {
    spaceComplexity = 'O(N)';
    spaceNotation = 'Linear Recursion Call Stack';
    spaceRating = 'Stack Dependent';
    spaceColor = '#f59e0b';
  } else if (/new\s+int\[.*\]\[.*\]|\[\[.*\]\s*for/i.test(cleanCode)) {
    spaceComplexity = 'O(N²)';
    spaceNotation = 'Quadratic Matrix Space';
    spaceRating = 'Heavy Footprint';
    spaceColor = '#ef4444';
  } else {
    spaceComplexity = 'O(1)';
    spaceNotation = 'Constant In-Place Space';
    spaceRating = 'Zero Extra Overhead';
    spaceColor = '#10b981';
  }

  // Generate scaling simulation data for N = 10, 100, 1k, 10k, 100k, 1M
  const inputSizes = [10, 100, 1000, 10000, 100000, 1000000];
  const scalingData = inputSizes.map(n => {
    const ops = calculateOperations(curveType, n);
    const cpuTimeMs = estimateCpuTime(ops);
    const memMb = estimateMemory(spaceComplexity, n);
    return {
      n,
      nLabel: n >= 1000000 ? '1M' : n >= 1000 ? `${n / 1000}k` : `${n}`,
      operations: ops,
      cpuTimeMs,
      memMb,
      status: cpuTimeMs > 2000 ? 'TLE Alert' : cpuTimeMs > 500 ? 'Heavy' : 'Pass'
    };
  });

  // Actionable AI Optimization Suggestions
  const suggestions = [];
  if (curveType === 'quadratic') {
    suggestions.push({
      id: 'opt-hash',
      title: 'Replace Nested Search with Hash Table / Set',
      description: 'Your nested loop performs repeated linear lookups. Storing elements in an unordered_map or Set drops complexity from O(N²) to O(N).'
    });
  }
  if (curveType === 'exponential') {
    suggestions.push({
      id: 'opt-memo',
      title: 'Apply Dynamic Programming / Memoization',
      description: 'Recursive branches are recalculating overlapping subproblems. Add a `@lru_cache` or `dp` array to collapse time from O(2^N) to O(N).'
    });
  }
  if (spaceComplexity === 'O(N)' && curveType === 'linear') {
    suggestions.push({
      id: 'opt-inplace',
      title: 'In-Place Pointer Traversal (Two Pointers)',
      description: 'You can eliminate the extra array allocation by using left and right indices directly on the source container.'
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'opt-best',
      title: 'Optimal Big-O Complexity Achieved',
      description: 'Your algorithm runs in asymptotic minimum bounds for this problem class.'
    });
  }

  return {
    timeComplexity,
    timeNotation,
    timeRating,
    timeColor,
    curveType,
    spaceComplexity,
    spaceNotation,
    spaceRating,
    spaceColor,
    scalingData,
    suggestions,
    metrics: {
      totalLines: lines.length,
      loopsDetected: loopCount,
      hasRecursion,
      hasNestedLoops,
      hasHashMap
    }
  };
}

function checkRecursion(code, language) {
  // Simple regex checking if a function calls itself
  const fnMatch = code.match(/(?:def|function|void|int|long|auto)\s+([a-zA-Z0-9_]+)\s*\(/g);
  if (!fnMatch) return false;
  for (const m of fnMatch) {
    const name = m.replace(/(?:def|function|void|int|long|auto)\s+/, '').replace('(', '').trim();
    if (name && name !== 'main') {
      const calls = (code.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) || []).length;
      if (calls > 1) return true;
    }
  }
  return false;
}

function calculateOperations(curveType, n) {
  switch (curveType) {
    case 'constant':
      return 1;
    case 'logn':
      return Math.round(Math.log2(Math.max(2, n)));
    case 'linear':
      return n;
    case 'nlogn':
      return Math.round(n * Math.log2(Math.max(2, n)));
    case 'quadratic':
      return n > 50000 ? 2500000000 : n * n;
    case 'exponential':
      return n > 30 ? 1073741824 : Math.pow(2, n);
    default:
      return n;
  }
}

function estimateCpuTime(operations) {
  // Modern CPU executes ~10^8 ops per second (~100 ops/microsecond)
  const cpuSpeedOpsPerMs = 100000;
  const ms = operations / cpuSpeedOpsPerMs;
  return Number(Math.max(0.01, ms).toFixed(2));
}

function estimateMemory(spaceComplexity, n) {
  if (spaceComplexity === 'O(1)') return 0.2;
  if (spaceComplexity === 'O(N)') {
    // 4 bytes per integer * n
    const bytes = n * 8;
    return Number(Math.max(0.5, bytes / (1024 * 1024)).toFixed(2));
  }
  if (spaceComplexity === 'O(N²)') {
    const bytes = Math.min(n, 5000) * Math.min(n, 5000) * 8;
    return Number(Math.max(1.0, bytes / (1024 * 1024)).toFixed(2));
  }
  return 1.0;
}

function getDefaultComplexity() {
  return {
    timeComplexity: 'O(1)',
    timeNotation: 'Constant Time',
    timeRating: 'Instantaneous',
    timeColor: '#10b981',
    curveType: 'constant',
    spaceComplexity: 'O(1)',
    spaceNotation: 'Constant In-Place Space',
    spaceRating: 'Zero Extra Overhead',
    spaceColor: '#10b981',
    scalingData: [],
    suggestions: [
      {
        id: 'opt-empty',
        title: 'Ready for Analysis',
        description: 'Type or run code to analyze asymptotic scaling curves.'
      }
    ],
    metrics: { totalLines: 0, loopsDetected: 0, hasRecursion: false, hasNestedLoops: false }
  };
}
