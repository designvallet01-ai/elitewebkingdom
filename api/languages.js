export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const LANGUAGES = [
    { id: 'python', name: 'Python 3', version: '3.11.2', extension: 'py', runner: 'Elite Cloud Python' },
    { id: 'cpp', name: 'C++ (G++ 14.1)', version: '14.1.0', extension: 'cpp', runner: 'Elite Cloud GCC' },
    { id: 'c', name: 'C (GCC 9.2)', version: '9.2.0', extension: 'c', runner: 'Elite Cloud GCC' },
    { id: 'java', name: 'Java (OpenJDK 17)', version: '17.0.6', extension: 'java', runner: 'Elite Cloud OpenJDK' },
    { id: 'javascript', name: 'JavaScript (Node.js 22)', version: '22.08', extension: 'js', runner: 'Elite Cloud V8' },
    { id: 'html', name: 'HTML / CSS / JS Sandbox', version: 'HTML5', extension: 'html', runner: 'Browser DOM Sandbox' }
  ];

  return res.status(200).json({ languages: LANGUAGES });
}
