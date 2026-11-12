// ============================================================================
// Elite IDE - X-Ray Live Line-by-Line Dry-Run Tracer & Interview Viva Engine
// Parses Python, JavaScript, C, C++, and Java code safely in-browser to build:
//   1. Step-by-step execution trace table (Step, Line, Variables Snapshot, Output)
//   2. Tailored Interview & College Lab Viva Questions based on user's actual code
// ============================================================================

const MAX_TRACE_STEPS = 120;

function stripTypePrefix(line) {
  return line
    .trim()
    .replace(/^(?:const|let|var|int|long(?:\s+long)?|float|double|char|bool|boolean|String|auto|unsigned\s+int|unsigned)\s+/i, '')
    .replace(/;$/, '')
    .trim();
}

function safeEvalExpr(expr, scope) {
  const clean = expr
    .trim()
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\/\/(?=\s*[\w(])/g, '/') // basic python floor div marker
    .replace(/\blen\s*\(\s*([a-zA-Z_]\w*)\s*\)/g, '($1 ? $1.length : 0)');

  try {
    const keys = Object.keys(scope);
    const vals = Object.values(scope);
    const fn = new Function(...keys, `"use strict"; return (${clean});`);
    const res = fn(...vals);
    if (res === undefined) return expr;
    return res;
  } catch {
    // Fallback string literal or simple lookup
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      return clean.slice(1, -1);
    }
    if (Object.prototype.hasOwnProperty.call(scope, clean)) {
      return scope[clean];
    }
    return expr;
  }
}

function snapshotVars(scope) {
  const out = {};
  for (const [k, v] of Object.entries(scope)) {
    out[k] = Array.isArray(v) ? [...v] : v;
  }
  return out;
}

export function generateDryRunTrace(code = '', language = 'python') {
  const rawLines = (code || '').split('\n');
  const lines = rawLines.map((text, idx) => ({ lineNumber: idx + 1, raw: text, trimmed: text.trim() }));
  const steps = [];
  const scope = {};
  let outputs = [];

  const pushStep = (lineNumber, codeText, note, outputLine = null) => {
    if (steps.length >= MAX_TRACE_STEPS) return;
    if (outputLine !== null) outputs.push(outputLine);
    steps.push({
      step: steps.length + 1,
      lineNumber,
      code: codeText.slice(0, 72),
      note,
      variables: snapshotVars(scope),
      output: outputLine
    });
  };

  // Detect simple loop blocks across Python & C-style languages
  let i = 0;
  let guard = 0;
  while (i < lines.length && steps.length < MAX_TRACE_STEPS && guard < 300) {
    guard++;
    const { lineNumber, trimmed } = lines[i];
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('import ') || trimmed.startsWith('#include') || trimmed === '{' || trimmed === '}' || /^(?:public\s+class|class\s+|def\s+main|int\s+main|void\s+main|public\s+static\s+void\s+main)/.test(trimmed)) {
      i++;
      continue;
    }

    // 1. Python range for-loop: for i in range(a, b):
    const pyForRange = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\(([^)]+)\)\s*:/);
    if (pyForRange) {
      const loopVar = pyForRange[1];
      const args = pyForRange[2].split(',').map((a) => Number(safeEvalExpr(a, scope)));
      const start = args.length >= 2 ? args[0] : 0;
      const stop = args.length >= 2 ? args[1] : (args[0] || 0);
      const step = args.length >= 3 ? (args[2] || 1) : 1;
      const baseIndent = rawLines[i].search(/\S|$/);

      const bodyLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (!nextLine.trimmed) { j++; continue; }
        const ind = rawLines[j].search(/\S|$/);
        if (ind <= baseIndent) break;
        bodyLines.push(nextLine);
        j++;
      }

      const maxIters = 15;
      let iterCount = 0;
      for (let val = start; step > 0 ? val < stop : val > stop; val += step) {
        if (iterCount++ >= maxIters || steps.length >= MAX_TRACE_STEPS) break;
        scope[loopVar] = val;
        pushStep(lineNumber, trimmed, `Loop iteration: ${loopVar} = ${val}`);
        for (const bl of bodyLines) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
      }
      i = j;
      continue;
    }

    // 2. C/C++/Java/JS for-loop: for (int i = 0; i < n; i++)
    const cForMatch = trimmed.match(/^for\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/);
    if (cForMatch) {
      const initStmt = stripTypePrefix(cForMatch[1]);
      const condExpr = cForMatch[2].trim();
      const incStmt = cForMatch[3].trim();

      // Init var
      executeSingleLine(lineNumber, initStmt, scope, pushStep, false);

      // Collect brace block or next single statement
      const bodyLines = [];
      let j = i + 1;
      if (trimmed.includes('{') || (lines[j] && lines[j].trimmed.startsWith('{'))) {
        let depth = trimmed.includes('{') ? 1 : 0;
        if (!trimmed.includes('{')) { depth = 1; j++; }
        while (j < lines.length && depth > 0) {
          const t = lines[j].trimmed;
          if (t.includes('{')) depth++;
          if (t.includes('}')) depth--;
          if (depth > 0 && t && t !== '{' && t !== '}') bodyLines.push(lines[j]);
          j++;
        }
      } else if (j < lines.length) {
        bodyLines.push(lines[j]);
        j++;
      }

      let iter = 0;
      while (iter++ < 15 && steps.length < MAX_TRACE_STEPS) {
        const condOk = Boolean(safeEvalExpr(condExpr, scope));
        if (!condOk) {
          pushStep(lineNumber, trimmed, `Loop condition (${condExpr}) became false -> exit`);
          break;
        }
        pushStep(lineNumber, trimmed, `Condition (${condExpr}) is true`);
        for (const bl of bodyLines) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
        executeSingleLine(lineNumber, incStmt, scope, pushStep, false);
      }
      i = j;
      continue;
    }

    executeSingleLine(lineNumber, trimmed, scope, pushStep);
    i++;
  }

  return {
    steps,
    finalVariables: snapshotVars(scope),
    outputs,
    vivaQuestions: generateVivaQuestions(code, language)
  };
}

function executeSingleLine(lineNumber, rawTrimmed, scope, pushStep, record = true) {
  const cleaned = stripTypePrefix(rawTrimmed);
  if (!cleaned || cleaned === '{' || cleaned === '}') return;

  // Print / cout / System.out / console.log
  const printMatch =
    cleaned.match(/^print\s*\((.+)\)$/) ||
    cleaned.match(/^console\.log\s*\((.+)\)$/) ||
    cleaned.match(/^System\.out\.println?\s*\((.+)\)$/);
  if (printMatch) {
    const val = safeEvalExpr(printMatch[1], scope);
    if (record) pushStep(lineNumber, rawTrimmed, `Printed output: ${JSON.stringify(val)}`, String(val));
    return;
  }

  // Compound increments: x++ / x-- / x += y
  const incMatch = cleaned.match(/^([a-zA-Z_]\w*)\s*(\+\+|--)$/);
  if (incMatch) {
    const k = incMatch[1];
    scope[k] = Number(scope[k] || 0) + (incMatch[2] === '++' ? 1 : -1);
    if (record) pushStep(lineNumber, rawTrimmed, `Updated ${k} = ${scope[k]}`);
    return;
  }

  const compoundMatch = cleaned.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
  if (compoundMatch) {
    const k = compoundMatch[1];
    const rhs = Number(safeEvalExpr(compoundMatch[3], scope));
    const cur = Number(scope[k] || 0);
    if (compoundMatch[2] === '+=') scope[k] = cur + rhs;
    else if (compoundMatch[2] === '-=') scope[k] = cur - rhs;
    else if (compoundMatch[2] === '*=') scope[k] = cur * rhs;
    else if (compoundMatch[2] === '/=') scope[k] = rhs !== 0 ? Number((cur / rhs).toFixed(3)) : cur;
    if (record) pushStep(lineNumber, rawTrimmed, `${k} changed to ${scope[k]}`);
    return;
  }

  // Array literal: arr = [1, 2, 3] or arr[] = {1, 2, 3}
  const arrMatch = cleaned.match(/^([a-zA-Z_]\w*)(?:\[\s*\])?\s*=\s*[\[{]([^\]}]+)[\]}]$/);
  if (arrMatch) {
    const arrName = arrMatch[1];
    scope[arrName] = arrMatch[2].split(',').map((item) => safeEvalExpr(item, scope));
    if (record) pushStep(lineNumber, rawTrimmed, `Initialized array ${arrName} (${scope[arrName].length} items)`);
    return;
  }

  // Standard variable assignment: x = expr
  const assignMatch = cleaned.match(/^([a-zA-Z_]\w*)\s*=\s*([^=].*)$/);
  if (assignMatch) {
    const k = assignMatch[1];
    const val = safeEvalExpr(assignMatch[2], scope);
    scope[k] = val;
    if (record) pushStep(lineNumber, rawTrimmed, `Set ${k} = ${JSON.stringify(val)}`);
    return;
  }

  if (record && !/^(return\b|break\b|continue\b)/.test(cleaned)) {
    pushStep(lineNumber, rawTrimmed, 'Evaluated statement');
  }
}

export function generateVivaQuestions(code = '', language = 'python') {
  const lower = (code || '').toLowerCase();
  const questions = [];

  const loopMatches = (code.match(/\b(for|while)\b/g) || []).length;
  if (loopMatches >= 2) {
    questions.push({
      q: 'What is the time complexity of nested loops in your code, and can it be optimized?',
      a: 'Nested loops typically run in O(N²). During interviews (TCS NQT / Infosys / Product rounds), consider using a HashMap/Set or Sliding Window to optimize to O(N).'
    });
  } else if (loopMatches === 1) {
    questions.push({
      q: 'How many times does your loop execute for input size N, and what is the space complexity?',
      a: 'A single linear loop executes N times giving O(N) time complexity; if variables are scalar, auxiliary space stays O(1).'
    });
  }

  if (/def\s+([a-zA-Z_]\w*)[\s\S]*\b\1\s*\(/.test(code) || /\b(fib|fact|dfs|solve|mergesort|quicksort)\s*\(/i.test(code)) {
    questions.push({
      q: 'Why is a base case mandatory in your recursive function, and what happens without it?',
      a: 'Without a valid base case, recursion creates infinite stack frames and triggers a StackOverflowError / RecursionError.'
    });
  }

  if (language === 'sql' || lower.includes('select ') || lower.includes('java.sql')) {
    questions.push({
      q: 'Why should PreparedStatement or parameterized queries be preferred over string concatenation in SQL?',
      a: 'Parameterized queries prevent SQL Injection attacks and allow the database engine to reuse compiled execution plans.'
    });
  }

  if (lower.includes('vector<') || lower.includes('array') || code.includes('[')) {
    questions.push({
      q: 'What edge cases should you test for array/collection logic?',
      a: 'Always test empty input ([]), single-element arrays, negative numbers, duplicate elements, and out-of-bounds indices.'
    });
  }

  if (questions.length === 0) {
    questions.push({
      q: 'What is the difference between compilation time and runtime errors in this language?',
      a: 'Compilation errors occur when syntax or types are invalid before execution starts, whereas runtime errors occur during execution (e.g., division by zero or null access).'
    });
  }

  return questions.slice(0, 4);
}

