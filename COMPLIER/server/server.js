import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { evaluateMatlabLocally } from '../src/services/clientMatlabRunner.js';
import { evaluateJdbcLocally } from '../src/services/clientJdbcRunner.js';
import { diagnoseAndHealError } from '../src/services/aiErrorHealer.js';
import { analyzeCodeWithAi } from '../src/services/aiCodeAnalyzer.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Detect Portable Standalone Compilers for 100% Offline Desktop Studio
const __filename = fileURLToPath(import.meta.url);
const serverDir = path.dirname(__filename);
const resourcesDir = process.env.RESOURCES_PATH;

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

// Ensure proper PATH on macOS so all native developer tools (clang, python3, node, javac) are found
if (isMac) {
  const standardMacPaths = [
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin'
  ];
  const curPaths = (process.env.PATH || '').split(path.delimiter);
  for (const p of standardMacPaths) {
    if (fs.existsSync(p) && !curPaths.includes(p)) {
      curPaths.unshift(p);
    }
  }
  process.env.PATH = curPaths.join(path.delimiter);
}

const binCandidates = [
  process.env.PORTABLE_BIN_DIR,
  resourcesDir ? path.join(resourcesDir, 'bin') : null,
  path.resolve(serverDir, '..', '..', 'bin'), // dist-desktop/win-unpacked/resources/bin
  path.resolve(serverDir, '..', 'bin'),       // COMPLIER/bin
  path.resolve(process.cwd(), 'bin'),
  'D:\\elite we kingdom website\\COMPLIER\\bin'
].filter(Boolean);

function findPortableBinary(relPaths) {
  for (const binDir of binCandidates) {
    if (!fs.existsSync(binDir)) continue;
    for (const rel of relPaths) {
      const full = path.join(binDir, rel);
      if (fs.existsSync(full)) {
        if (full.endsWith('.exe') && !isWin) continue;
        return full;
      }
    }
  }
  return null;
}

const PORTABLE_PYTHON = isWin ? findPortableBinary(['python/python.exe', 'python/python']) : null;
const PORTABLE_GPP = isWin ? findPortableBinary(['mingw64/bin/g++.exe', 'gcc/bin/g++.exe']) : null;
const PORTABLE_GCC = isWin ? findPortableBinary(['mingw64/bin/gcc.exe', 'gcc/bin/gcc.exe', 'tcc64/tcc/tcc.exe', 'tcc/tcc.exe']) : null;

// Ensure MinGW and Python paths are prepended to PATH on Windows so toolchains resolve internal tools
if (isWin && PORTABLE_GPP) {
  const mingwBin = path.dirname(PORTABLE_GPP);
  if (!process.env.PATH.includes(mingwBin)) {
    process.env.PATH = `${mingwBin}${path.delimiter}${process.env.PATH}`;
  }
}
if (isWin && PORTABLE_PYTHON) {
  const pyDir = path.dirname(PORTABLE_PYTHON);
  if (!process.env.PATH.includes(pyDir)) {
    process.env.PATH = `${pyDir}${path.delimiter}${process.env.PATH}`;
  }
}

console.log('⚡ [Elite IDE Offline Engine] Portable Compilers Detection:');
console.log('   - Platform:', process.platform, `(${process.arch})`);
console.log('   - Python 3:', PORTABLE_PYTHON ? `[Portable] ${PORTABLE_PYTHON}` : (isMac ? '[macOS Native python3]' : '[System Fallback]'));
console.log('   - G++ / Clang++ C++:', PORTABLE_GPP ? `[Portable] ${PORTABLE_GPP}` : (isMac ? '[macOS Native clang++]' : '[WSL/System Fallback]'));
console.log('   - GCC / Clang C:', PORTABLE_GCC ? `[Portable] ${PORTABLE_GCC}` : (isMac ? '[macOS Native clang]' : '[WSL/System Fallback]'));

function resolveLanguage(lang) {
  if (!lang) return 'python';
  const l = String(lang).toLowerCase().trim();
  if (l === 'py' || l.startsWith('python')) return 'python';
  if (l === 'cpp' || l === 'c++' || l.startsWith('cpp') || l.startsWith('c++')) return 'cpp';
  if (l === 'c' || l.startsWith('c-')) return 'c';
  if (l === 'js' || l.startsWith('node') || l.startsWith('javascript')) return 'javascript';
  if (l === 'ts' || l.startsWith('typescript')) return 'typescript';
  if (l === 'java' || l.startsWith('java')) return 'java';
  if (l === 'jdbc') return 'jdbc';
  if (l === 'm' || l === 'matlab' || l === 'octave') return 'matlab';
  if (l === 'html' || l === 'htm') return 'html';
  if (l === 'sh' || l === 'bash') return 'bash';
  return l;
}

// Supported languages configuration with real local compilers
const LANGUAGES = [
  { id: 'cpp', name: 'C++ (Clang++ / G++)', version: 'Native', runner: 'native-gpp', extension: 'cpp', monaco: 'cpp' },
  { id: 'c', name: 'C (Clang / GCC)', version: 'Native', runner: 'native-gcc', extension: 'c', monaco: 'c' },
  { id: 'python', name: 'Python 3', version: '3.12 / 3.9', runner: 'native-python', extension: 'py', monaco: 'python' },
  { id: 'java', name: 'Java (OpenJDK 17)', version: '17.0.10', runner: 'native-java', extension: 'java', monaco: 'java' },
  { id: 'jdbc', name: 'Java (JDBC Database)', version: 'JDK 17 + JDBC 4.3', runner: 'jdbc-runner', extension: 'java', monaco: 'java' },
  { id: 'javascript', name: 'JavaScript (Node.js)', version: '24.13', runner: 'native-node', extension: 'js', monaco: 'javascript' },
  { id: 'typescript', name: 'TypeScript (Node.js)', version: 'Native Strip-Types', runner: 'native-ts', extension: 'ts', monaco: 'typescript' },
  { id: 'bash', name: 'Bash / Shell', version: 'POSIX', runner: 'native-bash', extension: 'sh', monaco: 'shell' },
  { id: 'matlab', name: 'MATLAB (Matrix Laboratory)', version: 'R2024b / 5.1', runner: 'matlab-runner', extension: 'm', monaco: 'matlab' },
  { id: 'octave', name: 'GNU Octave / MATLAB (5.1)', version: '5.1.0', runner: 'matlab-runner', extension: 'm', monaco: 'matlab' },
  { id: 'html', name: 'HTML / CSS / JS', version: 'HTML5', runner: 'client-sandbox', extension: 'html', monaco: 'html' }
];

app.get('/api/languages', (req, res) => {
  res.json({ languages: LANGUAGES });
});

// Autonomous AI Code Intelligence Endpoints (Powered by Elite AI Engine)
app.post('/api/ai/diagnose', (req, res) => {
  try {
    const { code = '', language = 'python', stderr = '', stdout = '', lastStats = null } = req.body;
    const result = diagnoseAndHealError(code, language, stderr, stdout, lastStats);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/explain', (req, res) => {
  try {
    const { code = '', language = 'python' } = req.body;
    const result = analyzeCodeWithAi(code, language);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: convert Windows path (e.g. C:\Users\...) to WSL path (/mnt/c/Users/...)
function toWslPath(winPath) {
  return winPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
}

// Run local process with timeout, stdin, and optional cwd
function runCommand(cmd, args, stdinInput = '', timeoutMs = 45000, cwd = undefined) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    let child;
    try {
      child = spawn(cmd, args, { shell: false, cwd, env: process.env });
    } catch (err) {
      return resolve({
        stdout: '',
        stderr: `Failed to spawn ${cmd}: ${err.message}`,
        code: 1,
        executionTime: 0,
        status: 'ERROR'
      });
    }

    const timer = setTimeout(() => {
      killed = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {}
      resolve({
        stdout,
        stderr: (stderr ? stderr + '\n' : '') + `[PROCESS TIMEOUT]: Execution exceeded ${timeoutMs / 1000} seconds limit.`,
        code: 124,
        executionTime: timeoutMs,
        status: 'TIMEOUT'
      });
    }, timeoutMs);

    if (child.stdin) {
      try {
        if (stdinInput && stdinInput.trim()) {
          const dataToSend = stdinInput.endsWith('\n') ? stdinInput : stdinInput + '\n';
          child.stdin.write(dataToSend);
        }
        child.stdin.end();
      } catch (e) {}
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return;
      const executionTime = Date.now() - startTime;
      resolve({
        stdout,
        stderr,
        code: code ?? 0,
        executionTime,
        status: code === 0 ? 'SUCCESS' : 'ERROR'
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (killed) return;
      resolve({
        stdout,
        stderr: `Process launch error: ${err.message}`,
        code: 1,
        executionTime: Date.now() - startTime,
        status: 'ERROR'
      });
    });
  });
}

// HTTP POST execution route (kept as fallback)
app.post('/api/run', async (req, res) => {
  const { language, code, stdin = '' } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No code provided' });
  }

  const normLang = resolveLanguage(language);
  const langConfig = LANGUAGES.find(l => l.id === normLang) || LANGUAGES.find(l => l.id === language) || {
    id: normLang,
    runner: normLang === 'python' ? 'native-python' :
            normLang === 'cpp' ? 'native-gpp' :
            normLang === 'c' ? 'native-gcc' :
            normLang === 'javascript' ? 'native-node' :
            normLang === 'typescript' ? 'native-ts' :
            normLang === 'bash' ? 'native-bash' :
            normLang === 'java' ? 'native-java' :
            normLang === 'jdbc' ? 'jdbc-runner' :
            normLang === 'matlab' ? 'matlab-runner' :
            normLang === 'html' ? 'client-sandbox' : 'native-node'
  };

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide_compile_'));

  try {
    // 1. C++ (Portable MinGW-w64 G++ Native or macOS Clang++ / Linux G++)
    if (langConfig.runner === 'native-gpp' || normLang === 'cpp') {
      const srcFile = path.join(tempDir, 'main.cpp');
      fs.writeFileSync(srcFile, code, 'utf-8');

      if (isWin && PORTABLE_GPP) {
        const exeOut = path.join(tempDir, 'main.exe');
        const compileRes = await runCommand(PORTABLE_GPP, ['-O2', '-Wall', srcFile, '-o', exeOut], '', 45000, tempDir);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: 'GNU C++ (Portable MinGW-w64 G++)'
          });
        }

        const runRes = await runCommand(exeOut, [], stdin, 30000, tempDir);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: 'GNU C++ (MinGW-w64 Offline Native)'
        });
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        const outBin = path.join(tempDir, 'main.out');
        const compilerCmd = process.platform === 'darwin' ? 'clang++' : 'g++';
        const compileRes = await runCommand(compilerCmd, ['-O2', '-Wall', srcFile, '-o', outBin], '', 45000, tempDir);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: `${compilerCmd} (macOS Native)`
          });
        }

        try { fs.chmodSync(outBin, 0o755); } catch (e) {}

        const runRes = await runCommand(outBin, [], stdin, 30000, tempDir);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: `${compilerCmd} (macOS Native)`
        });
      } else {
        const wslSrc = toWslPath(srcFile);
        const wslOut = `${wslSrc}.out`;

        const compileRes = await runCommand('wsl', ['-e', 'g++', '-O2', '-Wall', wslSrc, '-o', wslOut], '', 45000);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: 'GNU C++ (G++ 13.3.0)'
          });
        }

        const runRes = await runCommand('wsl', ['-e', wslOut], stdin, 30000);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: 'GNU C++ (G++ 13.3.0 Native)'
        });
      }
    }

    // 2. C (Portable MinGW-w64 GCC / TCC Native or macOS Clang / Linux GCC)
    if (langConfig.runner === 'native-gcc' || normLang === 'c') {
      const srcFile = path.join(tempDir, 'main.c');
      fs.writeFileSync(srcFile, code, 'utf-8');

      if (isWin && PORTABLE_GCC) {
        const exeOut = path.join(tempDir, 'main.exe');
        const isTcc = PORTABLE_GCC.toLowerCase().includes('tcc');
        const compileArgs = isTcc ? [srcFile, '-o', exeOut] : ['-O2', '-Wall', srcFile, '-o', exeOut];
        const compileRes = await runCommand(PORTABLE_GCC, compileArgs, '', 45000, tempDir);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: isTcc ? 'Tiny C Compiler (Portable TCC 64)' : 'GNU C (MinGW-w64 GCC)'
          });
        }

        const runRes = await runCommand(exeOut, [], stdin, 30000, tempDir);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: isTcc ? 'Tiny C Compiler (Portable TCC 64 Native)' : 'GNU C (MinGW-w64 GCC Native)'
        });
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        const outBin = path.join(tempDir, 'main.out');
        const compilerCmd = process.platform === 'darwin' ? 'clang' : 'gcc';
        const compileRes = await runCommand(compilerCmd, ['-O2', '-Wall', srcFile, '-o', outBin], '', 45000, tempDir);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: `${compilerCmd} (macOS Native)`
          });
        }

        try { fs.chmodSync(outBin, 0o755); } catch (e) {}

        const runRes = await runCommand(outBin, [], stdin, 30000, tempDir);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: `${compilerCmd} (macOS Native)`
        });
      } else {
        const wslSrc = toWslPath(srcFile);
        const wslOut = `${wslSrc}.out`;

        const compileRes = await runCommand('wsl', ['-e', 'gcc', '-O2', '-Wall', wslSrc, '-o', wslOut], '', 45000);
        if (compileRes.code !== 0) {
          return res.json({
            stdout: '',
            stderr: compileRes.stderr || compileRes.stdout,
            code: compileRes.code,
            executionTime: compileRes.executionTime,
            status: 'COMPILE_ERROR',
            runner: 'GNU C (GCC 13.3.0)'
          });
        }

        const runRes = await runCommand('wsl', ['-e', wslOut], stdin, 30000);
        return res.json({
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          code: runRes.code,
          executionTime: compileRes.executionTime + runRes.executionTime,
          compileTime: compileRes.executionTime,
          status: runRes.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
          runner: 'GNU C (GCC 13.3.0 Native)'
        });
      }
    }

    // 3. Python 3 (Portable Embeddable Python or macOS/Linux Native Local)
    if (langConfig.runner === 'native-python' || normLang === 'python') {
      const scriptPath = path.join(tempDir, 'main.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const pyCmd = (isWin && PORTABLE_PYTHON) ? PORTABLE_PYTHON : (process.platform === 'darwin' ? 'python3' : (PORTABLE_PYTHON || 'python3' || 'python'));
      const result = await runCommand(pyCmd, ['-u', scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: (isWin && PORTABLE_PYTHON) ? 'Python 3.12 (Embedded Portable CPython)' : (process.platform === 'darwin' ? 'Python 3 (macOS Native)' : 'Python 3 (Native CPython)')
      });
    }

    // 4. JavaScript (Node.js Native Local)
    if (langConfig.runner === 'native-node' || normLang === 'javascript') {
      const scriptPath = path.join(tempDir, 'main.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const result = await runCommand('node', [scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: 'Node.js (V8 Engine Offline Native)'
      });
    }

    // 4.5 TypeScript (Node.js 22+ Native Local)
    if (langConfig.runner === 'native-ts' || normLang === 'typescript') {
      const scriptPath = path.join(tempDir, 'main.ts');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const result = await runCommand('node', [scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: 'TypeScript (Node.js Offline Native)'
      });
    }

    // 4.6 Bash / Shell Native Local
    if (langConfig.runner === 'native-bash' || normLang === 'bash') {
      const scriptPath = path.join(tempDir, 'script.sh');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      try { fs.chmodSync(scriptPath, 0o755); } catch (e) {}
      const result = await runCommand('/bin/bash', [scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: 'Bash Shell (Offline Native)'
      });
    }

    // 5. Java (OpenJDK Native)
    if (langConfig.runner === 'native-java' || normLang === 'java') {
      const classMatch = code.match(/(?:public\s+)?class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const javaCode = classMatch ? code : `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`;
      const javaFile = `${className}.java`;
      const javaPath = path.join(tempDir, javaFile);
      fs.writeFileSync(javaPath, javaCode, 'utf-8');

      const compileResult = await runCommand('javac', ['-nowarn', javaFile], '', 45000, tempDir);
      if (compileResult.code !== 0) {
        const errorText = compileResult.stderr || compileResult.stdout;
        const isMissingJre = errorText.includes('Unable to locate a Java Runtime') || errorText.includes('No Java runtime');
        return res.json({
          stdout: '',
          stderr: isMissingJre 
            ? `[Java Not Found on Mac]: macOS Java Runtime is not installed.\nTo run Java offline, please install OpenJDK: visit https://adoptium.net or run 'brew install openjdk@17'\n\n${errorText}`
            : errorText,
          code: compileResult.code,
          executionTime: compileResult.executionTime,
          status: 'COMPILE_ERROR',
          runner: 'Java Compiler (javac)'
        });
      }

      const runResult = await runCommand('java', ['-cp', '.', className], stdin, 30000, tempDir);
      return res.json({
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        code: runResult.code,
        executionTime: compileResult.executionTime + runResult.executionTime,
        compileTime: compileResult.executionTime,
        status: runResult.code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
        runner: 'OpenJDK HotSpot (Offline Native)'
      });
    }

    // 5.5 Java (JDBC Database Engine)
    if (langConfig.runner === 'jdbc-runner' || language === 'jdbc') {
      const jdbcRes = evaluateJdbcLocally(code, stdin);
      return res.json({
        ...jdbcRes,
        runner: 'Microsoft OpenJDK 17 + Elite JDBC In-Memory Engine'
      });
    }

    // 6. HTML / CSS / JS Sandbox
    if (langConfig.runner === 'client-sandbox') {
      return res.json({
        stdout: 'Ready for live client rendering in web preview.',
        stderr: '',
        code: 0,
        executionTime: 5,
        status: 'SUCCESS',
        runner: 'Browser DOM Sandbox'
      });
    }

    // 7. MATLAB / GNU Octave Runner
    if (langConfig.runner === 'matlab-runner') {
      const result = evaluateMatlabLocally(code, stdin);
      return res.json(result);
    }

  } catch (error) {
    return res.json({
      stdout: '',
      stderr: `[COMPILER RUNNER ERROR]: ${error.message}`,
      code: 1,
      executionTime: 0,
      status: 'ERROR',
      runner: 'Compiler Engine'
    });
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
});

// Setup HTTP server with attached WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/terminal' });

function setupChildHandlers(child, ws, cleanup, startTime, runnerName) {
  child.stdout.on('data', (data) => {
    try {
      ws.send(JSON.stringify({
        type: 'stdout',
        data: data.toString()
      }));
    } catch (e) {}
  });

  child.stderr.on('data', (data) => {
    try {
      ws.send(JSON.stringify({
        type: 'stderr',
        data: data.toString()
      }));
    } catch (e) {}
  });

  child.on('close', (code) => {
    const executionTime = Date.now() - startTime;
    try {
      ws.send(JSON.stringify({
        type: 'exit',
        code: code ?? 0,
        status: code === 0 ? 'SUCCESS' : 'RUNTIME_ERROR',
        executionTime,
        runner: runnerName
      }));
    } catch (e) {}
    cleanup();
  });

  child.on('error', (err) => {
    try {
      ws.send(JSON.stringify({
        type: 'stderr',
        data: `[Process error]: ${err.message}\n`
      }));
      ws.send(JSON.stringify({
        type: 'exit',
        code: 1,
        status: 'ERROR',
        executionTime: Date.now() - startTime,
        runner: runnerName
      }));
    } catch (e) {}
    cleanup();
  });
}

wss.on('connection', (ws) => {
  let child = null;
  let tempDir = null;
  let startTime = 0;

  const cleanup = () => {
    if (child) {
      try {
        if (!child.killed) child.kill('SIGKILL');
      } catch (e) {}
      child = null;
    }
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
      tempDir = null;
    }
  };

  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());

      // RUN PROGRAM
      if (msg.type === 'run') {
        cleanup();
        startTime = Date.now();
        const { language, code } = msg;
        const resolvedLang = resolveLanguage(language);

        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide_terminal_'));

        // 1. Python (Portable CPython or Native Local with -u for fully unbuffered interactive stdio)
        if (resolvedLang === 'python') {
          const scriptPath = path.join(tempDir, 'main.py');
          fs.writeFileSync(scriptPath, code, 'utf-8');
          const pyBin = (isWin && PORTABLE_PYTHON) ? PORTABLE_PYTHON : (process.platform === 'darwin' ? 'python3' : (PORTABLE_PYTHON || 'python3' || 'python'));
          const runnerName = (isWin && PORTABLE_PYTHON) ? 'Python 3.12 (Embedded Portable CPython)' : (process.platform === 'darwin' ? 'Python 3 (macOS Native)' : 'Python 3 (Native CPython)');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching ${runnerName} (Interactive Mode)\r\n`
          }));

          child = spawn(pyBin, ['-u', scriptPath], { cwd: tempDir, shell: false, env: process.env });
          setupChildHandlers(child, ws, cleanup, startTime, runnerName);
          return;
        }

        // 2. JavaScript (Node.js)
        if (resolvedLang === 'javascript') {
          const scriptPath = path.join(tempDir, 'main.js');
          fs.writeFileSync(scriptPath, code, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching Node.js (Interactive Mode)\r\n`
          }));

          child = spawn('node', [scriptPath], { cwd: tempDir, shell: false, env: process.env });
          setupChildHandlers(child, ws, cleanup, startTime, 'Node.js (V8 Engine Offline)');
          return;
        }

        // 2.5 TypeScript (Node.js 22+)
        if (resolvedLang === 'typescript') {
          const scriptPath = path.join(tempDir, 'main.ts');
          fs.writeFileSync(scriptPath, code, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching TypeScript with Node.js (Interactive Mode)\r\n`
          }));

          child = spawn('node', [scriptPath], { cwd: tempDir, shell: false, env: process.env });
          setupChildHandlers(child, ws, cleanup, startTime, 'TypeScript (Node.js Offline)');
          return;
        }

        // 3. MATLAB / GNU Octave
        if (resolvedLang === 'matlab' || resolvedLang === 'octave') {
          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching MATLAB / GNU Octave Virtual Engine...\r\n`
          }));
          const result = evaluateMatlabLocally(code, '');
          if (result.stdout) {
            ws.send(JSON.stringify({ type: 'stdout', data: result.stdout }));
          }
          if (result.stderr) {
            ws.send(JSON.stringify({ type: 'stderr', data: result.stderr }));
          }
          ws.send(JSON.stringify({
            type: 'exit',
            code: result.code,
            status: result.status,
            executionTime: result.executionTime,
            runner: result.runner
          }));
          cleanup();
          return;
        }

        // 4. C++ (Portable MinGW-w64 G++ or macOS Clang++ / Linux G++)
        if (resolvedLang === 'cpp') {
          const srcFile = path.join(tempDir, 'main.cpp');
          fs.writeFileSync(srcFile, code, 'utf-8');

          if (isWin && PORTABLE_GPP) {
            const exeOut = path.join(tempDir, 'main.exe');
            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C++ with Portable MinGW-w64 G++...\r\n`
            }));

            const compileRes = await runCommand(PORTABLE_GPP, ['-O2', '-Wall', srcFile, '-o', exeOut], '', 45000, tempDir);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: 'GNU C++ (Portable MinGW-w64 G++)'
              }));
              cleanup();
              return;
            }

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn(exeOut, [], { cwd: tempDir, shell: false, env: process.env });
            setupChildHandlers(child, ws, cleanup, startTime, 'GNU C++ (Portable MinGW-w64 Native)');
            return;
          } else if (process.platform === 'darwin' || process.platform === 'linux') {
            const outBin = path.join(tempDir, 'main.out');
            const compilerCmd = process.platform === 'darwin' ? 'clang++' : 'g++';
            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C++ with ${compilerCmd} (macOS Native)...\r\n`
            }));

            const compileRes = await runCommand(compilerCmd, ['-O2', '-Wall', srcFile, '-o', outBin], '', 45000, tempDir);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: `${compilerCmd} (macOS Native)`
              }));
              cleanup();
              return;
            }

            try { fs.chmodSync(outBin, 0o755); } catch (e) {}

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn(outBin, [], { cwd: tempDir, shell: false, env: process.env });
            setupChildHandlers(child, ws, cleanup, startTime, `${compilerCmd} (macOS Native)`);
            return;
          } else {
            const wslSrc = toWslPath(srcFile);
            const wslOut = `${wslSrc}.out`;

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C++ with GNU G++ 13.3.0...\r\n`
            }));

            const compileRes = await runCommand('wsl', ['-e', 'g++', '-O2', '-Wall', wslSrc, '-o', wslOut], '', 45000);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: 'GNU C++ (G++ 13.3.0)'
              }));
              cleanup();
              return;
            }

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn('wsl', ['-e', wslOut], { shell: false });
            setupChildHandlers(child, ws, cleanup, startTime, 'GNU C++ (G++ 13.3.0)');
            return;
          }
        }

        // 5. C (Portable MinGW-w64 GCC / TCC 64 or macOS Clang / Linux GCC)
        if (resolvedLang === 'c') {
          const srcFile = path.join(tempDir, 'main.c');
          fs.writeFileSync(srcFile, code, 'utf-8');

          if (isWin && PORTABLE_GCC) {
            const exeOut = path.join(tempDir, 'main.exe');
            const isTcc = PORTABLE_GCC.toLowerCase().includes('tcc');
            const compilerName = isTcc ? 'Tiny C Compiler (Portable TCC 64)' : 'GNU C (Portable MinGW-w64 GCC)';
            
            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C with ${compilerName}...\r\n`
            }));

            const compileArgs = isTcc ? [srcFile, '-o', exeOut] : ['-O2', '-Wall', srcFile, '-o', exeOut];
            const compileRes = await runCommand(PORTABLE_GCC, compileArgs, '', 45000, tempDir);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: compilerName
              }));
              cleanup();
              return;
            }

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn(exeOut, [], { cwd: tempDir, shell: false, env: process.env });
            setupChildHandlers(child, ws, cleanup, startTime, `${compilerName} Native`);
            return;
          } else if (process.platform === 'darwin' || process.platform === 'linux') {
            const outBin = path.join(tempDir, 'main.out');
            const compilerCmd = process.platform === 'darwin' ? 'clang' : 'gcc';
            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C with ${compilerCmd} (macOS Native)...\r\n`
            }));

            const compileRes = await runCommand(compilerCmd, ['-O2', '-Wall', srcFile, '-o', outBin], '', 45000, tempDir);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: `${compilerCmd} (macOS Native)`
              }));
              cleanup();
              return;
            }

            try { fs.chmodSync(outBin, 0o755); } catch (e) {}

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn(outBin, [], { cwd: tempDir, shell: false, env: process.env });
            setupChildHandlers(child, ws, cleanup, startTime, `${compilerCmd} (macOS Native)`);
            return;
          } else {
            const wslSrc = toWslPath(srcFile);
            const wslOut = `${wslSrc}.out`;

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compiling C with GNU GCC 13.3.0...\r\n`
            }));

            const compileRes = await runCommand('wsl', ['-e', 'gcc', '-O2', '-Wall', wslSrc, '-o', wslOut], '', 45000);
            if (compileRes.code !== 0) {
              ws.send(JSON.stringify({
                type: 'stderr',
                data: compileRes.stderr || compileRes.stdout
              }));
              ws.send(JSON.stringify({
                type: 'exit',
                code: compileRes.code,
                status: 'COMPILE_ERROR',
                executionTime: compileRes.executionTime,
                runner: 'GNU C (GCC 13.3.0)'
              }));
              cleanup();
              return;
            }

            ws.send(JSON.stringify({
              type: 'system',
              data: `[Elite IDE Terminal] Compilation successful! Running program...\r\n`
            }));

            child = spawn('wsl', ['-e', wslOut], { shell: false });
            setupChildHandlers(child, ws, cleanup, startTime, 'GNU C (GCC 13.3.0)');
            return;
          }
        }

        // 6. Java (OpenJDK Native)
        if (resolvedLang === 'java') {
          const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
          const className = classMatch ? classMatch[1] : 'Main';
          const javaCode = classMatch ? code : `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`;
          const javaFile = `${className}.java`;
          const javaPath = path.join(tempDir, javaFile);
          fs.writeFileSync(javaPath, javaCode, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Compiling Java (${className}) with javac...\r\n`
          }));

          const compileResult = await runCommand('javac', ['-nowarn', javaFile], '', 45000, tempDir);
          if (compileResult.code !== 0) {
            const errorText = compileResult.stderr || compileResult.stdout;
            const isMissingJre = errorText.includes('Unable to locate a Java Runtime') || errorText.includes('No Java runtime');
            ws.send(JSON.stringify({
              type: 'stderr',
              data: isMissingJre
                ? `[Java Not Found on Mac]: macOS Java Runtime is not installed.\nTo run Java offline, please install OpenJDK: visit https://adoptium.net or run 'brew install openjdk@17'\r\n`
                : errorText
            }));
            ws.send(JSON.stringify({
              type: 'exit',
              code: compileResult.code,
              status: 'COMPILE_ERROR',
              executionTime: compileResult.executionTime,
              runner: 'Java Compiler (javac)'
            }));
            cleanup();
            return;
          }

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Compilation successful! Launching JVM...\r\n`
          }));

          child = spawn('java', ['-cp', '.', className], { cwd: tempDir, shell: false, env: process.env });
          setupChildHandlers(child, ws, cleanup, startTime, 'OpenJDK HotSpot');
          return;
        }

        // 6. HTML
        if (language === 'html') {
          ws.send(JSON.stringify({
            type: 'stdout',
            data: 'HTML / CSS / JS ready in web preview tab.\r\n'
          }));
          ws.send(JSON.stringify({
            type: 'exit',
            code: 0,
            status: 'SUCCESS',
            executionTime: 5,
            runner: 'Browser DOM Sandbox'
          }));
          cleanup();
          return;
        }
      }

      // STDIN INPUT FROM USER
      if (msg.type === 'stdin') {
        if (child && child.stdin && !child.stdin.destroyed) {
          try {
            child.stdin.write(msg.data);
          } catch (err) {
            console.error('Failed to write to stdin:', err);
          }
        }
      }

      // TERMINATE PROCESS
      if (msg.type === 'kill') {
        if (child) {
          try {
            child.kill('SIGINT');
            setTimeout(() => {
              try { if (child && !child.killed) child.kill('SIGKILL'); } catch (e) {}
            }, 300);
          } catch (e) {}
        }
        ws.send(JSON.stringify({
          type: 'system',
          data: '\r\n[Process terminated by user]\r\n'
        }));
        ws.send(JSON.stringify({
          type: 'exit',
          code: 130,
          status: 'TERMINATED',
          executionTime: Date.now() - startTime,
          runner: 'Interactive Terminal'
        }));
        cleanup();
      }
    } catch (err) {
      console.error('WS Error:', err);
      try {
        ws.send(JSON.stringify({
          type: 'stderr',
          data: `[Terminal Error]: ${err.message}\r\n`
        }));
      } catch (e) {}
    }
  });

  ws.on('close', () => {
    cleanup();
  });
});

// Serve built compiler static files if present for standalone desktop and web production
const compilerDistCandidates = [
  resourcesDir ? path.join(resourcesDir, 'compiler') : null,
  path.resolve(serverDir, '..', '..', 'compiler'),
  path.resolve(serverDir, '..', 'compiler'),
  path.resolve(process.cwd(), 'compiler'),
  path.resolve(process.cwd(), '..', 'compiler'),
  'D:\\elite we kingdom website\\compiler'
].filter(Boolean);

const activeDist = compilerDistCandidates.find(d => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html')));

if (activeDist) {
  console.log(`[ELITE IDE] Serving production static UI from: ${activeDist}`);
  app.use('/compiler', express.static(activeDist));
  app.use(express.static(activeDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[ELITE IDE] Port ${PORT} already active. Reusing running server.`);
  } else {
    console.error('[ELITE IDE Server Error]:', err);
  }
});

try {
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[ELITE IDE COMPILER & TERMINAL SERVER] running on http://127.0.0.1:${PORT}`);
  });
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[ELITE IDE] Port ${PORT} already active. Reusing running server.`);
  } else {
    console.error('[ELITE IDE Server Error]:', err);
  }
}
