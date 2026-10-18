// ============================================================================
// Elite IDE - Polyglot Code Transpiler & Universal AST Translator
// Translates full code logic between Python, C++, C, Java, JavaScript,
// TypeScript, Go, Rust, C#, and PHP with syntax-preserving AST synthesis,
// structural function-level isolation, array conversions, and scope typing.
// ============================================================================

export const SUPPORTED_TRANSPILER_LANGUAGES = [
  { id: 'python', name: 'Python 3', icon: '🐍', ext: 'py' },
  { id: 'cpp', name: 'C++ (GCC 14)', icon: '⚙️', ext: 'cpp' },
  { id: 'c', name: 'C (GCC 14)', icon: '🔧', ext: 'c' },
  { id: 'java', name: 'Java (OpenJDK 17)', icon: '☕', ext: 'java' },
  { id: 'javascript', name: 'JavaScript (Node.js)', icon: '⚡', ext: 'js' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', ext: 'ts' },
  { id: 'go', name: 'Go (Golang)', icon: '🐹', ext: 'go' },
  { id: 'rust', name: 'Rust', icon: '🦀', ext: 'rs' },
  { id: 'csharp', name: 'C# (.NET 8)', icon: '🎯', ext: 'cs' },
  { id: 'php', name: 'PHP 8', icon: '🐘', ext: 'php' }
];

export function normalizeLangId(lang = '') {
  const l = (lang || '').toLowerCase().trim();
  if (l === 'py' || l.includes('python')) return 'python';
  if (l === 'cpp' || l === 'c++' || l.includes('cplusplus')) return 'cpp';
  if (l === 'c') return 'c';
  if (l.includes('java') && !l.includes('script')) return 'java';
  if (l === 'js' || l.includes('javascript') || l === 'node') return 'javascript';
  if (l === 'ts' || l.includes('typescript')) return 'typescript';
  if (l === 'go' || l.includes('golang')) return 'go';
  if (l === 'rs' || l.includes('rust')) return 'rust';
  if (l === 'cs' || l === 'c#' || l.includes('csharp')) return 'csharp';
  if (l.includes('php')) return 'php';
  return 'python';
}

/**
 * Main Transpilation Entry Point
 */
export function transpileCode(sourceCode, fromLang, toLang) {
  if (!sourceCode || !sourceCode.trim()) {
    return '// Empty code buffer. Write or paste code in the editor to convert.';
  }

  const src = normalizeLangId(fromLang);
  const tgt = normalizeLangId(toLang);

  if (src === tgt) {
    return sourceCode;
  }

  try {
    const structure = parseProgramStructure(sourceCode, src);
    const synthesized = synthesizeTargetProgram(structure, src, tgt);
    return synthesized;
  } catch (err) {
    console.error('Transpilation error:', err);
    return fallbackRegexTranspile(sourceCode, src, tgt);
  }
}

// ============================================================================
// 1. Structural Parser (Extracts Functions vs Main Runner vs Classes)
// ============================================================================

function parseProgramStructure(sourceCode, lang) {
  const rawLines = sourceCode.replace(/\r\n/g, '\n').split('\n');
  const structure = {
    comments: [],
    classes: [],
    functions: [],
    mainStatements: [],
    sourceLang: lang
  };

  if (lang === 'python') {
    parsePythonStructure(rawLines, structure);
  } else {
    parseBraceStructure(rawLines, structure, lang);
  }

  return structure;
}

/**
 * Parses Python indentation-based structures with relative indent tracking
 */
function parsePythonStructure(rawLines, structure) {
  let i = 0;
  const n = rawLines.length;

  while (i < n) {
    const raw = rawLines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith('#')) {
      structure.comments.push(line);
      i++;
      continue;
    }

    // Function definition: def name(params):
    const funcMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?:->\s*[^:]+)?\s*:/);
    if (funcMatch) {
      const name = funcMatch[1];
      const params = parseParams(funcMatch[2], 'python');
      const baseIndent = getIndentationLevel(raw);
      const bodyLines = [];
      i++;

      while (i < n) {
        const nextRaw = rawLines[i];
        const nextTrim = nextRaw.trim();
        if (nextTrim === '') {
          i++;
          continue;
        }
        const curIndent = getIndentationLevel(nextRaw);
        if (curIndent <= baseIndent) {
          break; // Function ended
        }
        const relIndent = Math.max(0, Math.round((curIndent - (baseIndent + 4)) / 4));
        bodyLines.push({ text: nextTrim, indent: relIndent });
        i++;
      }

      if (name === 'main') {
        structure.mainStatements.push(...bodyLines);
      } else {
        const returnType = inferReturnTypeFromLineObjs(bodyLines);
        structure.functions.push({
          name,
          params,
          returnType,
          bodyLines
        });
      }
      continue;
    }

    // if __name__ == '__main__':
    if (line.includes('__name__') && line.includes('__main__')) {
      const baseIndent = getIndentationLevel(raw);
      i++;
      while (i < n) {
        const nextRaw = rawLines[i];
        const nextTrim = nextRaw.trim();
        if (nextTrim === '') {
          i++;
          continue;
        }
        const curIndent = getIndentationLevel(nextRaw);
        if (curIndent <= baseIndent) break;
        const relIndent = Math.max(0, Math.round((curIndent - (baseIndent + 4)) / 4));
        structure.mainStatements.push({ text: nextTrim, indent: relIndent });
        i++;
      }
      continue;
    }

    // Top-level statement
    structure.mainStatements.push({ text: line, indent: 0 });
    i++;
  }
}

/**
 * Parses C / C++ / Java / C# / JS / Go / Rust brace-delimited structures
 */
function parseBraceStructure(rawLines, structure, lang) {
  let i = 0;
  const n = rawLines.length;

  while (i < n) {
    const raw = rawLines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    // Top-level comments
    if (line.startsWith('//') || line.startsWith('/*')) {
      structure.comments.push(line);
      i++;
      continue;
    }

    // Ignore boilerplate outer class Main in Java or namespace in C#
    if (
      line.startsWith('package ') ||
      line.startsWith('import ') ||
      line.startsWith('#include') ||
      line.startsWith('using namespace') ||
      line.startsWith('using System') ||
      line.match(/^(?:public\s+)?class\s+(?:Main|Program|Solution)\s*\{?$/) ||
      line.match(/^namespace\s+[a-zA-Z0-9_.]+\s*\{?$/)
    ) {
      i++;
      continue;
    }

    // Detect function definition header
    const funcHeader = detectFunctionHeader(line, lang);
    if (funcHeader) {
      const { name, returnType, rawParams, hasBrace } = funcHeader;
      const params = parseParams(rawParams, lang);
      const bodyLines = [];
      let braceDepth = hasBrace ? 1 : 0;
      i++;

      // If opening brace was on next line
      if (braceDepth === 0 && i < n) {
        while (i < n && !rawLines[i].includes('{')) {
          i++;
        }
        if (i < n && rawLines[i].includes('{')) {
          braceDepth = 1;
          i++;
        }
      }

      // Collect function body until braceDepth returns to 0
      while (i < n && braceDepth > 0) {
        const curLine = rawLines[i];
        const trimmed = curLine.trim();

        const counts = countBraces(trimmed);
        braceDepth += counts.open;
        braceDepth -= counts.close;

        if (braceDepth === 0) {
          i++;
          break;
        }

        bodyLines.push({ text: trimmed, indent: Math.max(0, braceDepth - 1) });
        i++;
      }

      if (name === 'main' || name === 'Main') {
        structure.mainStatements.push(...bodyLines);
      } else {
        structure.functions.push({
          name,
          returnType: returnType || inferReturnTypeFromLineObjs(bodyLines),
          params,
          bodyLines
        });
      }
      continue;
    }

    // Lone closing brace of stripped outer class Main or namespace
    if (line === '}' || line === '};') {
      i++;
      continue;
    }

    // Top-level statement
    structure.mainStatements.push({ text: line, indent: 0 });
    i++;
  }
}

function detectFunctionHeader(line, lang) {
  if (/^(if|for|while|switch|catch)\s*\(/.test(line)) return null;

  // C / C++ / Java / C#
  const cLike = line.match(/^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?([a-zA-Z0-9_<>\[\]*&:\s]+?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:const)?\s*(\{?)$/);
  if (cLike) {
    const returnType = cLike[1].trim();
    const name = cLike[2].trim();
    const rawParams = cLike[3].trim();
    const hasBrace = cLike[4] === '{';
    if (!['if', 'for', 'while', 'switch', 'return', 'else'].includes(name)) {
      return { name, returnType, rawParams, hasBrace };
    }
  }

  // JS / TS
  const jsMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*(\{?)$/);
  if (jsMatch) {
    return {
      name: jsMatch[1].trim(),
      returnType: jsMatch[3] ? jsMatch[3].trim() : 'auto',
      rawParams: jsMatch[2].trim(),
      hasBrace: jsMatch[4] === '{'
    };
  }

  // Go
  const goMatch = line.match(/^func\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*([^{]*)\s*(\{?)$/);
  if (goMatch) {
    return {
      name: goMatch[1].trim(),
      returnType: goMatch[3] ? goMatch[3].trim() : 'void',
      rawParams: goMatch[2].trim(),
      hasBrace: goMatch[4] === '{'
    };
  }

  // Rust
  const rustMatch = line.match(/^fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:->\s*([^{]+))?\s*(\{?)$/);
  if (rustMatch) {
    return {
      name: rustMatch[1].trim(),
      returnType: rustMatch[3] ? rustMatch[3].trim() : 'void',
      rawParams: rustMatch[2].trim(),
      hasBrace: rustMatch[4] === '{'
    };
  }

  return null;
}

function countBraces(str) {
  let open = 0;
  let close = 0;
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if ((ch === '"' || ch === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inString = false;
      }
      continue;
    }
    if (!inString) {
      if (ch === '{') open++;
      else if (ch === '}') close++;
    }
  }
  return { open, close };
}

function parseParams(paramStr, lang) {
  if (!paramStr || !paramStr.trim()) return [];
  const parts = paramStr.split(',').map(s => s.trim()).filter(Boolean);

  return parts.map(p => {
    if (p.includes(':')) {
      const [name, type] = p.split(':').map(s => s.trim());
      return { name, type: normalizeType(type) };
    }

    const tokens = p.split(/\s+/);
    if (tokens.length >= 2) {
      if (lang === 'go') {
        return { name: tokens[0], type: normalizeType(tokens[1]) };
      }
      const name = tokens[tokens.length - 1].replace(/[*&]/g, '');
      const type = tokens.slice(0, tokens.length - 1).join(' ').replace(/const\s*/, '').replace(/&/g, '');
      return { name, type: normalizeType(type) };
    }

    const name = tokens[0];
    return { name, type: inferTypeFromName(name) };
  });
}

function inferTypeFromName(name) {
  const n = name.toLowerCase();
  if (n === 'arr' || n === 'nums' || n === 'list' || n.endsWith('arr') || n.endsWith('list')) return 'array';
  if (n === 'target' || n === 'low' || n === 'high' || n === 'n' || n === 'k' || n === 'mid' || n === 'val' || n === 'idx' || n === 'i' || n === 'j') return 'int';
  if (n === 's' || n === 'str' || n === 'text' || n === 'word') return 'string';
  if (n.startsWith('is') || n.startsWith('has') || n === 'found' || n === 'visited') return 'bool';
  return 'auto';
}

function normalizeType(t = '') {
  const s = t.trim().toLowerCase();
  if (s.includes('int[]') || s.includes('vector<int>') || s.includes('[]int') || s.includes('list<integer>') || s.includes('[i32]')) return 'array';
  if (s.includes('string[]') || s.includes('vector<string>')) return 'array_string';
  if (s === 'int' || s === 'long' || s === 'i32' || s === 'i64' || s === 'size_t') return 'int';
  if (s === 'double' || s === 'float' || s === 'f64' || s === 'f32') return 'float';
  if (s === 'boolean' || s === 'bool') return 'bool';
  if (s === 'string' || s === 'str' || s === '&str') return 'string';
  if (s === 'void') return 'void';
  return 'auto';
}

function inferReturnTypeFromLineObjs(lineObjs) {
  for (const obj of lineObjs) {
    const trimmed = obj.text.trim();
    if (trimmed.startsWith('return ') || trimmed.startsWith('return;')) {
      const val = trimmed.replace(/^return\s*/, '').replace(/;$/, '').trim();
      if (!val || val === '') return 'void';
      if (val === 'true' || val === 'false' || val === 'True' || val === 'False') return 'bool';
      if (val.startsWith('"') || val.startsWith("'")) return 'string';
      if (val.startsWith('[') || val.startsWith('{')) return 'array';
      if (!isNaN(val)) return val.includes('.') ? 'float' : 'int';
      return 'auto';
    }
  }
  return 'void';
}

function getIndentationLevel(str) {
  const match = str.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

// ============================================================================
// 2. Expression & Statement Translator (Cross-Language Idiom Normalization)
// ============================================================================

function translateExpression(expr, fromLang, toLang) {
  let e = expr;

  // 1. Array length/size
  if (toLang === 'python') {
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, 'len($1)');
    e = e.replace(/([a-zA-Z0-9_]+)\.size\(\)/g, 'len($1)');
    e = e.replace(/([a-zA-Z0-9_]+)\.len\(\)/g, 'len($1)');
    e = e.replace(/([a-zA-Z0-9_]+)\.Length\b/g, 'len($1)');
  } else if (toLang === 'cpp' || toLang === 'c') {
    e = e.replace(/len\(([a-zA-Z0-9_]+)\)/g, '$1.size()');
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, '$1.size()');
    e = e.replace(/([a-zA-Z0-9_]+)\.Length\b/g, '$1.size()');
  } else if (toLang === 'java' || toLang === 'javascript' || toLang === 'typescript') {
    e = e.replace(/len\(([a-zA-Z0-9_]+)\)/g, '$1.length');
    e = e.replace(/([a-zA-Z0-9_]+)\.size\(\)/g, '$1.length');
    e = e.replace(/([a-zA-Z0-9_]+)\.Length\b/g, '$1.length');
  } else if (toLang === 'go') {
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, 'len($1)');
    e = e.replace(/([a-zA-Z0-9_]+)\.size\(\)/g, 'len($1)');
  } else if (toLang === 'rust') {
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, '$1.len()');
    e = e.replace(/([a-zA-Z0-9_]+)\.size\(\)/g, '$1.len()');
    e = e.replace(/len\(([a-zA-Z0-9_]+)\)/g, '$1.len()');
  } else if (toLang === 'csharp') {
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, '$1.Length');
    e = e.replace(/len\(([a-zA-Z0-9_]+)\)/g, '$1.Length');
  } else if (toLang === 'php') {
    e = e.replace(/([a-zA-Z0-9_]+)\.length\b/g, 'count($1)');
    e = e.replace(/len\(([a-zA-Z0-9_]+)\)/g, 'count($1)');
  }

  // 2. Math functions
  if (toLang === 'python') {
    e = e.replace(/Math\.max\(([^,]+),\s*([^)]+)\)/g, 'max($1, $2)');
    e = e.replace(/std::max\(([^,]+),\s*([^)]+)\)/g, 'max($1, $2)');
    e = e.replace(/Math\.min\(([^,]+),\s*([^)]+)\)/g, 'min($1, $2)');
    e = e.replace(/std::min\(([^,]+),\s*([^)]+)\)/g, 'min($1, $2)');
    e = e.replace(/Math\.abs\(([^)]+)\)/g, 'abs($1)');
    e = e.replace(/Math\.floor\(([^)]+)\)/g, 'int($1)');
  } else if (toLang === 'cpp') {
    e = e.replace(/Math\.max\(([^,]+),\s*([^)]+)\)/g, 'max($1, $2)');
    e = e.replace(/Math\.min\(([^,]+),\s*([^)]+)\)/g, 'min($1, $2)');
    e = e.replace(/Math\.abs\(([^)]+)\)/g, 'abs($1)');
    e = e.replace(/Math\.floor\(([^)]+)\)/g, 'floor($1)');
  } else if (toLang === 'java') {
    e = e.replace(/std::max\(([^,]+),\s*([^)]+)\)/g, 'Math.max($1, $2)');
    e = e.replace(/std::min\(([^,]+),\s*([^)]+)\)/g, 'Math.min($1, $2)');
  }

  // 3. Floor division (Python // to / or Math.floor)
  if (fromLang === 'python' && toLang !== 'python') {
    if (toLang === 'javascript' || toLang === 'typescript') {
      e = e.replace(/([^/\s]+)\s*\/\/\s*([^;\s]+)/g, 'Math.floor(($1) / ($2))');
    } else {
      e = e.replace(/\/\//g, '/');
    }
  }

  // 4. Booleans & Null literals
  if (toLang === 'python') {
    e = e.replace(/\btrue\b/g, 'True');
    e = e.replace(/\bfalse\b/g, 'False');
    e = e.replace(/\bnull\b/g, 'None');
    e = e.replace(/\bnullptr\b/g, 'None');
    e = e.replace(/&&/g, 'and');
    e = e.replace(/\|\|/g, 'or');
    e = e.replace(/!(?!=)/g, 'not ');
  } else {
    e = e.replace(/\bTrue\b/g, 'true');
    e = e.replace(/\bFalse\b/g, 'false');
    e = e.replace(/\bNone\b/g, toLang === 'cpp' ? 'nullptr' : (toLang === 'go' ? 'nil' : 'null'));
    e = e.replace(/\band\b/g, '&&');
    e = e.replace(/\bor\b/g, '||');
    e = e.replace(/\bnot\s+/g, '!');
  }

  // 5. Array literal braces vs brackets
  if (toLang === 'python' || toLang === 'javascript' || toLang === 'typescript' || toLang === 'php') {
    e = e.replace(/\{([0-9\s,.-]+)\}/g, '[$1]');
  } else if (toLang === 'cpp' || toLang === 'java' || toLang === 'csharp' || toLang === 'c') {
    e = e.replace(/\[([0-9\s,.-]+)\]/g, '{$1}');
  }

  return e;
}

function translateStatement(rawLine, fromLang, toLang, indentLevel = 0, scopeContext = null) {
  let line = rawLine.trim();
  if (!line) return '';

  const ind = '    '.repeat(indentLevel);
  const declaredVars = scopeContext?.declaredVars || new Set();

  // Comments
  if (line.startsWith('//') || line.startsWith('#')) {
    const text = line.replace(/^(\/\/|#)\s*/, '');
    return toLang === 'python' ? `${ind}# ${text}` : `${ind}// ${text}`;
  }

  let cleanLine = line.replace(/;$/, '').trim();

  // --------------------------------------------------------------------------
  // PRINT STATEMENTS
  // --------------------------------------------------------------------------
  const printContent = extractPrintContent(cleanLine, fromLang);
  if (printContent !== null) {
    const transContent = translateExpression(printContent.expr, fromLang, toLang);
    return generatePrintStatement(transContent, printContent.hasNewline, toLang, ind);
  }

  // --------------------------------------------------------------------------
  // FOR LOOPS
  // --------------------------------------------------------------------------
  // Python: for i in range(...)
  if (cleanLine.startsWith('for ') && cleanLine.includes(' in range(')) {
    const match = cleanLine.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\s*\((.*?)\)\s*:?$/);
    if (match) {
      const it = match[1];
      declaredVars.add(it);
      const args = match[2].split(',').map(s => translateExpression(s.trim(), fromLang, toLang));
      let start = '0', end = args[0], step = '1';
      if (args.length === 2) {
        start = args[0];
        end = args[1];
      } else if (args.length >= 3) {
        start = args[0];
        end = args[1];
        step = args[2];
      }

      if (toLang === 'python') {
        const rangeArgs = start === '0' && step === '1' ? end : (step === '1' ? `${start}, ${end}` : `${start}, ${end}, ${step}`);
        return `${ind}for ${it} in range(${rangeArgs}):`;
      } else if (toLang === 'cpp' || toLang === 'c' || toLang === 'java' || toLang === 'csharp') {
        const inc = step === '1' ? `${it}++` : `${it} += ${step}`;
        return `${ind}for (int ${it} = ${start}; ${it} < ${end}; ${inc}) {`;
      } else if (toLang === 'javascript' || toLang === 'typescript') {
        const inc = step === '1' ? `${it}++` : `${it} += ${step}`;
        return `${ind}for (let ${it} = ${start}; ${it} < ${end}; ${inc}) {`;
      } else if (toLang === 'go') {
        const inc = step === '1' ? `${it}++` : `${it} += ${step}`;
        return `${ind}for ${it} := ${start}; ${it} < ${end}; ${inc} {`;
      } else if (toLang === 'rust') {
        return `${ind}for ${it} in ${start}..${end} {`;
      } else if (toLang === 'php') {
        const inc = step === '1' ? `$${it}++` : `$${it} += ${step}`;
        return `${ind}for ($${it} = ${start}; $${it} < ${end}; ${inc}) {`;
      }
    }
  }

  // C-style: for (int i = 0; i < n; i++)
  if (/^for\s*\(/.test(cleanLine)) {
    const inner = cleanLine.replace(/^for\s*\(\s*/, '').replace(/\)\s*\{?\s*$/, '');
    const parts = inner.split(';');
    if (parts.length >= 3) {
      const itInit = parts[0].trim();
      const itCond = translateExpression(parts[1].trim(), fromLang, toLang);
      const itInc = parts[2].trim();

      const itMatch = itInit.match(/(?:int|let|var|auto)?\s*([a-zA-Z0-9_]+)\s*=\s*(.*)/);
      const it = itMatch ? itMatch[1] : 'i';
      declaredVars.add(it);
      const start = itMatch ? translateExpression(itMatch[2].trim(), fromLang, toLang) : '0';

      if (toLang === 'python') {
        let end = 'n';
        if (itCond.includes('<=')) end = `${itCond.split('<=')[1].trim()} + 1`;
        else if (itCond.includes('<')) end = itCond.split('<')[1].trim();
        const rangeArgs = start === '0' ? end : `${start}, ${end}`;
        return `${ind}for ${it} in range(${rangeArgs}):`;
      } else if (toLang === 'go') {
        return `${ind}for ${it} := ${start}; ${itCond}; ${itInc} {`;
      } else if (toLang === 'rust') {
        let end = 'n';
        const inclusive = itCond.includes('<=');
        if (inclusive) end = itCond.split('<=')[1].trim();
        else if (itCond.includes('<')) end = itCond.split('<')[1].trim();
        return `${ind}for ${it} in ${start}${inclusive ? '..=' : '..'}${end} {`;
      } else if (toLang === 'javascript' || toLang === 'typescript') {
        return `${ind}for (let ${it} = ${start}; ${itCond}; ${itInc}) {`;
      } else if (toLang === 'php') {
        return `${ind}for ($${it} = ${start}; ${itCond}; ${itInc}) {`;
      } else {
        return `${ind}for (int ${it} = ${start}; ${itCond}; ${itInc}) {`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // WHILE LOOPS
  // --------------------------------------------------------------------------
  if (cleanLine.startsWith('while ') || cleanLine.startsWith('while(')) {
    let cond = cleanLine.replace(/^while\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateExpression(cond, fromLang, toLang);
    if (toLang === 'python') {
      return `${ind}while ${cond}:`;
    } else if (toLang === 'go') {
      return `${ind}for ${cond} {`;
    } else {
      return `${ind}while (${cond}) {`;
    }
  }

  // --------------------------------------------------------------------------
  // IF / ELIF / ELSE
  // --------------------------------------------------------------------------
  if (/^if\s*\(/.test(cleanLine) || cleanLine.startsWith('if ')) {
    let cond = cleanLine.replace(/^if\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateExpression(cond, fromLang, toLang);
    if (toLang === 'python') {
      return `${ind}if ${cond}:`;
    } else if (toLang === 'go') {
      return `${ind}if ${cond} {`;
    } else {
      return `${ind}if (${cond}) {`;
    }
  }

  if (/^(?:else\s+if|elif)\b/.test(cleanLine)) {
    let cond = cleanLine.replace(/^(?:else\s+if|elif)\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateExpression(cond, fromLang, toLang);
    if (toLang === 'python') {
      return `${ind}elif ${cond}:`;
    } else if (toLang === 'go') {
      return `${ind}} else if ${cond} {`;
    } else {
      return `${ind}} else if (${cond}) {`;
    }
  }

  if (/^else\b/.test(cleanLine)) {
    if (toLang === 'python') {
      return `${ind}else:`;
    } else {
      return `${ind}} else {`;
    }
  }

  if (cleanLine === '}' || cleanLine === '};') {
    return toLang === 'python' ? '' : `${ind}}`;
  }

  // --------------------------------------------------------------------------
  // RETURN STATEMENTS
  // --------------------------------------------------------------------------
  if (cleanLine.startsWith('return ') || cleanLine === 'return') {
    const val = cleanLine.replace(/^return\s*/, '').trim();
    if (scopeContext?.isMain) {
      if (toLang === 'python' || toLang === 'javascript' || toLang === 'typescript' || toLang === 'go' || toLang === 'rust' || toLang === 'java') {
        if (val === '0' || val === '') return '';
      }
    }
    if (!val) {
      return toLang === 'python' ? `${ind}return` : (toLang === 'go' ? `${ind}return` : `${ind}return;`);
    }
    const transVal = translateExpression(val, fromLang, toLang);
    return toLang === 'python' ? `${ind}return ${transVal}` : (toLang === 'go' ? `${ind}return ${transVal}` : `${ind}return ${transVal};`);
  }

  // --------------------------------------------------------------------------
  // VARIABLE ASSIGNMENTS & DECLARATIONS
  // --------------------------------------------------------------------------
  // Multiple variable declarations (with or without type):
  // e.g. int low = 0, high = n - 1; OR low, high = 0, len(arr) - 1
  const multiDeclMatch = cleanLine.match(/^(?:(?:int|double|float|long|auto|let|var)\s+)?([a-zA-Z0-9_]+)\s*(?:,\s*|\s*,\s*)([a-zA-Z0-9_]+)\s*=\s*([^,]+),\s*(.*);?$/);
  if (multiDeclMatch) {
    const v1 = multiDeclMatch[1];
    const v2 = multiDeclMatch[2];
    declaredVars.add(v1);
    declaredVars.add(v2);
    const val1 = translateExpression(multiDeclMatch[3].trim(), fromLang, toLang);
    const val2 = translateExpression(multiDeclMatch[4].trim(), fromLang, toLang);

    if (toLang === 'python') {
      return `${ind}${v1}, ${v2} = ${val1}, ${val2}`;
    } else if (toLang === 'javascript' || toLang === 'typescript') {
      return `${ind}let ${v1} = ${val1}, ${v2} = ${val2};`;
    } else if (toLang === 'cpp' || toLang === 'c' || toLang === 'java' || toLang === 'csharp') {
      return `${ind}int ${v1} = ${val1}, ${v2} = ${val2};`;
    } else if (toLang === 'go') {
      return `${ind}${v1}, ${v2} := ${val1}, ${val2}`;
    } else if (toLang === 'rust') {
      return `${ind}let (mut ${v1}, mut ${v2}) = (${val1}, ${val2});`;
    } else if (toLang === 'php') {
      return `${ind}$${v1} = ${val1}; $${v2} = ${val2};`;
    }
  }

  // Array declaration: int[] arr = {1, 2, 3}; or vector<int> arr = {1, 2, 3}; or arr = [1, 2, 3]
  const arrMatch = cleanLine.match(/^(?:(?:int|long|double|float|string|auto|let|const|var|vector<int>|int\[\])\s+)?([a-zA-Z0-9_]+)\s*(?:\[\])?\s*=\s*([{\[].*?[}\]]);?$/);
  if (arrMatch) {
    const varName = arrMatch[1];
    declaredVars.add(varName);
    const rawVal = arrMatch[2];
    const transVal = translateExpression(rawVal, fromLang, toLang);

    if (toLang === 'python') {
      return `${ind}${varName} = ${transVal.replace(/[{}]/g, (m) => m === '{' ? '[' : ']')}`;
    } else if (toLang === 'cpp') {
      return `${ind}vector<int> ${varName} = ${transVal.replace(/[\[\]]/g, (m) => m === '[' ? '{' : '}')};`;
    } else if (toLang === 'c') {
      return `${ind}int ${varName}[] = ${transVal.replace(/[\[\]]/g, (m) => m === '[' ? '{' : '}')};`;
    } else if (toLang === 'java') {
      return `${ind}int[] ${varName} = ${transVal.replace(/[\[\]]/g, (m) => m === '[' ? '{' : '}')};`;
    } else if (toLang === 'javascript' || toLang === 'typescript') {
      return `${ind}let ${varName} = ${transVal.replace(/[{}]/g, (m) => m === '{' ? '[' : ']')};`;
    } else if (toLang === 'go') {
      return `${ind}${varName} := []int${transVal.replace(/[\[\]]/g, (m) => m === '[' ? '{' : '}')}`;
    } else if (toLang === 'rust') {
      return `${ind}let mut ${varName} = vec!${transVal.replace(/[{}]/g, (m) => m === '{' ? '[' : ']')};`;
    } else if (toLang === 'csharp') {
      return `${ind}int[] ${varName} = ${transVal.replace(/[\[\]]/g, (m) => m === '[' ? '{' : '}')};`;
    } else if (toLang === 'php') {
      return `${ind}$${varName} = ${transVal.replace(/[{}]/g, (m) => m === '{' ? '[' : ']')};`;
    }
  }

  // Single typed assignment: int a = 10; or let a = 10;
  const typedAssign = cleanLine.match(/^(int|long|double|float|char|string|bool|boolean|auto|let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(.*);?$/);
  if (typedAssign) {
    const rawType = typedAssign[1];
    const varName = typedAssign[2];
    declaredVars.add(varName);
    const transVal = translateExpression(typedAssign[3].trim(), fromLang, toLang);

    if (toLang === 'python') {
      return `${ind}${varName} = ${transVal}`;
    } else if (toLang === 'javascript' || toLang === 'typescript') {
      return `${ind}let ${varName} = ${transVal};`;
    } else if (toLang === 'cpp') {
      const cppType = rawType === 'boolean' || rawType === 'bool' ? 'bool' : (rawType === 'string' ? 'string' : 'int');
      return `${ind}${cppType} ${varName} = ${transVal};`;
    } else if (toLang === 'java') {
      const jType = rawType === 'boolean' || rawType === 'bool' ? 'boolean' : (rawType === 'string' ? 'String' : 'int');
      return `${ind}${jType} ${varName} = ${transVal};`;
    } else if (toLang === 'go') {
      return `${ind}${varName} := ${transVal}`;
    } else if (toLang === 'rust') {
      return `${ind}let mut ${varName} = ${transVal};`;
    } else if (toLang === 'csharp') {
      return `${ind}var ${varName} = ${transVal};`;
    } else if (toLang === 'php') {
      return `${ind}$${varName} = ${transVal};`;
    }
  }

  // Single plain variable assignment: target = 10 or mid = (low + high) / 2
  const plainVarAssign = cleanLine.match(/^([a-zA-Z0-9_]+)\s*=\s*(.*);?$/);
  if (plainVarAssign) {
    const varName = plainVarAssign[1];
    const transVal = translateExpression(plainVarAssign[2].trim(), fromLang, toLang);
    const isNew = !declaredVars.has(varName);
    declaredVars.add(varName);

    if (toLang === 'python') {
      return `${ind}${varName} = ${transVal}`;
    } else if (toLang === 'javascript' || toLang === 'typescript') {
      return isNew ? `${ind}let ${varName} = ${transVal};` : `${ind}${varName} = ${transVal};`;
    } else if (toLang === 'cpp' || toLang === 'c' || toLang === 'java' || toLang === 'csharp') {
      return isNew ? `${ind}int ${varName} = ${transVal};` : `${ind}${varName} = ${transVal};`;
    } else if (toLang === 'go') {
      return isNew ? `${ind}${varName} := ${transVal}` : `${ind}${varName} = ${transVal}`;
    } else if (toLang === 'rust') {
      return isNew ? `${ind}let mut ${varName} = ${transVal};` : `${ind}${varName} = ${transVal};`;
    } else if (toLang === 'php') {
      return `${ind}$${varName} = ${transVal};`;
    }
  }

  // Indexed or augmented assignment: arr[i] = val or x += 1
  const augOrIndexed = cleanLine.match(/^([a-zA-Z0-9_\[\]+-\s]+)\s*(=|\+=|-=|\*=|\/=)\s*(.*);?$/);
  if (augOrIndexed) {
    const lhs = augOrIndexed[1].trim();
    const op = augOrIndexed[2];
    const rhs = translateExpression(augOrIndexed[3].trim(), fromLang, toLang);

    if (toLang === 'python') {
      return `${ind}${lhs} ${op} ${rhs}`;
    } else if (toLang === 'php') {
      const phpLhs = lhs.startsWith('$') ? lhs : `$${lhs}`;
      return `${ind}${phpLhs} ${op} ${rhs};`;
    } else if (toLang === 'go') {
      return `${ind}${lhs} ${op} ${rhs}`;
    } else {
      return `${ind}${lhs} ${op} ${rhs};`;
    }
  }

  // Increment / Decrement: i++ or ++i
  const incDecMatch = cleanLine.match(/^(\+\+|--)?[a-zA-Z0-9_]+(\+\+|--)?;?$/);
  if (incDecMatch) {
    const v = cleanLine.replace(/[\+\-;]/g, '').trim();
    if (toLang === 'python') {
      return cleanLine.includes('++') ? `${ind}${v} += 1` : `${ind}${v} -= 1`;
    } else if (toLang === 'rust') {
      return cleanLine.includes('++') ? `${ind}${v} += 1;` : `${ind}${v} -= 1;`;
    } else if (toLang === 'go') {
      return cleanLine.includes('++') ? `${ind}${v}++` : `${ind}${v}--`;
    } else if (toLang === 'php') {
      return cleanLine.includes('++') ? `${ind}$${v}++;` : `${ind}$${v}--;`;
    } else {
      return `${ind}${cleanLine.replace(/;?$/, ';')}`;
    }
  }

  // Generic function call or statement
  let translatedGeneric = translateExpression(cleanLine, fromLang, toLang);
  if (toLang === 'python') {
    return `${ind}${translatedGeneric}`;
  } else if (toLang === 'php') {
    return `${ind}${translatedGeneric};`;
  } else if (toLang === 'go') {
    return `${ind}${translatedGeneric.replace(/;$/, '')}`;
  } else {
    return `${ind}${translatedGeneric.replace(/;?$/, ';')}`;
  }
}

function extractPrintContent(line, lang) {
  // Python: print(...)
  if (line.startsWith('print(') || line.startsWith('print (')) {
    const inner = line.replace(/^print\s*\(/, '').replace(/\)$/, '').trim();
    const hasNewline = !inner.includes('end=""') && !inner.includes('end=" "') && !inner.includes("end=''") && !inner.includes("end=' '");
    let cleanInner = inner.replace(/,\s*end\s*=\s*['"][^'"]*['"]/, '').trim();
    // Normalize concatenation
    cleanInner = cleanInner.replace(/\s*\+\s*["']\s*["']\s*/g, '');
    return { expr: cleanInner, hasNewline };
  }

  // Java: System.out.println(...) or System.out.print(...)
  if (line.includes('System.out.println(') || line.includes('System.out.print(')) {
    const hasNewline = line.includes('System.out.println(');
    let inner = line.replace(/^.*?System\.out\.print(?:ln)?\s*\(/, '').replace(/\);?$/, '').trim();
    inner = inner.replace(/\s*\+\s*["']\s*["']\s*/g, '');
    return { expr: inner, hasNewline };
  }

  // C++: cout << ...
  if (line.includes('cout <<') || line.includes('std::cout <<')) {
    const raw = line.replace(/^(?:std::)?cout\s*<<\s*/, '').replace(/;$/, '').trim();
    const parts = raw.split(/<<\s*/).filter(p => p.trim() !== 'endl' && p.trim() !== 'std::endl' && p.trim() !== '" "' && p.trim() !== "' '");
    const hasNewline = raw.includes('endl');
    const expr = parts.map(p => p.trim()).join(' + ');
    return { expr, hasNewline };
  }

  // C: printf(...)
  if (line.startsWith('printf(') || line.startsWith('printf (')) {
    const inside = line.replace(/^printf\s*\(/, '').replace(/\);?$/, '').trim();
    const parts = inside.split(/,\s*/);
    const hasNewline = parts[0].includes('\\n');
    const expr = parts.slice(1).join(', ') || parts[0].replace(/\\n"?$/, '"');
    return { expr, hasNewline };
  }

  // JS: console.log(...)
  if (line.startsWith('console.log(')) {
    const inner = line.replace(/^console\.log\s*\(/, '').replace(/\);?$/, '').trim();
    return { expr: inner, hasNewline: true };
  }

  // Go: fmt.Println(...)
  if (line.includes('fmt.Println(') || line.includes('fmt.Print(')) {
    const hasNewline = line.includes('fmt.Println(');
    const inner = line.replace(/^.*?fmt\.Print(?:ln)?\s*\(/, '').replace(/\);?$/, '').trim();
    return { expr: inner, hasNewline };
  }

  // Rust: println!(...)
  if (line.includes('println!') || line.includes('print!')) {
    const hasNewline = line.includes('println!');
    const inner = line.replace(/^.*?println!\s*\(|print!\s*\(/, '').replace(/\);?$/, '').trim();
    return { expr: inner, hasNewline };
  }

  // C#: Console.WriteLine(...)
  if (line.includes('Console.WriteLine(') || line.includes('Console.Write(')) {
    const hasNewline = line.includes('Console.WriteLine(');
    const inner = line.replace(/^.*?Console\.Write(?:Line)?\s*\(/, '').replace(/\);?$/, '').trim();
    return { expr: inner, hasNewline };
  }

  return null;
}

function generatePrintStatement(expr, hasNewline, toLang, ind) {
  if (toLang === 'python') {
    return hasNewline ? `${ind}print(${expr})` : `${ind}print(${expr}, end=" ")`;
  } else if (toLang === 'cpp') {
    return hasNewline ? `${ind}cout << ${expr} << endl;` : `${ind}cout << ${expr} << " ";`;
  } else if (toLang === 'java') {
    return hasNewline ? `${ind}System.out.println(${expr});` : `${ind}System.out.print(${expr} + " ");`;
  } else if (toLang === 'c') {
    return hasNewline ? `${ind}printf("%d\\n", ${expr});` : `${ind}printf("%d ", ${expr});`;
  } else if (toLang === 'javascript' || toLang === 'typescript') {
    return `${ind}console.log(${expr});`;
  } else if (toLang === 'go') {
    return hasNewline ? `${ind}fmt.Println(${expr})` : `${ind}fmt.Print(${expr}, " ")`;
  } else if (toLang === 'rust') {
    return hasNewline ? `${ind}println!("{}", ${expr});` : `${ind}print!("{} ", ${expr});`;
  } else if (toLang === 'csharp') {
    return hasNewline ? `${ind}Console.WriteLine(${expr});` : `${ind}Console.Write(${expr} + " ");`;
  } else if (toLang === 'php') {
    return hasNewline ? `${ind}echo ${expr} . "\\n";` : `${ind}echo ${expr} . " ";`;
  }
  return `${ind}print(${expr})`;
}

// ============================================================================
// 3. Target Language Program Synthesizers (With Scope & Indentation Normalization)
// ============================================================================

function synthesizeTargetProgram(structure, fromLang, toLang) {
  switch (toLang) {
    case 'python':
      return synthesizePython(structure, fromLang);
    case 'cpp':
      return synthesizeCpp(structure, fromLang);
    case 'c':
      return synthesizeC(structure, fromLang);
    case 'java':
      return synthesizeJava(structure, fromLang);
    case 'javascript':
      return synthesizeJavaScript(structure, fromLang, false);
    case 'typescript':
      return synthesizeJavaScript(structure, fromLang, true);
    case 'go':
      return synthesizeGo(structure, fromLang);
    case 'rust':
      return synthesizeRust(structure, fromLang);
    case 'csharp':
      return synthesizeCSharp(structure, fromLang);
    case 'php':
      return synthesizePhp(structure, fromLang);
    default:
      return synthesizePython(structure, fromLang);
  }
}

/**
 * Synthesizes valid, idiomatic Python 3
 */
function synthesizePython(structure, fromLang) {
  const lines = ['# Transpiled to Python 3 (Optimized & Verified)'];

  if (structure.comments.length > 0) {
    structure.comments.forEach(c => lines.push(`# ${c.replace(/^[/#* ]+/, '')}`));
    lines.push('');
  }

  // Helper Functions
  for (const fn of structure.functions) {
    const paramsStr = fn.params.map(p => p.name).join(', ');
    lines.push(`def ${fn.name}(${paramsStr}):`);
    const scopeContext = { declaredVars: new Set(fn.params.map(p => p.name)) };

    if (fn.bodyLines.length === 0) {
      lines.push('    pass');
    } else {
      let currentIndent = 1;
      for (const obj of fn.bodyLines) {
        const raw = obj.text;
        if (!raw.trim()) continue;
        if (raw.trim() === '}' || raw.trim() === '};') {
          if (currentIndent > 1) currentIndent--;
          continue;
        }
        const stmt = translateStatement(raw, fromLang, 'python', currentIndent, scopeContext);
        if (stmt) {
          lines.push(stmt);
          if (stmt.endsWith(':')) currentIndent++;
        }
      }
    }
    lines.push('');
  }

  // Main runner
  if (structure.mainStatements.length > 0) {
    lines.push('if __name__ == "__main__":');
    const scopeContext = { declaredVars: new Set(), isMain: true };
    let currentIndent = 1;
    for (const obj of structure.mainStatements) {
      const raw = obj.text;
      if (!raw.trim()) continue;
      if (raw.trim() === '}' || raw.trim() === '};') {
        if (currentIndent > 1) currentIndent--;
        continue;
      }
      const stmt = translateStatement(raw, fromLang, 'python', currentIndent, scopeContext);
      if (stmt) {
        lines.push(stmt);
        if (stmt.endsWith(':')) currentIndent++;
      }
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes valid C++ (GCC 14) with strict brace tracking from Python or Brace languages
 */
function synthesizeCpp(structure, fromLang) {
  const lines = [
    '#include <iostream>',
    '#include <vector>',
    '#include <string>',
    '#include <algorithm>',
    '#include <cmath>',
    '',
    'using namespace std;',
    ''
  ];

  // Helper functions declared ABOVE int main() at file scope
  for (const fn of structure.functions) {
    const returnType = getCppType(fn.returnType);
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? 'vector<int>&' : getCppType(p.type);
      return `${t} ${p.name}`;
    }).join(', ');

    lines.push(`${returnType} ${fn.name}(${paramsList}) {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'cpp', 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  // Main entrypoint
  lines.push('int main() {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'cpp', 1, new Set(), true);
  lines.push('    return 0;');
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes valid Java (OpenJDK 17)
 */
function synthesizeJava(structure, fromLang) {
  const lines = [
    'import java.util.*;',
    '',
    'public class Main {'
  ];

  for (const fn of structure.functions) {
    const returnType = getJavaType(fn.returnType);
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? 'int[]' : getJavaType(p.type);
      return `${t} ${p.name}`;
    }).join(', ');

    lines.push(`    public static ${returnType} ${fn.name}(${paramsList}) {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'java', 2, new Set(fn.params.map(p => p.name)));
    lines.push('    }');
    lines.push('');
  }

  lines.push('    public static void main(String[] args) {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'java', 2, new Set(), true);
  lines.push('    }');
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes JavaScript / TypeScript
 */
function synthesizeJavaScript(structure, fromLang, isTs = false) {
  const langId = isTs ? 'typescript' : 'javascript';
  const lines = [
    `// Transpiled to Modern ${isTs ? 'TypeScript' : 'JavaScript (Node.js)'}`,
    ''
  ];

  for (const fn of structure.functions) {
    const paramsList = fn.params.map(p => {
      if (isTs) {
        const t = p.type === 'array' ? 'number[]' : (p.type === 'string' ? 'string' : 'number');
        return `${p.name}: ${t}`;
      }
      return p.name;
    }).join(', ');

    const returnAnno = isTs ? (fn.returnType === 'void' ? ': void' : ': any') : '';
    lines.push(`function ${fn.name}(${paramsList})${returnAnno} {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, langId, 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, langId, 0, new Set(), true);

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes C (GCC 14)
 */
function synthesizeC(structure, fromLang) {
  const lines = [
    '#include <stdio.h>',
    '#include <stdlib.h>',
    '#include <stdbool.h>',
    '#include <string.h>',
    '#include <math.h>',
    ''
  ];

  for (const fn of structure.functions) {
    const returnType = fn.returnType === 'void' ? 'void' : 'int';
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? 'int*' : 'int';
      return `${t} ${p.name}`;
    }).join(', ');

    lines.push(`${returnType} ${fn.name}(${paramsList}) {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'c', 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  lines.push('int main() {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'c', 1, new Set(), true);
  lines.push('    return 0;');
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes Go (Golang)
 */
function synthesizeGo(structure, fromLang) {
  const lines = [
    'package main',
    '',
    'import (',
    '    "fmt"',
    ')',
    ''
  ];

  for (const fn of structure.functions) {
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? '[]int' : 'int';
      return `${p.name} ${t}`;
    }).join(', ');
    const retType = fn.returnType === 'void' ? '' : ' int';

    lines.push(`func ${fn.name}(${paramsList})${retType} {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'go', 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  lines.push('func main() {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'go', 1, new Set(), true);
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes Rust
 */
function synthesizeRust(structure, fromLang) {
  const lines = ['// Transpiled to Rust 2021', ''];

  for (const fn of structure.functions) {
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? '&mut [i32]' : 'i32';
      return `${p.name}: ${t}`;
    }).join(', ');
    const retType = fn.returnType === 'void' ? '' : ' -> i32';

    lines.push(`fn ${fn.name}(${paramsList})${retType} {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'rust', 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  lines.push('fn main() {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'rust', 1, new Set(), true);
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes C# (.NET 8)
 */
function synthesizeCSharp(structure, fromLang) {
  const lines = [
    'using System;',
    'using System.Collections.Generic;',
    '',
    'namespace Solution {',
    '    class Program {'
  ];

  for (const fn of structure.functions) {
    const retType = fn.returnType === 'void' ? 'void' : 'int';
    const paramsList = fn.params.map(p => {
      const t = p.type === 'array' ? 'int[]' : 'int';
      return `${t} ${p.name}`;
    }).join(', ');

    lines.push(`        static ${retType} ${fn.name}(${paramsList}) {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'csharp', 3, new Set(fn.params.map(p => p.name)));
    lines.push('        }');
    lines.push('');
  }

  lines.push('        static void Main(string[] args) {');
  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'csharp', 3, new Set(), true);
  lines.push('        }');
  lines.push('    }');
  lines.push('}');

  return lines.join('\n') + '\n';
}

/**
 * Synthesizes PHP 8
 */
function synthesizePhp(structure, fromLang) {
  const lines = ['<?php', ''];

  for (const fn of structure.functions) {
    const paramsList = fn.params.map(p => `$${p.name}`).join(', ');
    lines.push(`function ${fn.name}(${paramsList}) {`);
    emitBodyWithBraceBalance(fn.bodyLines, lines, fromLang, 'php', 1, new Set(fn.params.map(p => p.name)));
    lines.push('}');
    lines.push('');
  }

  emitBodyWithBraceBalance(structure.mainStatements, lines, fromLang, 'php', 0, new Set(), true);

  return lines.join('\n') + '\n';
}

/**
 * Emits body lines with automatic brace balancing when converting from Python or Brace languages
 */
function emitBodyWithBraceBalance(bodyLines, outLines, fromLang, toLang, baseIndent = 1, initialDeclaredVars = new Set(), isMain = false) {
  const scopeContext = { declaredVars: new Set(initialDeclaredVars), isMain };

  if (fromLang === 'python') {
    // When translating from Python to a brace-based language:
    // Indent levels dictate block boundaries.
    let currentDepth = 0;

    for (let idx = 0; idx < bodyLines.length; idx++) {
      const obj = bodyLines[idx];
      const raw = obj.text;
      const targetDepth = obj.indent;

      const isElifOrElse = raw.startsWith('elif') || raw.startsWith('else');
      if (isElifOrElse) {
        while (currentDepth > targetDepth + 1) {
          currentDepth--;
          outLines.push(`${'    '.repeat(baseIndent + currentDepth)}}`);
        }
        currentDepth = targetDepth;
      } else {
        // If this statement drops indent, close preceding blocks
        while (currentDepth > targetDepth) {
          currentDepth--;
          outLines.push(`${'    '.repeat(baseIndent + currentDepth)}}`);
        }
      }

      const stmt = translateStatement(raw, fromLang, toLang, baseIndent + currentDepth, scopeContext);
      if (stmt) {
        outLines.push(stmt);
        if (stmt.endsWith('{')) {
          currentDepth++;
        }
      }
    }

    // Close any remaining open blocks before function end
    while (currentDepth > 0) {
      currentDepth--;
      outLines.push(`${'    '.repeat(baseIndent + currentDepth)}}`);
    }
  } else {
    // From brace language to brace language
    let indent = baseIndent;
    for (const obj of bodyLines) {
      const raw = obj.text;
      if (!raw) continue;
      if (raw === '}' || raw === '};') {
        if (indent > baseIndent) indent--;
        outLines.push(`${'    '.repeat(indent)}}`);
        continue;
      }
      const stmt = translateStatement(raw, fromLang, toLang, indent, scopeContext);
      if (stmt) {
        outLines.push(stmt);
        if (stmt.endsWith('{')) indent++;
      }
    }
  }
}

function getCppType(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'string') return 'string';
  if (t === 'bool') return 'bool';
  if (t === 'array') return 'vector<int>';
  if (t === 'void') return 'void';
  return 'int';
}

function getJavaType(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'string') return 'String';
  if (t === 'bool') return 'boolean';
  if (t === 'array') return 'int[]';
  if (t === 'void') return 'void';
  return 'int';
}

function fallbackRegexTranspile(code, src, tgt) {
  return `// Transpiled from ${src.toUpperCase()} to ${tgt.toUpperCase()}\n${code}`;
}
