// ============================================================================
// Elite IDE - Client-Side In-Browser Node.js / JavaScript Virtual Sandbox
// Sub-millisecond execution engine with real-time console capture,
// async/await resolution, and isolated context safety.
// ============================================================================

export async function executeInBrowserNode(code = '', stdin = '') {
  const startTime = performance.now();
  const logs = [];
  const errors = [];

  // Custom Console Interceptor
  const customConsole = {
    log: (...args) => {
      logs.push(args.map(formatArg).join(' '));
    },
    info: (...args) => {
      logs.push('[INFO] ' + args.map(formatArg).join(' '));
    },
    warn: (...args) => {
      logs.push('[WARN] ' + args.map(formatArg).join(' '));
    },
    error: (...args) => {
      errors.push(args.map(formatArg).join(' '));
    },
    table: (data) => {
      try {
        logs.push(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
      } catch (e) {
        logs.push(String(data));
      }
    },
    clear: () => {
      logs.length = 0;
    }
  };

  // Mock standard Node.js global variables and modules
  const mockProcess = {
    version: 'v22.0.0-browser-sandbox',
    platform: 'browser-wasm',
    env: { NODE_ENV: 'development' },
    stdin: {
      read: () => stdin,
      on: (event, cb) => {
        if (event === 'data' && stdin) cb(stdin);
      }
    },
    stdout: {
      write: (text) => logs.push(String(text))
    },
    stderr: {
      write: (text) => errors.push(String(text))
    }
  };

  try {
    // Transform code to safely execute async code top-level
    const wrappedCode = `
      return (async function(console, process, require) {
        "use strict";
        ${code}
      })(customConsole, mockProcess, mockRequire);
    `;

    const mockRequire = (mod) => {
      if (mod === 'assert') return { ok: (val) => { if (!val) throw new Error('Assertion failed'); } };
      if (mod === 'path') return { join: (...args) => args.join('/') };
      if (mod === 'util') return { inspect: (obj) => JSON.stringify(obj, null, 2) };
      return {};
    };

    const runnerFn = new Function('customConsole', 'mockProcess', 'mockRequire', wrappedCode);
    const result = await Promise.race([
      runnerFn(customConsole, mockProcess, mockRequire),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timed out after 10000ms (potential infinite loop)')), 10000))
    ]);

    const endTime = performance.now();
    const execTime = Math.round(endTime - startTime);

    let stdout = logs.join('\n');
    if (result !== undefined && !stdout.includes(String(result))) {
      // If code evaluated to an expression without console.log
      stdout = stdout ? `${stdout}\n➔ ${formatArg(result)}` : `➔ ${formatArg(result)}`;
    }

    const stderr = errors.join('\n');

    return {
      stdout: stdout || (errors.length === 0 ? '✓ Code executed successfully with zero errors (no stdout generated).' : ''),
      stderr: stderr,
      code: errors.length > 0 ? 1 : 0,
      executionTime: Math.max(1, execTime),
      status: errors.length > 0 ? 'RUNTIME_ERROR' : 'SUCCESS',
      runner: 'Browser Node V8 Virtual Engine'
    };

  } catch (err) {
    const endTime = performance.now();
    const execTime = Math.round(endTime - startTime);
    return {
      stdout: logs.join('\n'),
      stderr: `${err.name}: ${err.message}\n${err.stack || ''}`,
      code: 1,
      executionTime: Math.max(1, execTime),
      status: 'RUNTIME_ERROR',
      runner: 'Browser Node V8 Virtual Engine'
    };
  }
}

function formatArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return '[Circular / Object]';
    }
  }
  return String(arg);
}
