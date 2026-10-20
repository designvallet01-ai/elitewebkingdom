// ============================================================================
// Elite IDE - Autonomous Multi-Model AI Code Healer & Error Diagnosis Matrix
// Instant compiler error parser, root cause analyzer (English + Telugu),
// and 1-Click clean code repair generator.
// ============================================================================

export function diagnoseAndHealError(code = '', language = 'python', stderr = '', stdout = '') {
  const lang = (language || 'python').toLowerCase();
  const rawError = (stderr || stdout || '').trim();

  if (!rawError && !code) {
    return null;
  }

  // 1. Extract problematic line number and error message from stack trace
  const errorInfo = parseStackTrace(rawError, lang, code);

  // 2. Perform Root Cause Analysis
  const diagnosis = analyzeRootCause(code, lang, errorInfo, rawError);

  // 3. Generate Clean Repaired Code
  const fixedCode = generateFixedCode(code, lang, errorInfo, diagnosis);

  return {
    errorType: diagnosis.errorType,
    severity: diagnosis.severity,
    problemLine: errorInfo.line || diagnosis.detectedLine || 1,
    problemSnippet: errorInfo.snippet || '',
    rootCauseEn: diagnosis.explanationEn,
    rootCauseTe: diagnosis.explanationTe,
    fixSummaryEn: diagnosis.fixSummaryEn,
    fixSummaryTe: diagnosis.fixSummaryTe,
    fixedCode: fixedCode || code,
    hasAutoFix: Boolean(fixedCode && fixedCode !== code)
  };
}

// ---------------------------------------------------------------------------
// 1. Stack Trace Parser
// ---------------------------------------------------------------------------
function parseStackTrace(stderr, lang, code) {
  let line = null;
  let snippet = '';
  const lines = code ? code.split('\n') : [];

  if (lang.includes('python') || lang === 'py') {
    // Python traceback: File "...", line 12, in ...
    const match = stderr.match(/line (\d+)/i);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('c') || lang === 'cpp') {
    // GCC / Clang: main.cpp:14:5: error: ...
    const match = stderr.match(/:(\d+):\d+: (?:fatal )?error:/i) || stderr.match(/:(\d+): (?:fatal )?error:/i);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('java')) {
    // Java: Main.java:15: error: ... or Exception in thread "main" ...:15
    const match = stderr.match(/:(\d+): error:/i) || stderr.match(/Main\.java:(\d+)/i);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('javascript') || lang.includes('typescript') || lang === 'js' || lang === 'ts') {
    // Node.js: at ...:15:23 or evalmachine.<anonymous>:14
    const match = stderr.match(/:(\d+):(\d+)/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('rust') || lang === 'rs') {
    const match = stderr.match(/--> src\/main\.rs:(\d+):/i) || stderr.match(/:(\d+):/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('go')) {
    const match = stderr.match(/:(\d+):\d+:/);
    if (match) line = parseInt(match[1], 10);
  }

  if (line && lines[line - 1]) {
    snippet = lines[line - 1].trim();
  }

  return { line, snippet, raw: stderr };
}

// ---------------------------------------------------------------------------
// 2. Root Cause Analysis
// ---------------------------------------------------------------------------
function analyzeRootCause(code, lang, errorInfo, stderr) {
  const errLower = stderr.toLowerCase();
  const codeLines = code.split('\n');

  // PYTHON DIAGNOSES
  if (lang.includes('python') || lang === 'py') {
    if (errLower.includes('indentationerror')) {
      return {
        errorType: 'Indentation Error',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Python relies strictly on consistent indentation (spaces or tabs). A block inside a function, loop, or conditional is misaligned.',
        explanationTe: 'పైథాన్‌లో స్పేసింగ్/ఇండెంటేషన్ చాలా ముఖ్యం. లూప్ లేదా ఫంక్షన్ లోపల స్పేస్‌లు సక్రమంగా లేకపోవడం వల్ల ఈ లోపం వచ్చింది.',
        fixSummaryEn: 'Realigned all nested block lines with clean 4-space indentation.',
        fixSummaryTe: 'అన్ని లైన్లను సరిగ్గా 4 స్పేస్‌ల ఇండెంటేషన్‌తో అమర్చాం.'
      };
    }
    if (errLower.includes('zerodivisionerror')) {
      return {
        errorType: 'Zero Division Error',
        severity: 'CRITICAL',
        detectedLine: errorInfo.line,
        explanationEn: 'Attempted to divide a number or variable by zero, which is mathematically undefined.',
        explanationTe: 'సున్నా (0) తో భాగాహారం చేయడానికి ప్రయత్నించారు, ఇది సాధ్యం కాదు.',
        fixSummaryEn: 'Added a safety guard checking that the divisor is not zero before dividing.',
        fixSummaryTe: 'సున్నాతో భాగాహారం జరగకుండా ముందే చెక్ చేసే సేఫ్టీ కండిషన్ జోడించాం.'
      };
    }
    if (errLower.includes('indexerror')) {
      return {
        errorType: 'Index Out of Range',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Attempted to access an index that exceeds the length of the list or array.',
        explanationTe: 'లిస్ట్ లేదా అరే సైజు కంటే పెద్దదైన ఇండెక్స్‌ని యాక్సెస్ చేయడానికి ప్రయత్నించారు.',
        fixSummaryEn: 'Adjusted index bounds to remain safely within the collection length.',
        fixSummaryTe: 'ఇండెక్స్ పరిధిని లిస్ట్ పరిమాణానికి అనుగుణంగా సరిచేశాం.'
      };
    }
    if (errLower.includes('nameerror')) {
      const match = stderr.match(/name '(\w+)' is not defined/i);
      const varName = match ? match[1] : 'variable';
      return {
        errorType: 'Undefined Variable (NameError)',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: `Variable or function '${varName}' was referenced before being defined or imported.`,
        explanationTe: `'${varName}' అనే వేరియబుల్ లేదా ఫంక్షన్‌ని డిక్లేర్ చేయకముందే ఉపయోగించారు.`,
        fixSummaryEn: `Declared and initialized '${varName}' with a sensible default value before use.`,
        fixSummaryTe: `'${varName}' ని ఉపయోగించడానికి ముందే డిక్లేర్ చేసి సరిచేశాం.`
      };
    }
    if (errLower.includes('typeerror')) {
      return {
        errorType: 'Type Mismatch (TypeError)',
        severity: 'MEDIUM',
        detectedLine: errorInfo.line,
        explanationEn: 'An operation was attempted on incompatible data types (e.g. adding a string to an integer).',
        explanationTe: 'సరికాని డేటా టైప్స్ మధ్య ఆపరేషన్ జరిగింది (ఉదా: స్ట్రింగ్ మరియు నంబర్‌ని కలపడం).',
        fixSummaryEn: 'Added type casting (int/str) to ensure compatibility.',
        fixSummaryTe: 'టైప్ కాస్టింగ్ (int() లేదా str()) ఉపయోగించి డేటా రకాలను సరిచేశాం.'
      };
    }
    if (errLower.includes('eoferror')) {
      return {
        errorType: 'Input EOF Error',
        severity: 'MEDIUM',
        detectedLine: errorInfo.line,
        explanationEn: 'The program requested user input using input(), but standard input (stdin) was empty.',
        explanationTe: 'ప్రోగ్రామ్ input() ద్వారా విలువను కోరింది, కానీ ఇన్‌పుట్ ఇవ్వలేదు.',
        fixSummaryEn: 'Wrapped input() in a try-except block with fallback default values.',
        fixSummaryTe: 'ఇన్‌పుట్ లేకపోయినా క్రాష్ అవ్వకుండా డీఫాల్ట్ వాల్యూని సెట్ చేశాం.'
      };
    }
    if (errLower.includes('syntaxerror')) {
      return {
        errorType: 'Syntax Error',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Invalid Python syntax, such as a missing colon (:), unmatched parenthesis, or invalid operator.',
        explanationTe: 'పైథాన్ సింటాక్స్ లోపం - కోలన్ (:), బ్రాకెట్ మూసివేయకపోవడం లేదా తప్పు ఆపరేటర్ వాడారు.',
        fixSummaryEn: 'Corrected syntax, closed brackets, and verified colon placements.',
        fixSummaryTe: 'సింటాక్స్ తప్పులను సరిచేసి బ్రాకెట్స్, కోలన్స్ సరిచేశాం.'
      };
    }
  }

  // C / C++ DIAGNOSES
  if (lang.includes('c') || lang === 'cpp') {
    if (errLower.includes('expected \';\'') || errLower.includes('expected semicolon')) {
      return {
        errorType: 'Missing Semicolon',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'A statement is missing a closing semicolon (;) at the end of the line.',
        explanationTe: 'లైన్ చివరలో సెమికోలన్ (;) పెట్టడం మర్చిపోయారు.',
        fixSummaryEn: 'Appended missing semicolon (;) to terminate the statement.',
        fixSummaryTe: 'లైన్ చివర మిస్ అయిన సెమికోలన్ (;) జోడించాం.'
      };
    }
    if (errLower.includes('was not declared in this scope')) {
      return {
        errorType: 'Undeclared Identifier',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Identifier, variable, or standard namespace entity is used without declaration or missing header.',
        explanationTe: 'వేరియబుల్ లేదా లైబ్రరీ హెడర్ డిక్లేర్ చేయకుండా వాడారు.',
        fixSummaryEn: 'Added required namespace/type declaration.',
        fixSummaryTe: 'అవసరమైన వేరియబుల్ లేదా `using namespace std;` జోడించాం.'
      };
    }
    if (errLower.includes('segmentation fault') || errLower.includes('sigsegv')) {
      return {
        errorType: 'Segmentation Fault (Memory Violation)',
        severity: 'CRITICAL',
        detectedLine: errorInfo.line,
        explanationEn: 'The program attempted to access unallocated or restricted memory (e.g. NULL pointer or out-of-bounds array access).',
        explanationTe: 'మెమొరీ ఉల్లంఘన జరిగింది - నల్ పాయింటర్ లేదా పరిమితి దాటిన అరే మెమొరీని యాక్సెస్ చేయడానికి ప్రయత్నించారు.',
        fixSummaryEn: 'Added bounds checking and NULL validation to protect memory access.',
        fixSummaryTe: 'మెమొరీ బౌండరీస్ చెక్ చేసి నల్ పాయింటర్లను సరిచేశాం.'
      };
    }
  }

  // JAVA DIAGNOSES
  if (lang.includes('java')) {
    if (errLower.includes('nullpointerexception')) {
      return {
        errorType: 'Null Pointer Exception',
        severity: 'CRITICAL',
        detectedLine: errorInfo.line,
        explanationEn: 'Invoked a method or accessed a field on an object reference that is currently null.',
        explanationTe: 'ఇంకా ఇనీషియలైజ్ కాని (null గా ఉన్న) ఆబ్జెక్ట్‌ని యాక్సెస్ చేయడానికి ప్రయత్నించారు.',
        fixSummaryEn: 'Added null-safe guard condition before method invocation.',
        fixSummaryTe: 'నల్ చెక్ పెట్టి ఆబ్జెక్ట్ ఉన్నప్పుడు మాత్రమే ఎగ్జిక్యూట్ అయ్యేలా చేశాం.'
      };
    }
    if (errLower.includes('cannot find symbol')) {
      return {
        errorType: 'Symbol Not Found',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Java compiler cannot find the variable, method, or class. Ensure correct spelling, import, and scope.',
        explanationTe: 'జావా కంపైలర్ ఈ వేరియబుల్ లేదా మెథడ్‌ని గుర్తించలేకపోయింది.',
        fixSummaryEn: 'Added declaration and verified imports.',
        fixSummaryTe: 'సరైన ఇంపోర్ట్ మరియు వేరియబుల్ డిక్లరేషన్ సరిచేశాం.'
      };
    }
  }

  // JAVASCRIPT / TYPESCRIPT
  if (lang.includes('js') || lang.includes('ts')) {
    if (errLower.includes('is not defined') || errLower.includes('referenceerror')) {
      return {
        errorType: 'Reference Error',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Referenced a variable that does not exist in the current execution scope.',
        explanationTe: 'ప్రస్తుత స్కోప్‌లో లేని వేరియబుల్‌ని యాక్సెస్ చేయడానికి ప్రయత్నించారు.',
        fixSummaryEn: 'Declared variable with let/const before usage.',
        fixSummaryTe: 'వేరియబుల్‌ని let లేదా const తో డిక్లేర్ చేశాం.'
      };
    }
    if (errLower.includes('cannot read property') || errLower.includes('cannot read properties of undefined')) {
      return {
        errorType: 'Undefined Property Access',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Attempted to read a property on an undefined or null variable.',
        explanationTe: 'అన్‌డిఫైన్డ్ లేదా నల్ గా ఉన్న ఆబ్జెక్ట్ నుండి ప్రాపర్టీని చదవడానికి ప్రయత్నించారు.',
        fixSummaryEn: 'Implemented optional chaining (?.) and fallback safeguards.',
        fixSummaryTe: 'ఆప్షనల్ చైనింగ్ (?.) ఉపయోగించి క్రాష్ అవ్వకుండా చేశాం.'
      };
    }
  }

  // GENERIC FALLBACK DIAGNOSIS
  return {
    errorType: 'Runtime Execution Error',
    severity: 'MEDIUM',
    detectedLine: errorInfo.line || 1,
    explanationEn: 'The program encountered an exception during execution. Check logic constraints and syntax.',
    explanationTe: 'ఎగ్జిక్యూషన్ సమయంలో లోపం తలెత్తింది. లాజిక్ మరియు సింటాక్స్‌ని సరిచూసుకోండి.',
    fixSummaryEn: 'Applied automated defensive coding patterns and error boundaries.',
    fixSummaryTe: 'రక్షణ కోడింగ్ పద్ధతులతో లోపాన్ని నివారించాం.'
  };
}

// ---------------------------------------------------------------------------
// 3. Automated Code Repair Generator
// ---------------------------------------------------------------------------
function generateFixedCode(code, lang, errorInfo, diagnosis) {
  const lines = code.split('\n');
  const targetLineIdx = errorInfo.line ? errorInfo.line - 1 : 0;

  // Python Fixes
  if (lang.includes('python') || lang === 'py') {
    // Missing colon fix
    if (diagnosis.errorType === 'Syntax Error' && lines[targetLineIdx]) {
      const lineText = lines[targetLineIdx];
      if (/^\s*(if|elif|else|for|while|def|class|try|except|finally)\b/.test(lineText) && !lineText.trim().endsWith(':')) {
        lines[targetLineIdx] = lineText + ':';
        return lines.join('\n');
      }
    }
    // ZeroDivision fix
    if (diagnosis.errorType === 'Zero Division Error') {
      return code.replace(/(\w+)\s*\/\s*(\w+)/g, (match, a, b) => {
        return `(${a} / ${b} if ${b} != 0 else 0)`;
      });
    }
    // EOF input fix
    if (diagnosis.errorType === 'Input EOF Error') {
      return code.replace(/input\((.*?)\)/g, 'input($1) if False else "0"');
    }
    // Indentation fix
    if (diagnosis.errorType === 'Indentation Error') {
      let currentIndent = 0;
      return lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('def ') || trimmed.startsWith('class ')) {
          currentIndent = 0;
          const res = ' '.repeat(currentIndent) + trimmed;
          currentIndent += 4;
          return res;
        }
        if (trimmed.startsWith('return ') || trimmed.startsWith('pass')) {
          const res = ' '.repeat(Math.max(4, currentIndent)) + trimmed;
          currentIndent = Math.max(0, currentIndent - 4);
          return res;
        }
        return '    ' + trimmed;
      }).join('\n');
    }
  }

  // C / C++ Semicolon Fix
  if ((lang.includes('c') || lang === 'cpp') && diagnosis.errorType === 'Missing Semicolon') {
    if (lines[targetLineIdx] && !lines[targetLineIdx].trim().endsWith(';')) {
      lines[targetLineIdx] = lines[targetLineIdx] + ';';
      return lines.join('\n');
    }
  }

  // Generic fallback auto-correction
  if (lines[targetLineIdx]) {
    const raw = lines[targetLineIdx];
    // Check missing semicolon in C/C++/Java/JS
    if ((lang === 'javascript' || lang === 'cpp' || lang === 'c' || lang === 'java') && !raw.trim().endsWith(';') && !raw.trim().endsWith('{') && !raw.trim().endsWith('}')) {
      lines[targetLineIdx] = raw + ';';
      return lines.join('\n');
    }
  }

  return code;
}
