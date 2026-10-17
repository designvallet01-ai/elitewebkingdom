// ============================================================================
// Elite IDE - AI Code Analyzer, Big-O Complexity Engine & Bug Hunter
// Line-by-line flow narration (English + Telugu), Static Bug Analysis & Optimizer
// ============================================================================

export function analyzeCodeWithAi(code = '', language = 'python') {
  if (!code || !code.trim()) {
    return {
      title: 'Awaiting Code',
      summaryEn: 'Please write or paste code in the editor to analyze logic and performance.',
      summaryTe: 'లాజిక్ మరియు పెర్ఫార్మెన్స్ విశ్లేషించడానికి ఎడిటర్‌లో కోడ్ రాయండి.',
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      complexityExplanationEn: 'No operations to evaluate.',
      complexityExplanationTe: 'కోడ్ ఏమీ లేనందున ఆపరేషన్స్ లేవు.',
      bugs: [],
      steps: [],
      optimizations: [],
      algorithmType: 'Empty Script',
      qualityScore: 100
    };
  }

  const lang = (language || 'python').toLowerCase();
  const lines = code.split('\n');

  // 1. Identify Algorithm Category / Pattern
  const algoPattern = identifyPattern(code, lang);

  // 2. Compute Asymptotic Time & Space Complexity (Big-O)
  const complexity = computeBigO(code, lang);

  // 3. Scan for Code Bugs & Hazards (Static Hunter)
  const bugs = scanBugsAndHazards(code, lang);

  // 4. Generate Line-by-Line Logic Flow (English + Telugu)
  const steps = generateStepBreakdown(code, lang);

  // 5. Generate Optimization Suggestions & Faster Replacement
  const optimizations = generateOptimizations(code, lang, complexity, bugs);

  // 6. Overall Code Quality Score (0 to 100)
  let qualityScore = 100;
  qualityScore -= bugs.filter(b => b.severity === 'high').length * 25;
  qualityScore -= bugs.filter(b => b.severity === 'medium').length * 12;
  qualityScore -= bugs.filter(b => b.severity === 'low').length * 5;
  if (complexity.time === 'O(N^2)' && algoPattern.suggestedBetter) qualityScore -= 10;
  qualityScore = Math.max(Math.min(qualityScore, 100), 20);

  return {
    title: algoPattern.title,
    algorithmType: algoPattern.category,
    summaryEn: algoPattern.descEn,
    summaryTe: algoPattern.descTe,
    timeComplexity: complexity.time,
    spaceComplexity: complexity.space,
    complexityExplanationEn: complexity.explanationEn,
    complexityExplanationTe: complexity.explanationTe,
    bugs,
    steps,
    optimizations,
    optimizedCode: optimizations.length > 0 ? optimizations[0].improvedCode : null,
    qualityScore
  };
}

// ---------------------------------------------------------------------------
// 1. Pattern Identification
// ---------------------------------------------------------------------------
function identifyPattern(code, lang) {
  const lower = code.toLowerCase();

  if (lower.includes('bubble') || (lower.includes('for') && lower.includes('for') && (lower.includes('swap') || lower.includes('>')) && lower.includes('arr['))) {
    return {
      title: 'Bubble Sort Algorithm',
      category: 'Sorting Algorithm',
      descEn: 'Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
      descTe: 'బబుల్ సార్ట్ పక్కపక్కనే ఉన్న ఎలిమెంట్స్‌ని పోల్చి చూస్తూ, సరైన వరుసలో లేకపోతే మార్పిడి (swap) చేస్తూ లిస్ట్‌ని సార్ట్ చేస్తుంది.'
    };
  }

  if (lower.includes('binary_search') || lower.includes('binarysearch') || (lower.includes('mid') && (lower.includes('low') || lower.includes('left')) && (lower.includes('high') || lower.includes('right')))) {
    return {
      title: 'Binary Search Algorithm',
      category: 'Search Algorithm',
      descEn: 'Binary Search efficiently finds the position of a target value within a sorted array by halving the search interval repeatedly.',
      descTe: 'బైనరీ సెర్చ్ సార్ట్ చేయబడిన అరేలో ప్రతిసారి శోధన పరిధిని సగానికి విభజిస్తూ వేగంగా టార్గెట్ ఎలిమెంట్‌ని కనుగొంటుంది.'
    };
  }

  if (lower.includes('factorial') || (lower.includes('*') && lower.includes('while') && (lower.includes('n - 1') || lower.includes('n-1') || lower.includes('result *')))) {
    return {
      title: 'Factorial Calculation',
      category: 'Math & Number Theory',
      descEn: 'Computes the product of all positive integers less than or equal to n (n! = n * (n-1) * ... * 1).',
      descTe: 'ఇది ఒక సంఖ్య యొక్క ఫ్యాక్టోరియల్ (n!) ను వరుస గుణకారాల ద్వారా గణిస్తుంది.'
    };
  }

  if (lower.includes('fibonacci') || lower.includes('fib(') || (lower.includes('a, b = b, a + b') || lower.includes('prev + curr'))) {
    return {
      title: 'Fibonacci Sequence',
      category: 'Sequence & Dynamic Programming',
      descEn: 'Generates numbers in the Fibonacci sequence where each number is the sum of the two preceding ones.',
      descTe: 'ఫిబొనాక్సీ సిరీస్ – ప్రతి సంఖ్య అంతకుముందున్న రెండు సంఖ్యల మొత్తం అవుతుంది.'
    };
  }

  if (lower.includes('prime') || (lower.includes('%') && lower.includes('== 0') && (lower.includes('for') || lower.includes('while')) && (lower.includes('isprime') || lower.includes('count')))) {
    return {
      title: 'Prime Number Checker',
      category: 'Math & Primality Test',
      descEn: 'Checks whether a given number has factors other than 1 and itself.',
      descTe: 'ఇచ్చిన సంఖ్య ప్రధాన సంఖ్య (Prime Number) కాదా అని శేషం (remainder) పరీక్షల ద్వారా నిర్ధారిస్తుంది.'
    };
  }

  if (lower.includes('reverse') || lower.includes('[::-1]') || (lower.includes('left') && lower.includes('right') && lower.includes('swap'))) {
    return {
      title: 'Sequence Inversion / Reversal',
      category: 'Array / String Manipulation',
      descEn: 'Inverts the ordering of elements in an array or string from end to start.',
      descTe: 'అరే లేదా స్ట్రింగ్‌లోని ఎలిమెంట్స్‌ని రివర్స్ ఆర్డర్‌లో అమరుస్తుంది.'
    };
  }

  // General Control Flow / Script
  const loopCount = (code.match(/\b(for|while)\b/g) || []).length;
  const ifCount = (code.match(/\b(if|elif|else if)\b/g) || []).length;

  if (loopCount > 0 && ifCount > 0) {
    return {
      title: 'Iterative Conditional Pipeline',
      category: 'Algorithm Logic',
      descEn: 'Combines iteration blocks with branching conditional checks to filter, aggregate, or mutate data.',
      descTe: 'లూప్స్ మరియు కండిషన్స్ ద్వారా డేటాను ఫిల్టర్ చేయడం మరియు లెక్కించడం జరుగుతుంది.'
    };
  }

  if (loopCount > 0) {
    return {
      title: 'Iterative Sequence Processor',
      category: 'Loop Processing',
      descEn: 'Executes repeated instructions across a range or data collection until a termination criteria is met.',
      descTe: 'కండిషన్ పూర్తయ్యే వరకు స్టేట్‌మెంట్లను పునరావృతం చేస్తూ రన్ అయ్యే లూప్ ప్రాసెస్.'
    };
  }

  if (ifCount > 0) {
    return {
      title: 'Branching Decision Tree',
      category: 'Control Flow',
      descEn: 'Evaluates logical predicates and directs execution along alternative conditional paths.',
      descTe: 'ఇచ్చిన కండిషన్లను బట్టి వేర్వేరు మార్గాల్లో ఎగ్జిక్యూషన్ నడిపే డెసిషన్ ట్రీ.'
    };
  }

  return {
    title: 'Sequential Procedure Script',
    category: 'Linear Execution',
    descEn: 'Executes statements strictly from top to bottom in a direct linear trajectory.',
    descTe: 'పై నుండి కిందికి వరుసగా స్టేట్‌మెంట్లను ఎగ్జిక్యూట్ చేసే లీనియర్ ప్రోగ్రామ్.'
  };
}

// ---------------------------------------------------------------------------
// 2. Big-O Complexity Calculation
// ---------------------------------------------------------------------------
function computeBigO(code, lang) {
  const lines = code.split('\n');
  let maxNesting = 0;
  let currentNesting = 0;
  let hasHalving = false;
  let hasLinearLoop = false;
  let hasRecursion = false;
  let hasDynamicAllocation = false;

  const funcNameMatch = code.match(/def\s+([A-Za-z0-9_]+)|function\s+([A-Za-z0-9_]+)/);
  const currentFuncName = funcNameMatch ? (funcNameMatch[1] || funcNameMatch[2]) : null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

    // Check halving (Binary search indicators)
    if (trimmed.match(/(\/\/\s*2|\/\s*2|>>\s*1)/)) {
      hasHalving = true;
    }

    // Check array allocations
    if (trimmed.match(/(\[\s*\]\s*\*\s*n|new\s+int\[|vector<|malloc\(|new\s+Array)/)) {
      hasDynamicAllocation = true;
    }

    // Check loops
    if (trimmed.match(/^(for\b|while\b)/)) {
      hasLinearLoop = true;
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    }

    // Check recursion
    if (currentFuncName && trimmed.includes(currentFuncName + '(') && !trimmed.startsWith('def') && !trimmed.startsWith('function')) {
      hasRecursion = true;
    }

    if (trimmed === '}' || (lang === 'python' && line.match(/^\S/) && !trimmed.match(/^(for|while)/))) {
      currentNesting = Math.max(0, currentNesting - 1);
    }
  });

  // Calculate Time Complexity
  let time = 'O(1)';
  let explanationEn = 'Executes in constant time as there are no iterations or dynamic recursive calls.';
  let explanationTe = 'ఎలాంటి లూప్స్ లేదా రికర్షన్ లేనందున స్థిరమైన సమయం (Constant Time) లో రన్ అవుతుంది.';

  if (hasHalving && maxNesting <= 1) {
    time = 'O(log N)';
    explanationEn = 'Search interval is halved at each iteration step (Logarithmic time).';
    explanationTe = 'ప్రతి స్టెప్‌లో పరిధి సగానికి విభజించబడుతుంది (లాగరిథమిక్ సమయం).';
  } else if (maxNesting === 1) {
    time = 'O(N)';
    explanationEn = 'Single iteration loop runs proportional to the size of the input data N (Linear time).';
    explanationTe = 'ఇన్‌పుట్ పరిమాణం N కు అనుగుణంగా సింగిల్ లూప్ ఒకసారి రన్ అవుతుంది (లీనియర్ సమయం).';
  } else if (maxNesting === 2) {
    time = 'O(N²)';
    explanationEn = 'Contains nested loops (loop within loop), executing approximately N × N operations (Quadratic time).';
    explanationTe = 'లూప్ లోపల మరో లూప్ ఉండటం వల్ల N × N సార్లు రన్ అవుతుంది (క్వాడ్రాటిక్ సమయం).';
  } else if (maxNesting >= 3) {
    time = `O(N^${maxNesting})`;
    explanationEn = `Contains ${maxNesting} deeply nested loop layers (Polynomial time).`;
    explanationTe = `${maxNesting} స్థాయిల లోతైన లూప్స్ ఉండటం వల్ల ఎక్కువ సమయం తీసుకుంటుంది.`;
  } else if (hasRecursion) {
    time = 'O(2^N) or O(N)';
    explanationEn = 'Recursive branching calls generate an execution tree.';
    explanationTe = 'రికార్సివ్ ఫంక్షన్ కాల్స్ ద్వారా ఎగ్జిక్యూషన్ ట్రీ ఏర్పడుతుంది.';
  }

  // Calculate Space Complexity
  let space = 'O(1)';
  let spaceExplanationEn = 'Uses constant auxiliary memory with primitive variable registers.';
  let spaceExplanationTe = 'కేవలం కొన్ని వేరియబుల్స్ మాత్రమే వాడినందున కనీస మెమరీ సరిపోతుంది.';

  if (hasDynamicAllocation) {
    space = 'O(N)';
    spaceExplanationEn = 'Allocates dynamic collections or arrays scaling with input size N.';
    spaceExplanationTe = 'ఇన్‌పుట్ పరిమాణం N ఆధారంగా అరే లేదా లిస్ట్ మెమరీ కేటాయించబడుతుంది.';
  } else if (hasRecursion) {
    space = 'O(N)';
    spaceExplanationEn = 'Consumes call stack frames proportional to recursive recursion depth.';
    spaceExplanationTe = 'రికార్సివ్ కాల్స్ కోసం కాల్ స్టాక్ మెమరీ ఉపయోగించబడుతుంది.';
  }

  return {
    time,
    space,
    explanationEn: `${explanationEn} Auxiliary Space: ${spaceExplanationEn}`,
    explanationTe: `${explanationTe} మెమరీ: ${spaceExplanationTe}`
  };
}

// ---------------------------------------------------------------------------
// 3. Static Bug & Hazard Hunter
// ---------------------------------------------------------------------------
function scanBugsAndHazards(code, lang) {
  const bugs = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineNum = idx + 1;

    // 1. Division by Zero
    if (trimmed.match(/\/\s*0(?![0-9\.\w])/)) {
      bugs.push({
        id: `bug_div_zero_${lineNum}`,
        line: lineNum,
        severity: 'high',
        type: 'ZeroDivisionError',
        title: 'Division by Zero Detected',
        descEn: `Line ${lineNum} performs a direct division by literal zero, which will crash with ZeroDivisionError at runtime.`,
        descTe: `లైన్ ${lineNum} లో సున్నాతో విభజన (Zero Division) జరిగింది. ఇది రన్‌టైమ్‌లో ఎర్రర్ ఇస్తుంది.`,
        fix: 'Ensure the denominator is verified to be non-zero before dividing.'
      });
    }

    // 2. Assignment instead of equality check in condition
    if (trimmed.match(/if\s*\([a-zA-Z0-9_]+\s*=\s*[^=]/) || (lang === 'c' || lang === 'cpp') && trimmed.match(/if\s*\([^=!<>]=[^=]/)) {
      bugs.push({
        id: `bug_assign_cond_${lineNum}`,
        line: lineNum,
        severity: 'high',
        type: 'SyntaxTrap',
        title: 'Assignment Operator in Condition',
        descEn: `Single '=' used in conditional predicate on line ${lineNum}. This mutates the variable instead of checking equality '=='.`,
        descTe: `లైన్ ${lineNum} లో పోల్చడానికి '==' బదులు సింగిల్ '=' అసైన్‌మెంట్ వాడారు.`,
        fix: "Replace '=' with '==' for equality comparison."
      });
    }

    // 3. Infinite While Loop without mutation
    if (trimmed.startsWith('while True:') || trimmed.startsWith('while(1)') || trimmed.startsWith('while(true)')) {
      const restCode = lines.slice(idx).join('\n');
      if (!restCode.includes('break') && !restCode.includes('return') && !restCode.includes('exit')) {
        bugs.push({
          id: `bug_infinite_loop_${lineNum}`,
          line: lineNum,
          severity: 'high',
          type: 'InfiniteLoop',
          title: 'Unbounded Infinite Loop',
          descEn: `Infinite loop on line ${lineNum} contains no 'break' or 'return' statement, causing the thread to hang indefinitely.`,
          descTe: `లైన్ ${lineNum} లో లూప్ నుండి బయటపడటానికి 'break' లేదా 'return' లేదు, కాబట్టి ప్రోగ్రామ్ ఆగకుండా తిరుగుతుంది.`,
          fix: "Include a terminating 'break' condition inside the while block."
        });
      }
    }

    // 4. Off-by-one array bounds error (<= length)
    if (trimmed.match(/<=\s*(?:arr|v|list|nums)\.length/i) || trimmed.match(/<=\s*len\s*\(/)) {
      bugs.push({
        id: `bug_off_by_one_${lineNum}`,
        line: lineNum,
        severity: 'medium',
        type: 'IndexOutOfBounds',
        title: 'Potential Off-By-One Index Hazard',
        descEn: `Loop boundary uses '<=' with length. Because array indices are 0-indexed, this will access an out-of-bounds index on the final iteration.`,
        descTe: `అరే ఇండెక్స్ 0 తో మొదలవుతుంది కాబట్టి '<=' వాడితే చివరి ఇండెక్స్ దాటిపోయి ఎర్రర్ రావచ్చు.`,
        fix: "Change '<=' to '<' when looping up to collection length."
      });
    }

    // 5. Python unhashable / mutability traps
    if (lang === 'python' && trimmed.includes('{') && trimmed.includes(':') && trimmed.includes('[')) {
      if (trimmed.match(/\{\s*\[/)) {
        bugs.push({
          id: `bug_unhashable_${lineNum}`,
          line: lineNum,
          severity: 'high',
          type: 'TypeError',
          title: 'Unhashable Type Used as Dict Key',
          descEn: 'A mutable list is used as a dictionary key, which raises a TypeError in Python.',
          descTe: 'పైథాన్‌లో లిస్ట్‌ని డిక్షనరీ కీగా వాడలేరు (TypeError వస్తుంది).',
          fix: 'Use an immutable tuple instead of a list for dictionary keys.'
        });
      }
    }

    // 6. Dead Code after return
    if (trimmed.startsWith('return') && idx + 1 < lines.length) {
      const nextLine = lines[idx + 1].trim();
      const currentIndent = (line.match(/^\s*/) || [''])[0].length;
      const nextIndent = (lines[idx + 1].match(/^\s*/) || [''])[0].length;
      if (nextLine && !nextLine.startsWith('def') && !nextLine.startsWith('}') && nextIndent === currentIndent && !nextLine.startsWith('#') && !nextLine.startsWith('//')) {
        bugs.push({
          id: `bug_unreachable_${lineNum + 1}`,
          line: lineNum + 1,
          severity: 'low',
          type: 'DeadCode',
          title: 'Unreachable Statement After Return',
          descEn: `Statement on line ${lineNum + 1} will never execute because the enclosing block returns on line ${lineNum}.`,
          descTe: `లైన్ ${lineNum} లో రిటర్న్ అయిన తర్వాత లైన్ ${lineNum + 1} ఎప్పటికీ రన్ అవ్వదు (Dead Code).`,
          fix: 'Remove or relocate the statement before the return directive.'
        });
      }
    }
  });

  return bugs;
}

// ---------------------------------------------------------------------------
// 4. Line-by-Line Logic Flow Breakdown (English + Telugu)
// ---------------------------------------------------------------------------
function generateStepBreakdown(code, lang) {
  const lines = code.split('\n');
  const steps = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineNum = idx + 1;
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

    let explanationEn = '';
    let explanationTe = '';
    let type = 'statement';

    if (trimmed.match(/^(def\s+|function\s+|int\s+main|public\s+static)/)) {
      type = 'function';
      explanationEn = `Defines subroutine entrypoint: "${trimmed.replace(/[{:]$/, '')}".`;
      explanationTe = `ఫంక్షన్ ఎంట్రీ పాయింట్ డిఫైన్ చేయబడింది.`;
    } else if (trimmed.match(/^(if\s*\(?|elif\s*|else\s*if\s*\(?)/)) {
      type = 'decision';
      const cond = trimmed.replace(/^(if|elif|else\s+if)\s*\(?/, '').replace(/[\){}:]+$/, '').trim();
      explanationEn = `Evaluates conditional test: if (${cond}) is True, branches to the then-block; otherwise checks alternative paths.`;
      explanationTe = `కండిషన్ (${cond}) నిజమా కాదా అని పరీక్షిస్తుంది; నిజమైతే కుడివైపు బ్రాంచ్‌కి వెళ్తుంది.`;
    } else if (trimmed.startsWith('else:') || trimmed.startsWith('else {') || trimmed === 'else') {
      type = 'decision';
      explanationEn = 'Executes fallback instructions if all preceding condition predicates evaluated to False.';
      explanationTe = 'పై కండిషన్స్ అన్నీ ఫెయిల్ అయితే ఈ ఎల్స్ (Else) బ్లాక్ రన్ అవుతుంది.';
    } else if (trimmed.match(/^(for\s*\(?|while\s*\(?)/)) {
      type = 'loop';
      explanationEn = `Initiates loop iteration cycle. Evaluates boundary check before every iteration.`;
      explanationTe = `లూప్ సైకిల్ ప్రారంభమవుతుంది. ప్రతిసారి కండిషన్ చెక్ చేసుకుంటూ పునరావృతం అవుతుంది.`;
    } else if (trimmed.match(/(print\s*\(|console\.log\s*\(|printf\s*\(|cout\s*<<)/)) {
      type = 'io';
      explanationEn = `Emits standard output message to console/terminal buffer.`;
      explanationTe = `టెర్మినల్ కన్సోల్‌లోకి ఫలితాన్ని ప్రింట్ చేస్తుంది.`;
    } else if (trimmed.startsWith('return')) {
      type = 'terminal';
      explanationEn = `Terminates execution and returns calculated value to caller.`;
      explanationTe = `విలువను రిటర్న్ చేసి ఎగ్జిక్యూషన్ ముగిస్తుంది.`;
    } else if (trimmed.includes('=')) {
      type = 'process';
      const parts = trimmed.split('=');
      explanationEn = `Allocates / updates state variable "${parts[0].trim()}" with calculated value.`;
      explanationTe = `వేరియబుల్ "${parts[0].trim()}" లోకి కొత్త విలువను అసైన్ చేస్తుంది.`;
    } else {
      explanationEn = `Executes operation: ${trimmed}`;
      explanationTe = `స్టేట్‌మెంట్ రన్ అవుతుంది: ${trimmed}`;
    }

    steps.push({
      stepNumber: steps.length + 1,
      line: lineNum,
      code: trimmed,
      type,
      explanationEn,
      explanationTe
    });
  });

  return steps;
}

// ---------------------------------------------------------------------------
// 5. Code Optimization & Modern Replacements
// ---------------------------------------------------------------------------
function generateOptimizations(code, lang, complexity, bugs) {
  const suggestions = [];

  // Suggestion: Bubble Sort -> Built-in Timsort / std::sort
  if (complexity.time === 'O(N²)' && (code.includes('sort') || code.includes('swap'))) {
    if (lang === 'python') {
      suggestions.push({
        id: 'opt_sort_python',
        title: 'Upgrade O(N²) Quadratic Sort to O(N log N) Timsort',
        impact: 'Massive Speedup (up to 100x faster for large inputs)',
        descEn: 'Replace manual nested-loop bubble sort with Python’s optimized C-level Timsort algorithm (`arr.sort()` or `sorted(arr)`).',
        descTe: 'మాన్యువల్ బబుల్ సార్ట్ బదులు పైథాన్ బిల్ట్-ఇన్ సార్ట్ వాడితే 100 రెట్లు వేగంగా రన్ అవుతుంది.',
        improvedCode: `# Highly Optimized O(N log N) Implementation
arr = [64, 34, 25, 12, 22, 11, 90]
sorted_arr = sorted(arr)
print("Sorted Array:", sorted_arr)
`
      });
    } else if (lang === 'cpp' || lang === 'c') {
      suggestions.push({
        id: 'opt_sort_cpp',
        title: 'Use std::sort (Introsort) O(N log N)',
        impact: 'Native C++ Speed (Introsort beats hand-written bubble sort by 100x)',
        descEn: 'Utilize `<algorithm>` header `std::sort()` which uses hybrid QuickSort, HeapSort, and InsertionSort.',
        descTe: 'C++ లోని std::sort() వాడటం ద్వారా అత్యంత వేగవంతమైన ఎగ్జిక్యూషన్ పొందవచ్చు.',
        improvedCode: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    std::sort(arr.begin(), arr.end());
    
    std::cout << "Sorted: ";
    for (int x : arr) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}
`
      });
    }
  }

  // Suggestion: Fast I/O for C++ Competitive Programming
  if ((lang === 'cpp' || lang === 'c') && code.includes('cin') && !code.includes('sync_with_stdio')) {
    suggestions.push({
      id: 'opt_fast_io',
      title: 'Enable Fast I/O Accelerator for Competitive Programming',
      impact: 'Reduces standard I/O overhead by up to 80%',
      descEn: 'Untie C++ standard streams from C stdio to enable blisteringly fast inputs/outputs.',
      descTe: 'సినిమా, సీన్ల వేగం కోసం C++ లో Fast I/O లైన్స్ జోడించండి.',
      improvedCode: `// Add at the top of main()
std::ios_base::sync_with_stdio(false);
std::cin.tie(NULL);
`
    });
  }

  // Suggestion: Python List Comprehension instead of append loop
  if (lang === 'python' && code.includes('.append(') && code.includes('for ')) {
    suggestions.push({
      id: 'opt_list_comp',
      title: 'Replace .append() Loop with List Comprehension',
      impact: '20% - 30% faster execution at C-level bytecode',
      descEn: 'List comprehensions bypass Python interpreter bytecode method lookup overheads.',
      descTe: 'అపెండ్ లూప్ బదులు లిస్ట్ కాంప్రహెన్షన్ వాడితే కోడ్ క్లీన్‌గా మరియు వేగంగా ఉంటుంది.',
      improvedCode: `# Example List Comprehension:
# result = [x * 2 for x in numbers if x > 0]
`
    });
  }

  return suggestions;
}
