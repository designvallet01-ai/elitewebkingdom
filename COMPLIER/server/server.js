import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import http from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { evaluateMatlabLocally } from '../src/services/clientMatlabRunner.js';
import { evaluateJdbcLocally } from '../src/services/clientJdbcRunner.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Supported languages configuration with real local compilers
const LANGUAGES = [
  { id: 'cpp', name: 'C++ (G++ 13.3)', version: '13.3.0', runner: 'native-gpp', extension: 'cpp', monaco: 'cpp' },
  { id: 'c', name: 'C (GCC 13.3)', version: '13.3.0', runner: 'native-gcc', extension: 'c', monaco: 'c' },
  { id: 'python', name: 'Python 3', version: '3.11', runner: 'native-python', extension: 'py', monaco: 'python' },
  { id: 'java', name: 'Java (OpenJDK 17)', version: '17.0.10', runner: 'native-java', extension: 'java', monaco: 'java' },
  { id: 'jdbc', name: 'Java (JDBC Database)', version: 'JDK 17 + JDBC 4.3', runner: 'jdbc-runner', extension: 'java', monaco: 'java' },
  { id: 'javascript', name: 'JavaScript (Node.js)', version: '24.13', runner: 'native-node', extension: 'js', monaco: 'javascript' },
  { id: 'matlab', name: 'MATLAB (Matrix Laboratory)', version: 'R2024b / 5.1', runner: 'matlab-runner', extension: 'm', monaco: 'matlab' },
  { id: 'octave', name: 'GNU Octave / MATLAB (5.1)', version: '5.1.0', runner: 'matlab-runner', extension: 'm', monaco: 'matlab' },
  { id: 'html', name: 'HTML / CSS / JS', version: 'HTML5', runner: 'client-sandbox', extension: 'html', monaco: 'html' }
];

app.get('/api/languages', (req, res) => {
  res.json({ languages: LANGUAGES });
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
      child = spawn(cmd, args, { shell: false, cwd });
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

  const langConfig = LANGUAGES.find(l => l.id === language);
  if (!langConfig) {
    return res.status(400).json({ error: `Language "${language}" not supported` });
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide_compile_'));

  try {
    // 1. C++ (G++ Native via WSL)
    if (langConfig.runner === 'native-gpp') {
      const srcFile = path.join(tempDir, 'main.cpp');
      fs.writeFileSync(srcFile, code, 'utf-8');
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

    // 2. C (GCC Native via WSL)
    if (langConfig.runner === 'native-gcc') {
      const srcFile = path.join(tempDir, 'main.c');
      fs.writeFileSync(srcFile, code, 'utf-8');
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

    // 3. Python 3.11 (Native Local)
    if (langConfig.runner === 'native-python') {
      const scriptPath = path.join(tempDir, 'main.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const result = await runCommand('python', ['-u', scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: 'Python 3.11 (Native CPython)'
      });
    }

    // 4. JavaScript (Node.js 24 Native Local)
    if (langConfig.runner === 'native-node') {
      const scriptPath = path.join(tempDir, 'main.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      const result = await runCommand('node', [scriptPath], stdin, 30000, tempDir);
      return res.json({
        ...result,
        runner: 'Node.js 24 (V8 Engine)'
      });
    }

    // 5. Java (Microsoft OpenJDK 17 Native)
    if (langConfig.runner === 'native-java') {
      const classMatch = code.match(/(?:public\s+)?class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const javaCode = classMatch ? code : `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`;
      const javaFile = `${className}.java`;
      const javaPath = path.join(tempDir, javaFile);
      fs.writeFileSync(javaPath, javaCode, 'utf-8');

      const compileResult = await runCommand('javac', ['-nowarn', javaFile], '', 45000, tempDir);
      if (compileResult.code !== 0) {
        return res.json({
          stdout: '',
          stderr: compileResult.stderr || compileResult.stdout,
          code: compileResult.code,
          executionTime: compileResult.executionTime,
          status: 'COMPILE_ERROR',
          runner: 'Microsoft OpenJDK 17'
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
        runner: 'Microsoft OpenJDK 17 HotSpot'
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

        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ide_terminal_'));

        // 1. Python (Native CPython with -u for fully unbuffered interactive stdio)
        if (language === 'python') {
          const scriptPath = path.join(tempDir, 'main.py');
          fs.writeFileSync(scriptPath, code, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching Python 3.11 (Interactive Mode)\r\n`
          }));

          child = spawn('python', ['-u', scriptPath], { cwd: tempDir, shell: false });
          setupChildHandlers(child, ws, cleanup, startTime, 'Python 3.11 (Native CPython)');
          return;
        }

        // 2. JavaScript (Node.js)
        if (language === 'javascript') {
          const scriptPath = path.join(tempDir, 'main.js');
          fs.writeFileSync(scriptPath, code, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Launching Node.js v24 (Interactive Mode)\r\n`
          }));

          child = spawn('node', [scriptPath], { cwd: tempDir, shell: false });
          setupChildHandlers(child, ws, cleanup, startTime, 'Node.js 24 (V8 Engine)');
          return;
        }

        // 3. MATLAB / GNU Octave
        if (language === 'matlab' || language === 'octave') {
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

        // 4. C++ (G++ 13.3 Native via WSL)
        if (language === 'cpp') {
          const srcFile = path.join(tempDir, 'main.cpp');
          fs.writeFileSync(srcFile, code, 'utf-8');
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

        // 4. C (GCC 13.3 Native via WSL)
        if (language === 'c') {
          const srcFile = path.join(tempDir, 'main.c');
          fs.writeFileSync(srcFile, code, 'utf-8');
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

        // 5. Java (Microsoft OpenJDK 17)
        if (language === 'java') {
          const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
          const className = classMatch ? classMatch[1] : 'Main';
          const javaCode = classMatch ? code : `public class Main {\n  public static void main(String[] args) {\n${code}\n  }\n}`;
          const javaFile = `${className}.java`;
          const javaPath = path.join(tempDir, javaFile);
          fs.writeFileSync(javaPath, javaCode, 'utf-8');

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Compiling Java (${className}) with OpenJDK 17...\r\n`
          }));

          const compileResult = await runCommand('javac', ['-nowarn', javaFile], '', 45000, tempDir);
          if (compileResult.code !== 0) {
            ws.send(JSON.stringify({
              type: 'stderr',
              data: compileResult.stderr || compileResult.stdout
            }));
            ws.send(JSON.stringify({
              type: 'exit',
              code: compileResult.code,
              status: 'COMPILE_ERROR',
              executionTime: compileResult.executionTime,
              runner: 'Microsoft OpenJDK 17'
            }));
            cleanup();
            return;
          }

          ws.send(JSON.stringify({
            type: 'system',
            data: `[Elite IDE Terminal] Compilation successful! Launching JVM...\r\n`
          }));

          child = spawn('java', ['-cp', '.', className], { cwd: tempDir, shell: false });
          setupChildHandlers(child, ws, cleanup, startTime, 'Microsoft OpenJDK 17');
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

server.listen(PORT, () => {
  console.log(`[ELITE IDE COMPILER & TERMINAL SERVER] running on http://localhost:${PORT}`);
});
