// Intelligent Real-time Programming Language Detector
// Automatically identifies language based on syntax markers, imports, and idioms.

export const SUPPORTED_LANGUAGES = [
  { id: 'auto', name: 'Auto-Detect (Smart Real-Time)', icon: '⚡' },
  { id: 'cpp', name: 'C++ (G++ 13.3)', extension: 'cpp', monaco: 'cpp', icon: '⚙️' },
  { id: 'c', name: 'C (GCC 13.3)', extension: 'c', monaco: 'c', icon: '🔧' },
  { id: 'python', name: 'Python 3', extension: 'py', monaco: 'python', icon: '🐍' },
  { id: 'java', name: 'Java (OpenJDK 17)', extension: 'java', monaco: 'java', icon: '☕' },
  { id: 'javascript', name: 'JavaScript (Node.js 24)', extension: 'js', monaco: 'javascript', icon: '⚡' },
  { id: 'html', name: 'HTML5 Web Sandbox', extension: 'html', monaco: 'html', icon: '🌐' }
];

export function detectLanguage(code, fallbackLang = 'cpp') {
  const meta = {
    cpp: { name: 'C++ (G++ 13.3)', extension: 'cpp', filename: 'main.cpp' },
    c: { name: 'C (GCC 13.3)', extension: 'c', filename: 'main.c' },
    python: { name: 'Python 3', extension: 'py', filename: 'main.py' },
    java: { name: 'Java (OpenJDK 17)', extension: 'java', filename: 'Main.java' },
    javascript: { name: 'JavaScript (Node.js 24)', extension: 'js', filename: 'main.js' },
    html: { name: 'HTML5 Sandbox', extension: 'html', filename: 'index.html' }
  };

  if (!code || !code.trim()) {
    const defLang = meta[fallbackLang] ? fallbackLang : 'cpp';
    return {
      language: defLang,
      confidence: 0,
      name: meta[defLang].name,
      extension: meta[defLang].extension,
      filename: meta[defLang].filename,
      detected: false
    };
  }

  const text = code;
  const scores = {
    cpp: 0,
    c: 0,
    python: 0,
    java: 0,
    javascript: 0,
    html: 0
  };

  // 1. Immediate keyword & syntax checks (triggered from the very first line/tokens)
  if (/#include\b/.test(text)) {
    scores.cpp += 15;
    scores.c += 12;
  }
  if (/#include\s*<iostream>/.test(text)) scores.cpp += 25;
  if (/#include\s*<(vector|string|map|set|algorithm|numeric|queue|bits\/stdc\+\+\.h)>/.test(text)) scores.cpp += 20;
  if (/\busing\s+namespace\s+std\s*;/.test(text)) scores.cpp += 25;
  if (/\b(cout|cin)\b/.test(text)) scores.cpp += 20;
  if (/\bstd::/.test(text)) scores.cpp += 20;
  if (/\btemplate\s*<.*>/.test(text)) scores.cpp += 15;
  if (/\bvector\s*<[a-zA-Z0-9_]+>/.test(text)) scores.cpp += 15;

  // 2. C specific checks
  if (/#include\s*<stdio\.h>/.test(text)) scores.c += 25;
  if (/#include\s*<(stdlib|string|math|stdbool|time|unistd)\.h>/.test(text)) scores.c += 18;
  if (/\b(printf|scanf)\s*\(/.test(text)) {
    if (scores.cpp === 0) scores.c += 18;
    else scores.c += 8;
  }
  if (/\b(malloc|free)\s*\(/.test(text)) scores.c += 12;

  // 3. Java specific checks
  if (/public\s+class\s+[A-Za-z0-9_]+/m.test(text)) scores.java += 30;
  if (/public\s+static\s+void\s+main/m.test(text)) scores.java += 30;
  if (/System\.(out|err)\.(println|print|printf)/.test(text)) scores.java += 25;
  if (/import\s+java\.[a-z0-9_.]+/i.test(text)) scores.java += 25;
  if (/\b(Scanner|ArrayList<|HashMap<|Integer|Boolean|String\[\])\b/.test(text)) scores.java += 12;
  if (/\b(implements|extends|@Override)\b/.test(text)) scores.java += 12;

  // 4. Python checks
  if (/^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/m.test(text)) scores.python += 25;
  if (/\bdef\s+[a-zA-Z_]/.test(text)) scores.python += 15;
  if (/^\s*(elif|else)\s*:/m.test(text)) scores.python += 15;
  if (/^\s*if\s+.*:\s*$/m.test(text)) scores.python += 12;
  if (/^\s*for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+/m.test(text)) scores.python += 18;
  if (/\bprint\s*\(/i.test(text) && !/System\.out/.test(text) && !/console\./.test(text)) scores.python += 12;
  if (/import\s+(sys|os|math|random|json|re|collections|time)\b/.test(text)) scores.python += 20;
  if (/from\s+[a-zA-Z0-9_.]+\s+import\b/.test(text)) scores.python += 20;
  if (/__name__\s*==\s*['"]__main__['"]/.test(text)) scores.python += 25;
  if (/\b(True|False|None|self|lambda)\b/.test(text)) scores.python += 8;
  if (/^\s*#[^i\n]/m.test(text)) scores.python += 4; // Python comments

  // 5. JavaScript checks
  if (/console\.(log|warn|error|info)\s*\(/.test(text)) scores.javascript += 25;
  if (/\b(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/.test(text)) scores.javascript += 15;
  if (/function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(text)) scores.javascript += 15;
  if (/=>\s*[{]/.test(text) || /=>\s*[a-zA-Z0-9_$]/.test(text)) scores.javascript += 15;
  if (/\b(require\s*\(|module\.exports|export\s+default|export\s+const)\b/.test(text)) scores.javascript += 20;
  if (/\b(JSON\.stringify|JSON\.parse|setTimeout|setInterval|Promise)\b/.test(text)) scores.javascript += 12;

  // 6. HTML checks
  if (/<(!DOCTYPE|html|head|body|div|span|h[1-6]|p|script|style|button|input)[\s>]/i.test(text)) {
    scores.html += 25;
  }
  if (/<\/([a-z]+)>/i.test(text)) {
    scores.html += 15;
  }

  // 7. General main function
  if (/(int|void)\s+main\s*\([^)]*\)/.test(text)) {
    if (scores.cpp >= scores.c) {
      scores.cpp += 6;
    } else {
      scores.c += 6;
    }
  }

  // Determine highest score
  let detectedLang = fallbackLang;
  let maxScore = 0;

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // Disambiguate C vs C++
  if (detectedLang === 'c' && (scores.cpp >= scores.c || text.includes('cout') || text.includes('std::') || text.includes('<iostream>'))) {
    detectedLang = 'cpp';
  }

  return {
    language: maxScore > 0 ? detectedLang : fallbackLang,
    confidence: maxScore,
    name: meta[detectedLang]?.name || detectedLang,
    extension: meta[detectedLang]?.extension || 'txt',
    filename: meta[detectedLang]?.filename || 'main.txt',
    detected: maxScore > 0
  };
}
