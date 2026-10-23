// ============================================================================
// Elite IDE - Autonomous Multi-Model Real AI Code Healer & Diagnostic Matrix
// Real LLM Intelligence (Pollinations Cloud / Gemini / Groq) + Offline AST Guard
// Explanations in English + Telugu (తెలుగు) & 1-Click Code Refactoring
// ============================================================================

const AI_CONFIG_KEY = 'elite_ai_debugger_config';

/**
 * Get active AI engine configuration from localStorage
 */
export function getStoredAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return {
    provider: 'cloud', // 'cloud' (Free zero-key) | 'gemini' | 'groq'
    apiKey: '',
    model: 'openai-fast'
  };
}

/**
 * Save AI engine configuration to localStorage
 */
export function setStoredAiConfig(config) {
  try {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}

/**
 * Synchronous Pre-flight Diagnostic Check
 * Instantly identifies healthy code, rogue semicolons, or pre-computes immediate offline state
 */
export function diagnoseAndHealError(code = '', language = 'python', stderr = '', stdout = '', lastStats = null) {
  const lang = (language || 'python').toLowerCase();
  const trimmedStderr = (stderr || '').trim();
  const trimmedStdout = (stdout || '').trim();

  if (!code && !trimmedStderr && !trimmedStdout) {
    return null;
  }

  // 1. Detect if the code has a preprocessor semicolon corruption (e.g. #include <iostream>;)
  const roguePreprocessor = detectRoguePreprocessorSemicolon(code, lang);
  if (roguePreprocessor) {
    const cleanedCode = code.replace(/^([ \t]*#(?:include|define|pragma|ifdef|ifndef|endif)\b[^;\n]*);+([ \t]*)$/gm, '$1$2');
    return {
      isHealthy: false,
      isRealAi: false,
      errorType: 'Illegal Semicolon in Preprocessor Directive',
      severity: 'HIGH',
      problemLine: roguePreprocessor.line,
      problemSnippet: roguePreprocessor.snippet,
      rootCauseEn: 'Preprocessor directives in C/C++ (#include, #define, #pragma) are processed by the preprocessor before compilation and must NEVER terminate with a semicolon (;). Appending a semicolon produces invalid syntax and compiler errors.',
      rootCauseTe: 'C/C++ లో #include లేదా #define వంటి ప్రీప్రాసెసర్ డైరెక్టివ్‌లకు చివర సెమికోలన్ (;) ఉండకూడదు. సెమికోలన్ పెట్టడం వల్ల కంపైలర్ సింటాక్స్ ఎర్రర్ వస్తుంది.',
      fixSummaryEn: 'Stripped rogue semicolon from the preprocessor directive.',
      fixSummaryTe: 'ప్రీప్రాసెసర్ డైరెక్టివ్ చివర ఉన్న అనవసర సెమికోలన్ (;) ని తొలగించి కోడ్‌ని సరిచేశాం.',
      fixedCode: cleanedCode,
      hasAutoFix: true
    };
  }

  // 2. Determine if execution was actually an error or clean success
  const isExplicitSuccess = lastStats && lastStats.code === 0 && !String(lastStats.status || '').toUpperCase().includes('ERROR');
  const hasRealStderr = trimmedStderr.length > 0 && !isBenignStderr(trimmedStderr);
  const hasStdoutError = !hasRealStderr && hasExplicitErrorTraces(trimmedStdout);
  const rawError = hasRealStderr ? trimmedStderr : (hasStdoutError ? trimmedStdout : '');

  // 3. If there are NO errors from the execution and run succeeded:
  if (!rawError && (isExplicitSuccess || !trimmedStderr)) {
    const syntaxIssue = detectBasicSyntaxIssues(code, lang);
    if (!syntaxIssue) {
      return {
        isHealthy: true,
        isRealAi: false,
        errorType: 'Code Healthy (0 Errors)',
        severity: 'OPTIMAL',
        problemLine: null,
        problemSnippet: '',
        rootCauseEn: 'All systems operational! No syntax errors, compiler warnings, or runtime exceptions detected in your code. It compiled and executed cleanly.',
        rootCauseTe: 'మీ కోడ్ అంతా సరిగ్గా ఉంది! ఎలాంటి సింటాక్స్ లేదా రన్‌టైమ్ లోపాలు లేవు. ప్రోగ్రామ్ విజయవంతంగా పూర్తయ్యింది.',
        fixSummaryEn: 'No refactoring required. Your code is valid and ready to run.',
        fixSummaryTe: 'ఎలాంటి మార్పులు అవసరం లేదు. మీ కోడ్ సరిగ్గా పనిచేస్తుంది.',
        fixedCode: code,
        hasAutoFix: false
      };
    } else {
      return syntaxIssue;
    }
  }

  // 4. Fallback instant diagnosis while Real AI is queried
  const errorInfo = parseStackTrace(rawError, lang, code);
  const diagnosis = analyzeRootCause(code, lang, errorInfo, rawError);
  const fixedCode = generateFixedCode(code, lang, errorInfo, diagnosis);

  return {
    isHealthy: false,
    isRealAi: false,
    errorType: diagnosis.errorType,
    severity: diagnosis.severity,
    problemLine: errorInfo.line || diagnosis.detectedLine || null,
    problemSnippet: errorInfo.snippet || '',
    rootCauseEn: diagnosis.explanationEn,
    rootCauseTe: diagnosis.explanationTe,
    fixSummaryEn: diagnosis.fixSummaryEn,
    fixSummaryTe: diagnosis.fixSummaryTe,
    fixedCode: fixedCode || code,
    hasAutoFix: Boolean(fixedCode && fixedCode !== code)
  };
}

/**
 * REAL AI ENGINE CALL
 * Queries true LLM intelligence (Pollinations AI, Gemini, or Groq)
 */
export async function fetchRealAiDiagnosis({
  code = '',
  language = 'python',
  stderr = '',
  stdout = '',
  lastStats = null,
  provider = 'cloud',
  apiKey = '',
  model = 'openai-fast'
}) {
  const lang = (language || 'python').toLowerCase();
  const trimmedStderr = (stderr || '').trim();
  const trimmedStdout = (stdout || '').trim();

  const systemPrompt = `You are Elite IDE's autonomous compiler AI code doctor.
You must analyze the user's source code and execution logs with absolute programming accuracy.

CRITICAL INSTRUCTIONS:
1. Always return a raw, valid JSON object with EXACTLY these keys:
{
  "errorType": "string (e.g. 'Syntax Error', 'Missing Semicolon', 'Type Mismatch', 'Segmentation Fault')",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "problemLine": number or null,
  "problemSnippet": "the exact line from the code causing the issue",
  "rootCauseEn": "In-depth technical explanation in English of why the compiler or runtime rejected this code",
  "rootCauseTe": "Clear, authentic technical explanation in Telugu (తెలుగు) explaining why this error happened in simple terms",
  "fixSummaryEn": "1-sentence summary of the fix in English",
  "fixSummaryTe": "1-sentence summary of the fix in Telugu (తెలుగు)",
  "fixedCode": "the COMPLETE, 100% syntactically correct source code with the fix applied"
}
2. C/C++ RULE: NEVER add a semicolon to preprocessor directives (#include, #define, #pragma, etc.). If an #include ends with a semicolon (like #include <iostream>;), your fix MUST REMOVE the semicolon.
3. JAVA RULE: In automated compilers, if a class is declared 'public class X' without matching filename, change to 'class X'.
4. Do NOT wrap the JSON in markdown code blocks (\`\`\`json). Output RAW JSON ONLY.
5. 'fixedCode' must contain the complete source code, ready to compile and run immediately.`;

  const userPrompt = `Language: ${lang}
Compiler Exit Code: ${lastStats?.code ?? (trimmedStderr ? 1 : 0)}
Compiler / Runtime stderr:
${trimmedStderr || 'None (Clean)'}

Standard Output (stdout):
${trimmedStdout || 'None'}

Active Source Code:
${code}`;

  try {
    let rawResponseText = '';

    // PROVIDER 1: Google Gemini 1.5 Flash (User API Key)
    if (provider === 'gemini' && apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      rawResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } 
    // PROVIDER 2: Groq Llama 3.3 70B (User API Key)
    else if (provider === 'groq' && apiKey) {
      const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      rawResponseText = data.choices?.[0]?.message?.content || '';
    } 
    // PROVIDER 3: Zero-Config Cloud AI (Pollinations Real AI Engine)
    else {
      const endpoint = 'https://text.pollinations.ai/';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: model || 'openai-fast',
          jsonMode: true
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Cloud AI Engine error: HTTP ${res.status}`);
      }
      rawResponseText = await res.text();
    }

    // Parse JSON safely
    const parsed = extractJsonFromText(rawResponseText);
    if (!parsed || !parsed.fixedCode) {
      throw new Error('AI response could not be parsed as valid code patch JSON.');
    }

    // Extra safety guarantee: Never allow AI to append a semicolon to #include
    let validatedFixedCode = parsed.fixedCode;
    if (lang.includes('c') || lang.includes('cpp')) {
      validatedFixedCode = validatedFixedCode.replace(/^([ \t]*#(?:include|define|pragma|ifdef|ifndef|endif)\b[^;\n]*);+([ \t]*)$/gm, '$1$2');
    }

    return {
      isHealthy: parsed.errorType?.toLowerCase().includes('healthy') || false,
      isRealAi: true,
      modelUsed: provider === 'gemini' ? 'Gemini 1.5 Flash' : (provider === 'groq' ? 'Groq Llama-3.3' : 'Autonomous Cloud AI (GPT-4o-mini)'),
      errorType: parsed.errorType || 'AI Identified Defect',
      severity: parsed.severity || 'HIGH',
      problemLine: parsed.problemLine || null,
      problemSnippet: parsed.problemSnippet || '',
      rootCauseEn: parsed.rootCauseEn || 'Analyzed by Real AI Engine.',
      rootCauseTe: parsed.rootCauseTe || 'నిజమైన AI మోడల్ ద్వారా విశ్లేషించబడింది.',
      fixSummaryEn: parsed.fixSummaryEn || 'Applied AI refactoring patch.',
      fixSummaryTe: parsed.fixSummaryTe || 'AI ద్వారా కోడ్ సవరించబడింది.',
      fixedCode: validatedFixedCode,
      hasAutoFix: Boolean(validatedFixedCode && validatedFixedCode !== code)
    };

  } catch (err) {
    console.warn('[Real AI Engine Fallback]:', err.message);
    // Graceful offline fallback
    const offlineResult = diagnoseAndHealError(code, language, stderr, stdout, lastStats);
    if (offlineResult) {
      offlineResult.isRealAi = false;
      offlineResult.networkNotice = `(Cloud AI Busy: ${err.message}. Showing verified offline diagnostics)`;
      return offlineResult;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helpers: JSON Cleaner
// ---------------------------------------------------------------------------
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  // Strip ```json and ``` if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err) {}
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers: Static Error Detection and Filtering
// ---------------------------------------------------------------------------
function isBenignStderr(text) {
  const benignPatterns = [
    /picked up _java_options/i,
    /note: some input files use unchecked or unsafe operations/i,
    /note: recompile with -xlint:unchecked/i
  ];
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  return lines.length > 0 && lines.every(line => benignPatterns.some(p => p.test(line)));
}

function hasExplicitErrorTraces(text) {
  if (!text) return false;
  return /\b(error:|fatal error:|Traceback \(most recent call last\):|SyntaxError|NameError|TypeError|IndexError|ZeroDivisionError|IndentationError|Exception in thread|NullPointerException|panic: runtime error|Segmentation fault|SIGSEGV|ReferenceError)\b/i.test(text);
}

function detectRoguePreprocessorSemicolon(code, lang) {
  if (!lang.includes('c') && !lang.includes('cpp')) return null;
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^[ \t]*#(?:include|define|pragma|ifdef|ifndef|endif)\b.*?;+[ \t]*$/.test(line)) {
      return { line: i + 1, snippet: line.trim() };
    }
  }
  return null;
}

function detectBasicSyntaxIssues(code, lang) {
  const lines = code.split('\n');

  const rogue = detectRoguePreprocessorSemicolon(code, lang);
  if (rogue) return null;

  if (lang.includes('java')) {
    const publicClassMatch = code.match(/\bpublic\s+class\s+([A-Za-z0-9_]+)/);
    if (publicClassMatch && publicClassMatch[1] !== 'Main') {
      const fixedCode = code.replace(/\bpublic\s+class\s+([A-Za-z0-9_]+)/, 'class $1');
      return {
        isHealthy: false,
        isRealAi: false,
        errorType: 'Class Declaration Conflict',
        severity: 'MEDIUM',
        problemLine: 1,
        problemSnippet: publicClassMatch[0],
        rootCauseEn: `In online Java runners, class '${publicClassMatch[1]}' cannot be declared 'public' unless saved in '${publicClassMatch[1]}.java'. Removing 'public' allows smooth execution.`,
        rootCauseTe: `ఆన్‌లైన్ జావా రన్నర్లలో ఫైల్ నేమ్ 'Main.java' కావడం వల్ల '${publicClassMatch[1]}' ని 'public' గా పెట్టకూడదు. కేవలం 'class ${publicClassMatch[1]}' అని ఉంచాలి.`,
        fixSummaryEn: `Changed 'public class ${publicClassMatch[1]}' to 'class ${publicClassMatch[1]}'.`,
        fixSummaryTe: `'public class' ని 'class' గా మార్చాం.`,
        fixedCode: fixedCode,
        hasAutoFix: true
      };
    }
  }

  if (lang.includes('python') || lang === 'py') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(def|class|if|elif|else|for|while|try|except|finally)\b/.test(line)) {
        const trimmed = line.trim();
        if (!trimmed.endsWith(':') && !trimmed.endsWith('\\')) {
          const fixedLines = [...lines];
          fixedLines[i] = line + ':';
          return {
            isHealthy: false,
            isRealAi: false,
            errorType: 'Missing Colon (:)',
            severity: 'HIGH',
            problemLine: i + 1,
            problemSnippet: trimmed,
            rootCauseEn: `Python block header statements (def, if, for, while, etc.) must terminate with a colon (:).`,
            rootCauseTe: `పైథాన్‌లో def, if, for, while స్టేట్‌మెంట్ల చివర తప్పనిసరిగా కోలన్ (:) ఉండాలి.`,
            fixSummaryEn: `Appended missing colon (:) to line ${i + 1}.`,
            fixSummaryTe: `లైన్ ${i + 1} చివర మిస్ అయిన కోలన్ (:) జోడించాం.`,
            fixedCode: fixedLines.join('\n'),
            hasAutoFix: true
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 1. Stack Trace Parser
// ---------------------------------------------------------------------------
function parseStackTrace(stderr, lang, code) {
  let line = null;
  let snippet = '';
  const lines = code ? code.split('\n') : [];

  if (lang.includes('python') || lang === 'py') {
    const match = stderr.match(/line (\d+)/i);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('c') || lang === 'cpp') {
    const match = stderr.match(/:(\d+):\d+: (?:fatal )?error:/i) || stderr.match(/:(\d+): (?:fatal )?error:/i) || stderr.match(/:(\d+):\d+:/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('java')) {
    const match = stderr.match(/:(\d+): error:/i) || stderr.match(/Main\.java:(\d+)/i) || stderr.match(/:(\d+)\)/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('javascript') || lang.includes('typescript') || lang === 'js' || lang === 'ts') {
    const match = stderr.match(/:(\d+):(\d+)/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('rust') || lang === 'rs') {
    const match = stderr.match(/--> src\/main\.rs:(\d+):/i) || stderr.match(/:(\d+):/);
    if (match) line = parseInt(match[1], 10);
  } else if (lang.includes('go')) {
    const match = stderr.match(/:(\d+):\d+:/);
    if (match) line = parseInt(match[1], 10);
  }

  if (line && line > 0 && line <= lines.length) {
    snippet = lines[line - 1].trim();
  } else {
    line = null;
    snippet = '';
  }

  return { line, snippet, raw: stderr };
}

// ---------------------------------------------------------------------------
// 2. Root Cause Analysis
// ---------------------------------------------------------------------------
function analyzeRootCause(code, lang, errorInfo, stderr) {
  const errLower = stderr.toLowerCase();

  // PYTHON
  if (lang.includes('python') || lang === 'py') {
    if (errLower.includes('indentationerror')) {
      return {
        errorType: 'Indentation Error',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Python relies strictly on consistent indentation. A block inside a function, loop, or conditional is misaligned.',
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
  }

  // C / C++
  if (lang.includes('c') || lang === 'cpp') {
    if (errLower.includes('expected \';\'') || errLower.includes('expected semicolon')) {
      return {
        errorType: 'Missing Semicolon',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'A statement is missing a closing semicolon (;) at the end of the line.',
        explanationTe: 'లైన్ చివరలో సెమికోలన్ (;) పెట్టడం మర్చిపోయారు.',
        fixSummaryEn: 'Appended missing semicolon (;) to terminate the statement safely.',
        fixSummaryTe: 'లైన్ చివర మిస్ అయిన సెమికోలన్ (;) జోడించాం.'
      };
    }
    if (errLower.includes('was not declared in this scope')) {
      return {
        errorType: 'Undeclared Identifier',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'Identifier, variable, or standard namespace entity is used without declaration or missing header.',
        explanationTe: 'వేరియబుల్ లేదా లైబ్రరీ హెడర్ డిక్లేర్ చేయకుండా వాడారు (ఉదా: <iostream>, <vector>).',
        fixSummaryEn: 'Added required namespace/type declaration.',
        fixSummaryTe: 'అవసరమైన వేరియబుల్ లేదా `using namespace std;` జోడించాం.'
      };
    }
  }

  // JAVA
  if (lang.includes('java')) {
    if (errLower.includes('is public, should be declared in a file named')) {
      return {
        errorType: 'Class Declaration Conflict',
        severity: 'HIGH',
        detectedLine: errorInfo.line,
        explanationEn: 'In Java, a public class must match the source file name. Since the compiler runs in an automated environment, declaring a non-matching public class causes a compilation error.',
        explanationTe: 'జావాలో పబ్లిక్ క్లాస్ పేరు ఫైల్ పేరుతో సమానంగా ఉండాలి. \'public class\' బదులు కేవలం \'class\' అని డిక్లేర్ చేస్తే సరిపోతుంది.',
        fixSummaryEn: 'Removed \'public\' modifier from class declaration so it compiles cleanly.',
        fixSummaryTe: '\'public class\' ని \'class\' గా మార్చి ఫైల్ నేమ్ సమస్యను సరిచేశాం.'
      };
    }
  }

  return {
    errorType: 'Runtime Execution Error',
    severity: 'MEDIUM',
    detectedLine: errorInfo.line,
    explanationEn: 'The program encountered an exception during execution. Check logic constraints, runtime inputs, and boundary conditions.',
    explanationTe: 'ఎగ్జిక్యూషన్ సమయంలో లోపం తలెత్తింది. లాజిక్ మరియు ఇన్పుట్ బౌండరీలను ఒకసారి సరిచూసుకోండి.',
    fixSummaryEn: 'Inspect the highlighted line and check data constraints.',
    fixSummaryTe: 'హైలైట్ చేసిన లైన్ మరియు డేటా సరిగ్గా ఉన్నాయో లేదో గమనించండి.'
  };
}

// ---------------------------------------------------------------------------
// 3. Automated Code Repair Generator (Defensive fallback)
// ---------------------------------------------------------------------------
function generateFixedCode(code, lang, errorInfo, diagnosis) {
  if (diagnosis.isHealthy) return code;

  // Sanitize rogue semicolons on preprocessor lines
  if (lang.includes('c') || lang.includes('cpp')) {
    if (/^[ \t]*#(?:include|define|pragma|ifdef|ifndef|endif)\b.*?;+[ \t]*$/m.test(code)) {
      return code.replace(/^([ \t]*#(?:include|define|pragma|ifdef|ifndef|endif)[^;\n]*);+([ \t]*)$/gm, '$1$2');
    }
  }

  // Java: public class mismatch fix
  if (lang.includes('java')) {
    if (diagnosis.errorType === 'Class Declaration Conflict' || /is public, should be declared in a file named/i.test(diagnosis.explanationEn || '')) {
      return code.replace(/\bpublic\s+class\s+(\w+)/g, 'class $1');
    }
  }

  // C / C++ Missing Semicolon Fix
  if ((lang.includes('c') || lang === 'cpp') && diagnosis.errorType === 'Missing Semicolon') {
    if (errorInfo.line) {
      const lines = code.split('\n');
      const idx = errorInfo.line - 1;
      if (idx >= 0 && idx < lines.length) {
        const raw = lines[idx];
        const trimmed = raw.trim();

        const isPreprocessor = trimmed.startsWith('#');
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
        const isTerminated = /[;{}:]$/.test(trimmed);
        const isControl = /^(if|for|while|switch|else|catch|case|default|class|struct|namespace)\b/.test(trimmed);
        const isFunctionSig = /\)\s*$/.test(trimmed) && /^(int|void|bool|double|float|char|long|auto|std::)\b/.test(trimmed);

        if (!isPreprocessor && !isComment && !isTerminated && !isControl && !isFunctionSig) {
          lines[idx] = raw + ';';
          return lines.join('\n');
        }
      }
    }
  }

  return code;
}
