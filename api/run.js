export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      message: 'Elite IDE Cloud Execution Engine is operational',
      supportedLanguages: ['cpp', 'c', 'python', 'java', 'javascript', 'typescript', 'html']
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { language, code, stdin = '' } = req.body || {};

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        stdout: '',
        stderr: 'Please enter code in the editor before running.\n',
        code: 1,
        executionTime: 0,
        status: 'ERROR',
        runner: 'Validator'
      });
    }

    const lang = (language || 'python').toLowerCase();

    // 1. Client-side HTML / Web Sandbox
    if (lang === 'html') {
      return res.status(200).json({
        stdout: 'HTML/Web document rendered successfully in live preview canvas.',
        stderr: '',
        code: 0,
        executionTime: 4,
        status: 'SUCCESS',
        runner: 'Browser DOM Sandbox'
      });
    }

    // Language mapping for Judge0 CE
    const JUDGE0_MAP = {
      cpp: { id: 105, name: 'C++ (GCC 14.1.0)' },
      c: { id: 50, name: 'C (GCC 9.2.0)' },
      python: { id: 92, name: 'Python (CPython 3.11.2)' },
      py: { id: 92, name: 'Python (CPython 3.11.2)' },
      java: { id: 91, name: 'Java (OpenJDK 17.0.6)' },
      javascript: { id: 102, name: 'JavaScript (Node.js 22.08)' },
      js: { id: 102, name: 'JavaScript (Node.js 22.08)' },
      typescript: { id: 101, name: 'TypeScript (5.6.2)' },
      ts: { id: 101, name: 'TypeScript (5.6.2)' }
    };

    const targetLang = JUDGE0_MAP[lang] || JUDGE0_MAP['python'];

    // Auto-wrap Java code if missing public class declaration
    let source_code = code;
    if ((lang === 'java') && !code.includes('class ')) {
      source_code = `public class Main {\n    public static void main(String[] args) {\n${code}\n    }\n}`;
    }

    // Call Judge0 CE execution service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const judgeResponse = await fetch('https://ce.judge0.com/submissions?wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        language_id: targetLang.id,
        source_code: source_code,
        stdin: stdin || ''
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!judgeResponse.ok) {
      const errText = await judgeResponse.text();
      throw new Error(`Execution service responded with HTTP ${judgeResponse.status}: ${errText}`);
    }

    const data = await judgeResponse.json();

    const stdout = data.stdout || '';
    const compileOutput = data.compile_output || '';
    const stderr = data.stderr || '';
    const statusDesc = data.status?.description || '';
    const statusId = data.status?.id || 3;

    // Status 3 is Accepted (Success)
    // Status 6 is Compilation Error
    // Status 7-12 are Runtime Errors / Time Limit Exceeded
    const isSuccess = statusId === 3;
    const isCompileError = statusId === 6;

    let finalStderr = '';
    if (!isSuccess) {
      if (compileOutput) {
        finalStderr = compileOutput;
      } else if (stderr) {
        finalStderr = stderr;
      } else if (data.message) {
        finalStderr = data.message;
      } else {
        finalStderr = `[${statusDesc}]\n`;
      }
    }

    const executionTimeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 10;

    return res.status(200).json({
      stdout: stdout,
      stderr: finalStderr,
      code: isSuccess ? 0 : 1,
      executionTime: executionTimeMs,
      status: isSuccess ? 'SUCCESS' : (isCompileError ? 'COMPILE_ERROR' : 'RUNTIME_ERROR'),
      runner: `Elite Cloud Runner (${targetLang.name})`
    });

  } catch (err) {
    return res.status(500).json({
      stdout: '',
      stderr: `[EXECUTION SERVICE ERROR]: ${err.message || 'Execution failed'}\nPlease check code syntax or try again.`,
      code: 1,
      executionTime: 0,
      status: 'ERROR',
      runner: 'Cloud Fallback'
    });
  }
}
