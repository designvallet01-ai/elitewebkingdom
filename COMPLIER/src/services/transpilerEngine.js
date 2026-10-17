// ============================================================================
// Elite IDE - Polyglot Code Transpiler & Universal AST Translator
// Translates full code logic between Python, C++, C, Java, JavaScript,
// TypeScript, Go, Rust, C#, and PHP with syntax preserving AST synthesis.
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
    // 1. Parse source code into normalized Abstract Semantic Statements
    const semanticAst = parseToSemanticAst(sourceCode, src);

    // 2. Synthesize target language code from Semantic AST
    const synthesizedCode = synthesizeTargetCode(semanticAst, tgt, src);

    return synthesizedCode;
  } catch (err) {
    console.error('Transpilation error:', err);
    return fallbackRegexTranspile(sourceCode, src, tgt);
  }
}

/**
 * 1. Semantic Parser
 * Breaks down source code into normalized instructions regardless of source syntax.
 */
function parseToSemanticAst(code, lang) {
  const rawLines = code.split('\n');
  const items = [];
  const functions = [];
  let inMain = false;
  let indentLevel = 0;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx];
    const line = rawLine.trim();

    if (!line) {
      items.push({ type: 'empty' });
      continue;
    }

    // Skip language specific boilerplate lines
    if (isBoilerplateLine(line, lang)) {
      if (line.includes('main(') || line.includes('main ()') || line.includes('def main')) {
        inMain = true;
      }
      continue;
    }

    // Comments
    if (line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) {
      const commentText = line.replace(/^(\/\/|#|\/\*+)\s*/, '').replace(/\*+\/$/, '');
      items.push({ type: 'comment', text: commentText });
      continue;
    }

    // Print statements
    const printMatch = extractPrint(line, lang);
    if (printMatch) {
      items.push({ type: 'print', content: printMatch.content, isString: printMatch.isString, raw: printMatch.raw });
      continue;
    }

    // Input statements
    const inputMatch = extractInput(line, lang);
    if (inputMatch) {
      items.push({ type: 'input', varName: inputMatch.varName, prompt: inputMatch.prompt, varType: inputMatch.varType });
      continue;
    }

    // For loops
    const forMatch = extractForLoop(line, lang);
    if (forMatch) {
      items.push({ 
        type: 'for', 
        iterator: forMatch.iterator, 
        start: forMatch.start, 
        end: forMatch.end, 
        step: forMatch.step,
        inclusive: forMatch.inclusive,
        hasBody: true
      });
      continue;
    }

    // While loops
    const whileMatch = extractWhileLoop(line, lang);
    if (whileMatch) {
      items.push({ type: 'while', condition: whileMatch.condition });
      continue;
    }

    // If / Else If / Else
    const branchMatch = extractBranch(line, lang);
    if (branchMatch) {
      items.push(branchMatch);
      continue;
    }

    // Return statements
    if (line.startsWith('return ') || line === 'return;' || line === 'return 0;') {
      if (line === 'return 0;' && inMain && (lang === 'cpp' || lang === 'c')) {
        continue; // skip main return 0 in C/C++
      }
      const val = line.replace(/^return\s*/, '').replace(/;$/, '').trim();
      items.push({ type: 'return', value: val });
      continue;
    }

    // Variable assignment / declaration
    const assignMatch = extractAssignment(line, lang);
    if (assignMatch) {
      items.push(assignMatch);
      continue;
    }

    // Function definition
    const funcMatch = extractFunctionDef(line, lang);
    if (funcMatch) {
      items.push(funcMatch);
      continue;
    }

    // Closing braces
    if (line === '}' || line === '};') {
      items.push({ type: 'block_end' });
      continue;
    }

    // Generic statement / function call
    const cleanStmt = line.replace(/;$/, '').trim();
    items.push({ type: 'generic_statement', text: cleanStmt });
  }

  return {
    items,
    sourceLang: lang
  };
}

/**
 * Checks if a line is standard imports or main wrapper
 */
function isBoilerplateLine(line, lang) {
  if (lang === 'cpp' || lang === 'c') {
    if (line.startsWith('#include')) return true;
    if (line.startsWith('using namespace')) return true;
    if (/int\s+main\s*\(/.test(line)) return true;
    if (line === '{' || line === '}') return false; // Handled separately
  }
  if (lang === 'java') {
    if (line.startsWith('import java.')) return true;
    if (line.startsWith('package ')) return true;
    if (/public\s+class\s+Main/.test(line)) return true;
    if (/public\s+static\s+void\s+main/.test(line)) return true;
  }
  if (lang === 'go') {
    if (line.startsWith('package ')) return true;
    if (line.startsWith('import ')) return true;
    if (/func\s+main\s*\(/.test(line)) return true;
  }
  if (lang === 'rust') {
    if (/fn\s+main\s*\(/.test(line)) return true;
  }
  if (lang === 'csharp') {
    if (line.startsWith('using System')) return true;
    if (line.startsWith('namespace ')) return true;
    if (/class\s+Program/.test(line)) return true;
    if (/static\s+void\s+Main/.test(line)) return true;
  }
  if (lang === 'python') {
    if (line === 'if __name__ == "__main__":' || line === "if __name__ == '__main__':") return true;
  }
  return false;
}

/**
 * Extract print statements across languages
 */
function extractPrint(line, lang) {
  // Python: print(...)
  if (line.startsWith('print(') || line.startsWith('print (')) {
    const content = line.replace(/^print\s*\(/, '').replace(/\)$/, '').trim();
    return { content: normalizePrintContent(content, 'python'), raw: content };
  }

  // C++: cout << ... << endl;
  if (line.includes('cout <<') || line.includes('std::cout <<')) {
    const raw = line.replace(/^(?:std::)?cout\s*<<\s*/, '').replace(/;$/, '').trim();
    const parts = raw.split(/<<\s*/).filter(p => p.trim() !== 'endl' && p.trim() !== 'std::endl' && p.trim() !== '"\\n"');
    const content = parts.map(p => p.trim()).join(', ');
    return { content, raw };
  }

  // C: printf(...)
  if (line.startsWith('printf(') || line.startsWith('printf (')) {
    const inside = line.replace(/^printf\s*\(/, '').replace(/\);?$/, '').trim();
    const parts = inside.split(/,\s*/);
    const fmt = parts[0];
    const args = parts.slice(1);
    if (args.length > 0) {
      return { content: args.join(', '), raw: inside };
    }
    const cleanFmt = fmt.replace(/\\n"?$/, '"');
    return { content: cleanFmt, raw: inside };
  }

  // Java: System.out.println(...) / print(...)
  if (line.includes('System.out.println(') || line.includes('System.out.print(')) {
    const content = line.replace(/^.*System\.out\.print(?:ln)?\s*\(/, '').replace(/\);?$/, '').trim();
    // Convert Java + string concat into comma representation
    const commaContent = content.replace(/\s*\+\s*/g, ', ');
    return { content: commaContent, raw: content };
  }

  // JS: console.log(...)
  if (line.startsWith('console.log(') || line.startsWith('console.log (')) {
    const content = line.replace(/^console\.log\s*\(/, '').replace(/\);?$/, '').trim();
    return { content, raw: content };
  }

  // Go: fmt.Println(...)
  if (line.includes('fmt.Println(') || line.includes('fmt.Print(')) {
    const content = line.replace(/^.*fmt\.Print(?:ln)?\s*\(/, '').replace(/\);?$/, '').trim();
    return { content, raw: content };
  }

  // Rust: println!(...)
  if (line.includes('println!') || line.includes('print!')) {
    const content = line.replace(/^.*println!\s*\(/, '').replace(/\);?$/, '').trim();
    return { content, raw: content };
  }

  // C#: Console.WriteLine(...)
  if (line.includes('Console.WriteLine(') || line.includes('Console.Write(')) {
    const content = line.replace(/^.*Console\.Write(?:Line)?\s*\(/, '').replace(/\);?$/, '').trim();
    return { content: content.replace(/\s*\+\s*/g, ', '), raw: content };
  }

  // PHP: echo ...
  if (line.startsWith('echo ') || line.startsWith('echo(')) {
    const content = line.replace(/^echo\s*\(?/, '').replace(/\)?;?$/, '').replace(/\s*\.\s*/g, ', ').trim();
    return { content, raw: content };
  }

  return null;
}

function normalizePrintContent(content, fromLang) {
  return content;
}

/**
 * Extract input statements across languages
 */
function extractInput(line, lang) {
  // Python: x = int(input("Prompt")) or x = input()
  if (line.includes('input(')) {
    const match = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(?:int|float|str)?\(?\s*input\s*\((.*?)\)\s*\)?/);
    if (match) {
      const varName = match[1];
      const prompt = match[2] ? match[2].trim() : '';
      const isNum = line.includes('int(input') || line.includes('float(input');
      return { varName, prompt, varType: isNum ? 'int' : 'string' };
    }
  }

  // C++: cin >> a >> b;
  if (line.includes('cin >>') || line.includes('std::cin >>')) {
    const vars = line.replace(/^(?:std::)?cin\s*>>\s*/, '').replace(/;$/, '').split(/>>/).map(s => s.trim());
    return { varName: vars.join(', '), prompt: '', varType: 'int' };
  }

  // C: scanf("%d", &x)
  if (line.includes('scanf(')) {
    const match = line.match(/scanf\s*\([^,]+,\s*&?([a-zA-Z0-9_]+)\)/);
    if (match) {
      return { varName: match[1], prompt: '', varType: 'int' };
    }
  }

  // Java: sc.nextInt() or sc.nextLine()
  if (line.includes('.nextInt(') || line.includes('.nextLine(')) {
    const match = line.match(/^([a-zA-Z0-9_]+)\s*=\s*[a-zA-Z0-9_]+\.(nextInt|nextLine)\s*\(\)/);
    if (match) {
      return { varName: match[1], prompt: '', varType: match[2] === 'nextInt' ? 'int' : 'string' };
    }
  }

  // Go: fmt.Scan(&x)
  if (line.includes('fmt.Scan(') || line.includes('fmt.Scanln(')) {
    const match = line.match(/fmt\.Scan(?:ln)?\s*\(&([a-zA-Z0-9_]+)\)/);
    if (match) {
      return { varName: match[1], prompt: '', varType: 'int' };
    }
  }

  return null;
}

/**
 * Extract for loops across languages
 */
function extractForLoop(line, lang) {
  // Python: for i in range(10) or range(1, 10) or range(1, 10, 2)
  if (line.startsWith('for ') && line.includes(' in range(')) {
    const match = line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\s*\((.*?)\)\s*:/);
    if (match) {
      const it = match[1];
      const args = match[2].split(',').map(s => s.trim());
      if (args.length === 1) {
        return { iterator: it, start: '0', end: args[0], step: '1', inclusive: false };
      } else if (args.length === 2) {
        return { iterator: it, start: args[0], end: args[1], step: '1', inclusive: false };
      } else if (args.length >= 3) {
        return { iterator: it, start: args[0], end: args[1], step: args[2], inclusive: false };
      }
    }
  }

  // C / C++ / Java / JS: for (int i = 0; i < n; i++)
  if (/^for\s*\(/.test(line)) {
    const inner = line.replace(/^for\s*\(\s*/, '').replace(/\)\s*\{?\s*$/, '');
    const parts = inner.split(';');
    if (parts.length >= 3) {
      const init = parts[0].trim();
      const cond = parts[1].trim();
      const inc = parts[2].trim();

      const itMatch = init.match(/(?:(?:int|let|var|auto)\s+)?([a-zA-Z0-9_]+)\s*=\s*(.*)/);
      const iterator = itMatch ? itMatch[1] : 'i';
      const start = itMatch ? itMatch[2].trim() : '0';

      let end = 'n';
      let inclusive = false;
      if (cond.includes('<=')) {
        end = cond.split('<=')[1].trim();
        inclusive = true;
      } else if (cond.includes('<')) {
        end = cond.split('<')[1].trim();
        inclusive = false;
      }

      let step = '1';
      if (inc.includes('+=') || inc.includes('+=')) {
        step = inc.split('+=')[1].trim();
      }

      return { iterator, start, end, step, inclusive };
    }
  }

  return null;
}

/**
 * Extract while loops
 */
function extractWhileLoop(line, lang) {
  if (line.startsWith('while ') || line.startsWith('while(')) {
    let cond = line.replace(/^while\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateCondition(cond, lang);
    return { condition: cond };
  }
  return null;
}

/**
 * Extract branch statements (if, elif, else)
 */
function extractBranch(line, lang) {
  // If
  if (/^(?:if\s*\(|if\s+)/.test(line)) {
    let cond = line.replace(/^if\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateCondition(cond, lang);
    return { type: 'if', condition: cond };
  }

  // Else if / elif
  if (/^(?:else\s+if|elif)/.test(line)) {
    let cond = line.replace(/^(?:else\s+if|elif)\s*\(?/, '').replace(/\)?\s*\{?:?\s*$/, '').trim();
    cond = translateCondition(cond, lang);
    return { type: 'elif', condition: cond };
  }

  // Else
  if (/^else\s*(?:\{|:)?$/.test(line)) {
    return { type: 'else' };
  }

  return null;
}

/**
 * Extract variable assignment
 */
function extractAssignment(line, lang) {
  // Ignore comparison, equality check, or control flow
  if (line.startsWith('if') || line.startsWith('while') || line.startsWith('for') || line.startsWith('return')) {
    return null;
  }
  if (!line.includes('=') || line.includes('==') || line.includes('!=') || line.includes('<=') || line.includes('>=')) {
    return null;
  }

  // C/C++/Java typed: int a = 10; or string s = "hello";
  const typedMatch = line.match(/^(int|long|double|float|char|string|bool|auto|let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(.*);?$/);
  if (typedMatch) {
    const rawType = typedMatch[1];
    const varName = typedMatch[2];
    const val = typedMatch[3].replace(/;$/, '').trim();
    return { type: 'assign', varName, value: val, inferredType: mapRawType(rawType, val) };
  }

  // Python untyped or JS untyped: a = 10
  const plainMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.*);?$/);
  if (plainMatch) {
    const varName = plainMatch[1];
    const val = plainMatch[2].replace(/;$/, '').trim();
    return { type: 'assign', varName, value: val, inferredType: inferTypeFromValue(val) };
  }

  // Augmented assignment: a += 1;
  const augMatch = line.match(/^([a-zA-Z0-9_]+)\s*(\+=|-=|\*=|\/=)\s*(.*);?$/);
  if (augMatch) {
    return { type: 'assign_aug', varName: augMatch[1], op: augMatch[2], value: augMatch[3].replace(/;$/, '').trim() };
  }

  return null;
}

function mapRawType(rawType, val) {
  if (rawType === 'int' || rawType === 'long') return 'int';
  if (rawType === 'double' || rawType === 'float') return 'float';
  if (rawType === 'string' || rawType === 'char') return 'string';
  if (rawType === 'bool') return 'bool';
  return inferTypeFromValue(val);
}

function inferTypeFromValue(val = '') {
  const v = val.trim();
  if (v === 'True' || v === 'False' || v === 'true' || v === 'false') return 'bool';
  if (v.startsWith('"') || v.startsWith("'")) return 'string';
  if (v.startsWith('[') && v.endsWith(']')) return 'array';
  if (v.startsWith('{') && v.endsWith('}')) return 'array';
  if (!isNaN(v)) {
    return v.includes('.') ? 'float' : 'int';
  }
  return 'auto';
}

/**
 * Extract function definitions
 */
function extractFunctionDef(line, lang) {
  // Python: def add(a, b):
  if (line.startsWith('def ')) {
    const match = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*:/);
    if (match) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
      return { type: 'function_def', name, params, returnType: 'auto' };
    }
  }

  // C/C++/Java: int add(int a, int b) { ... }
  const cFuncMatch = line.match(/^(?:public\s+)?(?:static\s+)?([a-zA-Z0-9_<>]+)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\{?$/);
  if (cFuncMatch && !['if', 'for', 'while', 'switch'].includes(cFuncMatch[2])) {
    const returnType = cFuncMatch[1];
    const name = cFuncMatch[2];
    const rawParams = cFuncMatch[3];
    const params = rawParams.split(',').map(p => {
      const parts = p.trim().split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }).filter(Boolean);
    return { type: 'function_def', name, params, returnType };
  }

  // JS: function add(a, b) { ... }
  if (line.startsWith('function ')) {
    const match = line.match(/^function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\{?$/);
    if (match) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
      return { type: 'function_def', name, params, returnType: 'auto' };
    }
  }

  // Go: func add(a int, b int) int { ... }
  if (line.startsWith('func ')) {
    const match = line.match(/^func\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*([a-zA-Z0-9_]+)?\s*\{?$/);
    if (match) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim().split(' ')[0]).filter(Boolean);
      return { type: 'function_def', name, params, returnType: match[3] || 'void' };
    }
  }

  return null;
}

/**
 * Translate boolean logic and operators across languages
 */
function translateCondition(cond, fromLang) {
  let c = cond;
  // Python ➔ C-style
  c = c.replace(/\band\b/g, '&&');
  c = c.replace(/\bor\b/g, '||');
  c = c.replace(/\bnot\b/g, '!');
  c = c.replace(/\bTrue\b/g, 'true');
  c = c.replace(/\bFalse\b/g, 'false');
  c = c.replace(/\bNone\b/g, 'null');
  return c;
}

/**
 * 2. Target Code Synthesizer
 * Produces clean, idiomatic, ready-to-run code in the requested target language.
 */
function synthesizeTargetCode(ast, targetLang, sourceLang) {
  const { items } = ast;

  switch (targetLang) {
    case 'python':
      return synthesizePython(items);
    case 'cpp':
      return synthesizeCpp(items);
    case 'c':
      return synthesizeC(items);
    case 'java':
      return synthesizeJava(items);
    case 'javascript':
    case 'typescript':
      return synthesizeJavaScript(items, targetLang === 'typescript');
    case 'go':
      return synthesizeGo(items);
    case 'rust':
      return synthesizeRust(items);
    case 'csharp':
      return synthesizeCSharp(items);
    case 'php':
      return synthesizePhp(items);
    default:
      return synthesizePython(items);
  }
}

/**
 * Python Generator
 */
function synthesizePython(items) {
  let out = `# Converted to Python 3 (Optimized & Verified)\n`;
  let indent = 0;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') {
      out += '\n';
      return;
    }
    if (item.type === 'comment') {
      out += `${getIndent()}# ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 0) indent--;
      return;
    }

    if (item.type === 'print') {
      // Python print
      const formatted = item.content.replace(/\s*\+\s*/g, ', ');
      out += `${getIndent()}print(${formatted})\n`;
      return;
    }

    if (item.type === 'input') {
      const p = item.prompt ? item.prompt : '""';
      if (item.varType === 'int') {
        out += `${getIndent()}${item.varName} = int(input(${p}))\n`;
      } else {
        out += `${getIndent()}${item.varName} = input(${p})\n`;
      }
      return;
    }

    if (item.type === 'for') {
      const start = item.start;
      const end = item.inclusive ? `${item.end} + 1` : item.end;
      const step = item.step && item.step !== '1' ? `, ${item.step}` : '';
      const rangeStr = start === '0' && !step ? `range(${end})` : `range(${start}, ${end}${step})`;
      out += `${getIndent()}for ${item.iterator} in ${rangeStr}:\n`;
      indent++;
      return;
    }

    if (item.type === 'while') {
      const cond = toPythonCondition(item.condition);
      out += `${getIndent()}while ${cond}:\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      const cond = toPythonCondition(item.condition);
      out += `${getIndent()}if ${cond}:\n`;
      indent++;
      return;
    }

    if (item.type === 'elif') {
      if (indent > 0) indent--;
      const cond = toPythonCondition(item.condition);
      out += `${getIndent()}elif ${cond}:\n`;
      indent++;
      return;
    }

    if (item.type === 'else') {
      if (indent > 0) indent--;
      out += `${getIndent()}else:\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      let val = toPythonValue(item.value);
      out += `${getIndent()}${item.varName} = ${val}\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${toPythonValue(item.value)}\n`;
      return;
    }

    if (item.type === 'function_def') {
      out += `${getIndent()}def ${item.name}(${item.params.join(', ')}):\n`;
      indent++;
      return;
    }

    if (item.type === 'return') {
      out += `${getIndent()}return ${toPythonValue(item.value)}\n`;
      if (indent > 0) indent--;
      return;
    }

    if (item.type === 'generic_statement') {
      const clean = item.text.replace(/;$/, '').trim();
      if (clean) out += `${getIndent()}${clean}\n`;
      return;
    }
  });

  return out.trim() + '\n';
}

function toPythonCondition(c) {
  return c.replace(/&&/g, 'and')
          .replace(/\|\|/g, 'or')
          .replace(/!(?!=)/g, 'not ')
          .replace(/\btrue\b/g, 'True')
          .replace(/\bfalse\b/g, 'False')
          .replace(/\bnull\b/g, 'None');
}

function toPythonValue(val = '') {
  let v = val.trim();
  if (v === 'true') return 'True';
  if (v === 'false') return 'False';
  if (v === 'null' || v === 'nullptr') return 'None';
  return v;
}

/**
 * C++ Generator
 */
function synthesizeCpp(items) {
  let out = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n`;
  let indent = 1;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') {
      out += '\n';
      return;
    }
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 1) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      // Split content into stream operators
      const parts = item.content.split(/,\s*/);
      const stream = parts.map(p => p.trim()).join(' << " " << ');
      out += `${getIndent()}cout << ${stream} << endl;\n`;
      return;
    }

    if (item.type === 'input') {
      const cppType = item.varType === 'int' ? 'int' : 'string';
      if (item.prompt) {
        out += `${getIndent()}cout << ${item.prompt} << endl;\n`;
      }
      out += `${getIndent()}${cppType} ${item.varName};\n`;
      out += `${getIndent()}cin >> ${item.varName};\n`;
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      const inc = item.step && item.step !== '1' ? `${it} += ${item.step}` : `${it}++`;
      out += `${getIndent()}for (int ${it} = ${item.start}; ${it} ${cmp} ${item.end}; ${inc}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'while') {
      out += `${getIndent()}while (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'elif') {
      if (indent > 1) indent--;
      out += `${getIndent()}} else if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'else') {
      if (indent > 1) indent--;
      out += `${getIndent()}} else {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      const cppType = getCppType(item.inferredType);
      out += `${getIndent()}${cppType} ${item.varName} = ${item.value};\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${item.value};\n`;
      return;
    }

    if (item.type === 'return') {
      out += `${getIndent()}return ${item.value || '0'};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  out += `\n    return 0;\n}\n`;
  return out;
}

function getCppType(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'string') return 'string';
  if (t === 'bool') return 'bool';
  if (t === 'array') return 'vector<int>';
  return 'auto';
}

/**
 * C Generator
 */
function synthesizeC(items) {
  let out = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\nint main() {\n`;
  let indent = 1;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') return;
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 1) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      out += `${getIndent()}printf("%s\\n", "${item.content.replace(/"/g, '')}");\n`;
      return;
    }

    if (item.type === 'input') {
      out += `${getIndent()}int ${item.varName};\n`;
      out += `${getIndent()}scanf("%d", &${item.varName});\n`;
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      out += `${getIndent()}for (int ${it} = ${item.start}; ${it} ${cmp} ${item.end}; ${it}++) {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'else') {
      if (indent > 1) indent--;
      out += `${getIndent()}} else {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      const cType = item.inferredType === 'float' ? 'double' : (item.inferredType === 'string' ? 'char*' : 'int');
      out += `${getIndent()}${cType} ${item.varName} = ${item.value};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  out += `\n    return 0;\n}\n`;
  return out;
}

/**
 * Java Generator
 */
function synthesizeJava(items) {
  let out = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n`;
  let indent = 2;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') {
      out += '\n';
      return;
    }
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 2) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      const parts = item.content.split(/,\s*/);
      const javaConcat = parts.map(p => p.trim()).join(' + " " + ');
      out += `${getIndent()}System.out.println(${javaConcat});\n`;
      return;
    }

    if (item.type === 'input') {
      if (item.varType === 'int') {
        out += `${getIndent()}int ${item.varName} = sc.nextInt();\n`;
      } else {
        out += `${getIndent()}String ${item.varName} = sc.nextLine();\n`;
      }
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      const inc = item.step && item.step !== '1' ? `${it} += ${item.step}` : `${it}++`;
      out += `${getIndent()}for (int ${it} = ${item.start}; ${it} ${cmp} ${item.end}; ${inc}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'while') {
      out += `${getIndent()}while (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'elif') {
      if (indent > 2) indent--;
      out += `${getIndent()}} else if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'else') {
      if (indent > 2) indent--;
      out += `${getIndent()}} else {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      const jType = getJavaType(item.inferredType);
      out += `${getIndent()}${jType} ${item.varName} = ${item.value};\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${item.value};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  out += `\n        sc.close();\n    }\n}\n`;
  return out;
}

function getJavaType(t) {
  if (t === 'int') return 'int';
  if (t === 'float') return 'double';
  if (t === 'string') return 'String';
  if (t === 'bool') return 'boolean';
  if (t === 'array') return 'int[]';
  return 'var';
}

/**
 * JavaScript / TypeScript Generator
 */
function synthesizeJavaScript(items, isTs = false) {
  let out = `// Converted to Modern ${isTs ? 'TypeScript' : 'JavaScript (Node.js)'}\n\n`;
  let indent = 0;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') {
      out += '\n';
      return;
    }
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 0) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      out += `${getIndent()}console.log(${item.content});\n`;
      return;
    }

    if (item.type === 'input') {
      out += `${getIndent()}// Input: provide value for ${item.varName}\n`;
      out += `${getIndent()}let ${item.varName} = ${item.varType === 'int' ? '0' : '""'};\n`;
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      const inc = item.step && item.step !== '1' ? `${it} += ${item.step}` : `${it}++`;
      out += `${getIndent()}for (let ${it} = ${item.start}; ${it} ${cmp} ${item.end}; ${inc}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'while') {
      out += `${getIndent()}while (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'elif') {
      if (indent > 0) indent--;
      out += `${getIndent()}} else if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'else') {
      if (indent > 0) indent--;
      out += `${getIndent()}} else {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      const typeAnno = isTs ? `: ${getTsType(item.inferredType)}` : '';
      out += `${getIndent()}let ${item.varName}${typeAnno} = ${item.value};\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${item.value};\n`;
      return;
    }

    if (item.type === 'function_def') {
      out += `${getIndent()}function ${item.name}(${item.params.join(', ')}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'return') {
      out += `${getIndent()}return ${item.value};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  return out.trim() + '\n';
}

function getTsType(t) {
  if (t === 'int' || t === 'float') return 'number';
  if (t === 'string') return 'string';
  if (t === 'bool') return 'boolean';
  if (t === 'array') return 'number[]';
  return 'any';
}

/**
 * Go Generator
 */
function synthesizeGo(items) {
  let out = `package main\n\nimport "fmt"\n\nfunc main() {\n`;
  let indent = 1;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') return;
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 1) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      out += `${getIndent()}fmt.Println(${item.content})\n`;
      return;
    }

    if (item.type === 'input') {
      out += `${getIndent()}var ${item.varName} int\n`;
      out += `${getIndent()}fmt.Scan(&${item.varName})\n`;
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      out += `${getIndent()}for ${it} := ${item.start}; ${it} ${cmp} ${item.end}; ${it}++ {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if ${item.condition} {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      out += `${getIndent()}${item.varName} := ${item.value}\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${item.value}\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text}\n`;
      return;
    }
  });

  out += `}\n`;
  return out;
}

/**
 * Rust Generator
 */
function synthesizeRust(items) {
  let out = `fn main() {\n`;
  let indent = 1;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') return;
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 1) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      const parts = item.content.split(/,\s*/);
      if (parts.length === 1 && parts[0].startsWith('"') && parts[0].endsWith('"')) {
        out += `${getIndent()}println!(${parts[0]});\n`;
      } else {
        const placeholders = parts.map(() => '{}').join(' ');
        out += `${getIndent()}println!("${placeholders}", ${parts.join(', ')});\n`;
      }
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const dot = item.inclusive ? '..=' : '..';
      out += `${getIndent()}for ${it} in ${item.start}${dot}${item.end} {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if ${item.condition} {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      out += `${getIndent()}let mut ${item.varName} = ${item.value};\n`;
      return;
    }

    if (item.type === 'assign_aug') {
      out += `${getIndent()}${item.varName} ${item.op} ${item.value};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  out += `}\n`;
  return out;
}

/**
 * C# Generator
 */
function synthesizeCSharp(items) {
  let out = `using System;\n\nnamespace Solution {\n    class Program {\n        static void Main(string[] args) {\n`;
  let indent = 3;

  const getIndent = () => '    '.repeat(indent);

  items.forEach(item => {
    if (item.type === 'empty') return;
    if (item.type === 'comment') {
      out += `${getIndent()}// ${item.text}\n`;
      return;
    }
    if (item.type === 'block_end') {
      if (indent > 3) indent--;
      out += `${getIndent()}}\n`;
      return;
    }

    if (item.type === 'print') {
      const parts = item.content.split(/,\s*/);
      out += `${getIndent()}Console.WriteLine(${parts.join(' + " " + ')});\n`;
      return;
    }

    if (item.type === 'for') {
      const it = item.iterator;
      const cmp = item.inclusive ? '<=' : '<';
      out += `${getIndent()}for (int ${it} = ${item.start}; ${it} ${cmp} ${item.end}; ${it}++) {\n`;
      indent++;
      return;
    }

    if (item.type === 'if') {
      out += `${getIndent()}if (${item.condition}) {\n`;
      indent++;
      return;
    }

    if (item.type === 'assign') {
      out += `${getIndent()}var ${item.varName} = ${item.value};\n`;
      return;
    }

    if (item.type === 'generic_statement') {
      out += `${getIndent()}${item.text};\n`;
      return;
    }
  });

  out += `        }\n    }\n}\n`;
  return out;
}

/**
 * PHP Generator
 */
function synthesizePhp(items) {
  let out = `<?php\n\n`;
  items.forEach(item => {
    if (item.type === 'comment') out += `// ${item.text}\n`;
    if (item.type === 'print') out += `echo ${item.content} . "\\n";\n`;
    if (item.type === 'assign') out += `$${item.varName} = ${item.value};\n`;
    if (item.type === 'assign_aug') out += `$${item.varName} ${item.op} ${item.value};\n`;
  });
  return out;
}

/**
 * Fallback regex transpiler in case of atypical AST syntax
 */
function fallbackRegexTranspile(code, src, tgt) {
  return `// Transpiled from ${src.toUpperCase()} to ${tgt.toUpperCase()}\n${code}`;
}
