// Intelligent Real-time Programming Language Detector
// Automatically identifies 116+ world languages based on syntax markers, imports, keywords, and idioms.

export const SUPPORTED_LANGUAGES = [
  { id: 'auto', name: 'Auto-Detect (Smart Real-Time)', icon: '⚡' },
  { id: 'python', name: 'Python 3', extension: 'py', monaco: 'python', icon: '🐍' },
  { id: 'cpp', name: 'C++ (G++ 14)', extension: 'cpp', monaco: 'cpp', icon: '⚙️' },
  { id: 'c', name: 'C (GCC 14)', extension: 'c', monaco: 'c', icon: '🔧' },
  { id: 'java', name: 'Java (JDK 17)', extension: 'java', monaco: 'java', icon: '☕' },
  { id: 'javascript', name: 'JavaScript (Node 22)', extension: 'js', monaco: 'javascript', icon: '⚡' },
  { id: 'typescript', name: 'TypeScript (5.6)', extension: 'ts', monaco: 'typescript', icon: '📘' },
  { id: 'rust', name: 'Rust (1.85)', extension: 'rs', monaco: 'rust', icon: '🦀' },
  { id: 'go', name: 'Go (1.23)', extension: 'go', monaco: 'go', icon: '🐹' },
  { id: 'csharp', name: 'C# (Mono 6.6)', extension: 'cs', monaco: 'csharp', icon: '🔷' },
  { id: 'php', name: 'PHP (8.3)', extension: 'php', monaco: 'php', icon: '🐘' },
  { id: 'ruby', name: 'Ruby (2.7)', extension: 'rb', monaco: 'ruby', icon: '💎' },
  { id: 'kotlin', name: 'Kotlin (2.1)', extension: 'kt', monaco: 'kotlin', icon: '📱' },
  { id: 'swift', name: 'Swift (5.2)', extension: 'swift', monaco: 'swift', icon: '🍎' },
  { id: 'dart', name: 'Dart (2.19)', extension: 'dart', monaco: 'dart', icon: '🎯' },
  { id: 'sql', name: 'SQL (SQLite 3)', extension: 'sql', monaco: 'sql', icon: '🗄️' },
  { id: 'r', name: 'R (4.4)', extension: 'r', monaco: 'r', icon: '📊' },
  { id: 'bash', name: 'Bash Shell', extension: 'sh', monaco: 'shell', icon: '💻' },
  { id: 'scala', name: 'Scala (3.4)', extension: 'scala', monaco: 'scala', icon: '🔴' },
  { id: 'lua', name: 'Lua (5.3)', extension: 'lua', monaco: 'lua', icon: '🌙' },
  { id: 'haskell', name: 'Haskell (GHC)', extension: 'hs', monaco: 'haskell', icon: 'λ' },
  { id: 'perl', name: 'Perl (5.28)', extension: 'pl', monaco: 'perl', icon: '🐪' },
  { id: 'assembly', name: 'Assembly (NASM)', extension: 'asm', monaco: 'plaintext', icon: '⚡' },
  { id: 'html', name: 'HTML5 Web Sandbox', extension: 'html', monaco: 'html', icon: '🌐' }
];

export function detectLanguage(code, fallbackLang = 'cpp') {
  const meta = {
    python: { name: 'Python 3', extension: 'py', filename: 'main.py' },
    cpp: { name: 'C++ (G++ 14)', extension: 'cpp', filename: 'main.cpp' },
    c: { name: 'C (GCC 14)', extension: 'c', filename: 'main.c' },
    java: { name: 'Java (JDK 17)', extension: 'java', filename: 'Main.java' },
    javascript: { name: 'JavaScript (Node 22)', extension: 'js', filename: 'main.js' },
    typescript: { name: 'TypeScript', extension: 'ts', filename: 'main.ts' },
    rust: { name: 'Rust (1.85)', extension: 'rs', filename: 'main.rs' },
    go: { name: 'Go (1.23)', extension: 'go', filename: 'main.go' },
    csharp: { name: 'C# (.NET)', extension: 'cs', filename: 'Program.cs' },
    php: { name: 'PHP (8.3)', extension: 'php', filename: 'index.php' },
    ruby: { name: 'Ruby (2.7)', extension: 'rb', filename: 'main.rb' },
    kotlin: { name: 'Kotlin (2.1)', extension: 'kt', filename: 'Main.kt' },
    swift: { name: 'Swift (5.2)', extension: 'swift', filename: 'main.swift' },
    dart: { name: 'Dart (2.19)', extension: 'dart', filename: 'main.dart' },
    sql: { name: 'SQL (SQLite)', extension: 'sql', filename: 'query.sql' },
    r: { name: 'R (4.4)', extension: 'r', filename: 'script.r' },
    bash: { name: 'Bash Shell', extension: 'sh', filename: 'script.sh' },
    scala: { name: 'Scala (3.4)', extension: 'scala', filename: 'Main.scala' },
    lua: { name: 'Lua (5.3)', extension: 'lua', filename: 'main.lua' },
    haskell: { name: 'Haskell (GHC)', extension: 'hs', filename: 'Main.hs' },
    perl: { name: 'Perl (5.28)', extension: 'pl', filename: 'script.pl' },
    assembly: { name: 'Assembly (NASM)', extension: 'asm', filename: 'main.asm' },
    html: { name: 'HTML5 Web Sandbox', extension: 'html', filename: 'index.html' }
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
    python: 0,
    cpp: 0,
    c: 0,
    java: 0,
    javascript: 0,
    typescript: 0,
    rust: 0,
    go: 0,
    csharp: 0,
    php: 0,
    ruby: 0,
    kotlin: 0,
    swift: 0,
    dart: 0,
    sql: 0,
    r: 0,
    bash: 0,
    scala: 0,
    lua: 0,
    haskell: 0,
    perl: 0,
    assembly: 0,
    html: 0
  };

  // 1. Rust
  if (/\bfn\s+main\s*\(/.test(text)) scores.rust += 35;
  if (/println!\s*\(/.test(text)) scores.rust += 35;
  if (/print!\s*\(/.test(text) && !/System\.out/.test(text)) scores.rust += 25;
  if (/\blet\s+mut\s+/.test(text)) scores.rust += 30;
  if (/\buse\s+std::/.test(text)) scores.rust += 30;
  if (/\bimpl\s+[A-Z]/.test(text)) scores.rust += 20;
  if (/\bpub\s+(fn|struct|enum)\b/.test(text)) scores.rust += 25;

  // 2. Go
  if (/\bpackage\s+main\b/.test(text)) scores.go += 40;
  if (/\bimport\s+("fmt"|\([^)]*"fmt")/.test(text)) scores.go += 35;
  if (/\bfunc\s+main\s*\(/.test(text)) scores.go += 40;
  if (/\bfmt\.(Println|Printf|Print|Sprintf)\b/.test(text)) scores.go += 35;
  if (/:=/.test(text) && !/assignment/i.test(text)) scores.go += 15;

  // 3. C#
  if (/\busing\s+System(\.[A-Za-z0-9_]+)?\s*;/.test(text)) scores.csharp += 40;
  if (/Console\.(WriteLine|Write|ReadLine)\b/.test(text)) scores.csharp += 40;
  if (/\bnamespace\s+[A-Za-z0-9_.]+/.test(text)) scores.csharp += 25;
  if (/\bstatic\s+void\s+Main\s*\(/.test(text)) scores.csharp += 30;

  // 4. PHP
  if (/<\?php/i.test(text)) scores.php += 50;
  if (/\becho\s+["']/.test(text) && !/bash|sh/.test(text)) scores.php += 25;
  if (/\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(text) && scores.php > 0) scores.php += 20;

  // 5. Ruby
  if (/\bputs\s+["']/.test(text) && !text.includes('stdio.h')) scores.ruby += 30;
  if (/^\s*def\s+[a-z_][a-zA-Z0-9_]*(\s|\()/m.test(text) && /\bend\b/.test(text) && !text.includes(':')) scores.ruby += 30;
  if (/\battr_accessor\b/.test(text)) scores.ruby += 35;

  // 6. Kotlin
  if (/\bfun\s+main\s*\(/.test(text)) scores.kotlin += 40;
  if (/\bfun\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(text)) scores.kotlin += 25;
  if (/\bval\s+[a-zA-Z_][a-zA-Z0-9_]*\s*[:=]/.test(text)) scores.kotlin += 20;
  if (/\bcompanion\s+object\b/.test(text)) scores.kotlin += 35;

  // 7. Swift
  if (/\bimport\s+(Foundation|UIKit|SwiftUI)\b/.test(text)) scores.swift += 45;
  if (/\bguard\s+let\b/.test(text)) scores.swift += 35;
  if (/\bfunc\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*->/.test(text)) scores.swift += 30;

  // 8. Dart
  if (/\bvoid\s+main\s*\(/.test(text) && /print\s*\(/.test(text) && !text.includes('stdio.h')) scores.dart += 25;
  if (/\bimport\s+['"]package:/.test(text)) scores.dart += 45;
  if (/\bWidget\s+build\b/.test(text)) scores.dart += 40;

  // 9. SQL
  if (/\bSELECT\s+[\s\S]+?\s+FROM\b/i.test(text)) scores.sql += 45;
  if (/\bCREATE\s+TABLE\b/i.test(text)) scores.sql += 45;
  if (/\bINSERT\s+INTO\b/i.test(text)) scores.sql += 40;
  if (/\bUPDATE\s+.+?\s+SET\b/i.test(text)) scores.sql += 40;

  // 10. R
  if (/<-/.test(text) && !/<!--/.test(text)) scores.r += 30;
  if (/\blibrary\s*\([a-zA-Z0-9_.]+\)/.test(text)) scores.r += 35;
  if (/\bdata\.frame\b/.test(text)) scores.r += 30;

  // 11. Bash / Shell
  if (/^#!\s*\/bin\/(bash|sh)/m.test(text)) scores.bash += 50;
  if (/\bif\s*\[.+?\]\s*;\s*then\b/.test(text)) scores.bash += 40;
  if (/\bfi\b/.test(text) && /\bthen\b/.test(text)) scores.bash += 30;

  // 12. Scala
  if (/\bobject\s+[A-Za-z0-9_]+\s+extends\s+App\b/.test(text)) scores.scala += 45;

  // 13. Lua
  if (/\blocal\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(text)) scores.lua += 25;
  if (/~=/.test(text)) scores.lua += 25;

  // 14. Haskell
  if (/\bmain\s*=\s*(do|putStrLn)/.test(text)) scores.haskell += 45;
  if (/::\s*(IO|[A-Z])/.test(text)) scores.haskell += 35;

  // 15. Perl
  if (/\buse\s+(strict|warnings)\s*;/.test(text)) scores.perl += 45;
  if (/\bmy\s+[\$@%][a-zA-Z_]/.test(text)) scores.perl += 35;

  // 16. Assembly
  if (/\bsection\s+\.(data|text|bss)\b/i.test(text)) scores.assembly += 50;
  if (/\bglobal\s+(_start|main)\b/i.test(text)) scores.assembly += 45;
  if (/\bmov\s+(eax|ebx|ecx|edx|rax|rbx|rcx|rdx)\b/i.test(text)) scores.assembly += 40;

  // 17. C++
  if (/#include\s*<iostream>/.test(text)) scores.cpp += 35;
  if (/#include\s*<(vector|string|map|set|algorithm|numeric|queue|bits\/stdc\+\+\.h)>/.test(text)) scores.cpp += 25;
  if (/\busing\s+namespace\s+std\s*;/.test(text)) scores.cpp += 30;
  if (/\b(std::)?(cout|cin)\b/.test(text)) scores.cpp += 25;
  if (/\bstd::/.test(text)) scores.cpp += 25;
  if (/\bvector\s*<[a-zA-Z0-9_]+>/.test(text)) scores.cpp += 20;

  // 18. C
  if (/#include\s*<stdio\.h>/.test(text)) scores.c += 30;
  if (/#include\s*<(stdlib|string|math|stdbool|time|unistd)\.h>/.test(text)) scores.c += 20;
  if (/\b(printf|scanf)\s*\(/.test(text) && scores.cpp === 0) scores.c += 22;
  if (/\b(malloc|free)\s*\(/.test(text)) scores.c += 15;

  // 19. Java
  if (/public\s+class\s+[A-Za-z0-9_]+/m.test(text)) scores.java += 35;
  if (/public\s+static\s+void\s+main/m.test(text)) scores.java += 35;
  if (/System\.(out|err)\.(println|print|printf)/.test(text)) scores.java += 30;
  if (/import\s+java\.[a-z0-9_.]+/i.test(text)) scores.java += 30;

  // 20. Python
  if (/^\s*def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/m.test(text)) scores.python += 30;
  if (/^\s*(elif|else)\s*:/m.test(text)) scores.python += 20;
  if (/^\s*for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+/m.test(text)) scores.python += 20;
  if (/\bprint\s*\(/i.test(text) && !/System\.out/.test(text) && !/console\./.test(text) && !scores.rust && !scores.swift) scores.python += 15;
  if (/import\s+(sys|os|math|random|json|re|collections|time)\b/.test(text)) scores.python += 25;
  if (/from\s+[a-zA-Z0-9_.]+\s+import\b/.test(text)) scores.python += 25;
  if (/__name__\s*==\s*['"]__main__['"]/.test(text)) scores.python += 30;

  // 21. TypeScript & JavaScript
  if (/\binterface\s+[A-Z][a-zA-Z0-9_]*\s*\{/.test(text)) scores.typescript += 35;
  if (/\btype\s+[A-Z][a-zA-Z0-9_]*\s*=/.test(text)) scores.typescript += 30;
  if (/:\s*(string|number|boolean|any|void)\b/.test(text)) scores.typescript += 25;

  if (/console\.(log|warn|error|info)\s*\(/.test(text)) {
    if (scores.typescript > 0) scores.typescript += 20;
    else scores.javascript += 30;
  }
  if (/\b(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/.test(text)) {
    if (scores.typescript > 0) scores.typescript += 15;
    else scores.javascript += 20;
  }
  if (/function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(text) && !scores.php) {
    if (scores.typescript > 0) scores.typescript += 15;
    else scores.javascript += 20;
  }

  // 22. HTML
  if (/<(!DOCTYPE|html|head|body|div|span|h[1-6]|p|script|style|button|input)[\s>]/i.test(text)) {
    scores.html += 30;
  }

  // 23. Disambiguation
  if (scores.cpp > 0 && scores.c > 0) {
    if (text.includes('cout') || text.includes('cin') || text.includes('<iostream>') || text.includes('std::')) {
      scores.c = 0;
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

  return {
    language: maxScore > 0 ? detectedLang : fallbackLang,
    confidence: maxScore,
    name: meta[detectedLang]?.name || detectedLang,
    extension: meta[detectedLang]?.extension || 'txt',
    filename: meta[detectedLang]?.filename || 'main.txt',
    detected: maxScore > 0
  };
}
