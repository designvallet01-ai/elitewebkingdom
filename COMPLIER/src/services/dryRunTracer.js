// ============================================================================
// Elite IDE - X-Ray Live Line-by-Line Dry-Run Tracer
// Parses Python, JavaScript, C, C++, and Java code safely in-browser to build
// a step-by-step execution trace table (Line, Variable Snapshots, Stdout).
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
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\blen\s*\(\s*([a-zA-Z_]\w*)\s*\)/g, '($1 ? $1.length : 0)');

  try {
    const keys = Object.keys(scope);
    const vals = Object.values(scope);
    const fn = new Function(...keys, `"use strict"; return (${clean});`);
    const res = fn(...vals);
    if (res === undefined) return expr;
    return res;
  } catch {
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
  const outputs = [];

  const pushStep = (lineNumber, codeText, note, outputLine = null) => {
    if (steps.length >= MAX_TRACE_STEPS) return;
    if (outputLine !== null) outputs.push(outputLine);
    steps.push({
      step: steps.length + 1,
      lineNumber,
      code: codeText.slice(0, 72),
      note,
      variables: snapshotVars(scope),
      output: outputLine,
      accumulatedOutput: outputs.join('\n')
    });
  };

  const collectIndentedBlock = (startIdx, baseIndent) => {
    const block = [];
    let j = startIdx + 1;
    while (j < lines.length) {
      const nextLine = lines[j];
      if (!nextLine.trimmed) { j++; continue; }
      const ind = rawLines[j].search(/\S|$/);
      if (ind <= baseIndent) break;
      block.push(nextLine);
      j++;
    }
    return { block, nextIdx: j };
  };

  const collectBraceBlock = (startIdx, trimmedLine) => {
    const block = [];
    let j = startIdx + 1;
    if (trimmedLine.includes('{') || (lines[j] && lines[j].trimmed.startsWith('{'))) {
      let depth = trimmedLine.includes('{') ? 1 : 0;
      if (!trimmedLine.includes('{')) { depth = 1; j++; }
      while (j < lines.length && depth > 0) {
        const t = lines[j].trimmed;
        if (t.includes('{')) depth++;
        if (t.includes('}')) depth--;
        if (depth > 0 && t && t !== '{' && t !== '}') block.push(lines[j]);
        j++;
      }
    } else if (j < lines.length) {
      block.push(lines[j]);
      j++;
    }
    return { block, nextIdx: j };
  };

  let i = 0;
  let guard = 0;
  while (i < lines.length && steps.length < MAX_TRACE_STEPS && guard < 350) {
    guard++;
    const { lineNumber, trimmed } = lines[i];
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('#include') ||
      trimmed.startsWith('using namespace') ||
      trimmed === '{' ||
      trimmed === '}' ||
      /^(?:public\s+class|class\s+|def\s+\w+\(|int\s+main|void\s+main|public\s+static\s+void\s+main)/.test(trimmed)
    ) {
      i++;
      continue;
    }

    // 1. Python range for-loop
    const pyForRange = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\(([^)]+)\)\s*:/);
    if (pyForRange) {
      const loopVar = pyForRange[1];
      const args = pyForRange[2].split(',').map((a) => Number(safeEvalExpr(a, scope)));
      const start = args.length >= 2 ? args[0] : 0;
      const stop = args.length >= 2 ? args[1] : (args[0] || 0);
      const step = args.length >= 3 ? (args[2] || 1) : 1;
      const baseIndent = rawLines[i].search(/\S|$/);
      const { block, nextIdx } = collectIndentedBlock(i, baseIndent);

      let iterCount = 0;
      for (let val = start; step > 0 ? val < stop : val > stop; val += step) {
        if (iterCount++ >= 20 || steps.length >= MAX_TRACE_STEPS) break;
        scope[loopVar] = val;
        pushStep(lineNumber, trimmed, `Loop: ${loopVar} = ${val}`);
        for (const bl of block) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
      }
      i = nextIdx;
      continue;
    }

    // 2. Python while-loop
    const pyWhile = trimmed.match(/^while\s+(.+)\s*:$/);
    if (pyWhile) {
      const condExpr = pyWhile[1].trim();
      const baseIndent = rawLines[i].search(/\S|$/);
      const { block, nextIdx } = collectIndentedBlock(i, baseIndent);
      let iter = 0;
      while (iter++ < 20 && steps.length < MAX_TRACE_STEPS) {
        const ok = Boolean(safeEvalExpr(condExpr, scope));
        if (!ok) {
          pushStep(lineNumber, trimmed, `Condition (${condExpr}) is false -> exit`);
          break;
        }
        pushStep(lineNumber, trimmed, `While (${condExpr}) -> true`);
        for (const bl of block) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
      }
      i = nextIdx;
      continue;
    }

    // 3. C/C++/Java/JS for-loop
    const cForMatch = trimmed.match(/^for\s*\(\s*([^;]+);\s*([^;]+);\s*([^)]+)\)/);
    if (cForMatch) {
      const initStmt = stripTypePrefix(cForMatch[1]);
      const condExpr = cForMatch[2].trim();
      const incStmt = cForMatch[3].trim();

      executeSingleLine(lineNumber, initStmt, scope, pushStep, false);
      const { block, nextIdx } = collectBraceBlock(i, trimmed);

      let iter = 0;
      while (iter++ < 20 && steps.length < MAX_TRACE_STEPS) {
        const condOk = Boolean(safeEvalExpr(condExpr, scope));
        if (!condOk) {
          pushStep(lineNumber, trimmed, `Condition (${condExpr}) is false -> exit`);
          break;
        }
        pushStep(lineNumber, trimmed, `For (${condExpr}) -> true`);
        for (const bl of block) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
        executeSingleLine(lineNumber, incStmt, scope, pushStep, false);
      }
      i = nextIdx;
      continue;
    }

    // 4. C/C++/Java/JS while-loop
    const cWhile = trimmed.match(/^while\s*\((.+)\)/);
    if (cWhile) {
      const condExpr = cWhile[1].trim();
      const { block, nextIdx } = collectBraceBlock(i, trimmed);
      let iter = 0;
      while (iter++ < 20 && steps.length < MAX_TRACE_STEPS) {
        const condOk = Boolean(safeEvalExpr(condExpr, scope));
        if (!condOk) {
          pushStep(lineNumber, trimmed, `Condition (${condExpr}) is false -> exit`);
          break;
        }
        pushStep(lineNumber, trimmed, `While (${condExpr}) -> true`);
        for (const bl of block) {
          if (steps.length >= MAX_TRACE_STEPS) break;
          executeSingleLine(bl.lineNumber, bl.trimmed, scope, pushStep);
        }
      }
      i = nextIdx;
      continue;
    }

    executeSingleLine(lineNumber, trimmed, scope, pushStep);
    i++;
  }

  return {
    steps,
    finalVariables: snapshotVars(scope),
    outputs,
    language
  };
}

function executeSingleLine(lineNumber, rawTrimmed, scope, pushStep, record = true) {
  const cleaned = stripTypePrefix(rawTrimmed);
  if (!cleaned || cleaned === '{' || cleaned === '}') return;

  // Print / cout / console.log / System.out / printf
  const printMatch =
    cleaned.match(/^print\s*\((.+)\)$/) ||
    cleaned.match(/^console\.log\s*\((.+)\)$/) ||
    cleaned.match(/^System\.out\.println?\s*\((.+)\)$/);
  if (printMatch) {
    const val = safeEvalExpr(printMatch[1], scope);
    if (record) pushStep(lineNumber, rawTrimmed, `Stdout: ${String(val)}`, String(val));
    return;
  }

  const coutMatch = cleaned.match(/^(?:std::)?cout\s*<<\s*(.+)$/);
  if (coutMatch) {
    const parts = coutMatch[1]
      .split('<<')
      .map((p) => p.trim())
      .filter((p) => p && !/^(?:std::)?endl$/i.test(p) && p !== '"\\n"');
    const rendered = parts.map((p) => String(safeEvalExpr(p, scope))).join('');
    if (record) pushStep(lineNumber, rawTrimmed, `cout: ${rendered}`, rendered);
    return;
  }

  // Compound increments
  const incMatch = cleaned.match(/^([a-zA-Z_]\w*)\s*(\+\+|--)$/);
  if (incMatch) {
    const k = incMatch[1];
    scope[k] = Number(scope[k] || 0) + (incMatch[2] === '++' ? 1 : -1);
    if (record) pushStep(lineNumber, rawTrimmed, `${k} -> ${scope[k]}`);
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
    if (record) pushStep(lineNumber, rawTrimmed, `${k} -> ${scope[k]}`);
    return;
  }

  // Array literal
  const arrMatch = cleaned.match(/^([a-zA-Z_]\w*)(?:\[\s*\])?\s*=\s*[\[{]([^\]}]+)[\]}]$/);
  if (arrMatch) {
    const arrName = arrMatch[1];
    scope[arrName] = arrMatch[2].split(',').map((item) => safeEvalExpr(item, scope));
    if (record) pushStep(lineNumber, rawTrimmed, `${arrName} = [${scope[arrName].length} items]`);
    return;
  }

  // Variable assignment
  const assignMatch = cleaned.match(/^([a-zA-Z_]\w*)\s*=\s*([^=].*)$/);
  if (assignMatch) {
    const k = assignMatch[1];
    const val = safeEvalExpr(assignMatch[2], scope);
    scope[k] = val;
    if (record) pushStep(lineNumber, rawTrimmed, `${k} = ${JSON.stringify(val)}`);
    return;
  }

  if (record && !/^(return\b|break\b|continue\b)/.test(cleaned)) {
    pushStep(lineNumber, rawTrimmed, 'Executed statement');
  }
}
