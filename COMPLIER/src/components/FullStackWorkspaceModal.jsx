import React, { useState } from 'react';
import { 
  Layers, 
  FolderTree, 
  Code2, 
  FileCode2, 
  Sparkles, 
  X, 
  Check, 
  Globe, 
  Server, 
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const FULLSTACK_TEMPLATES = [
  {
    id: 'react-vite',
    name: 'React 19 + Vite Workspace',
    category: 'Frontend',
    icon: '⚛️',
    description: 'Modern component-driven frontend architecture with hot-module reloading and CSS styling.',
    files: [
      {
        id: 'f-react-1',
        name: 'src/App.jsx',
        language: 'javascript',
        code: `import React, { useState } from 'react';
import './index.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <header className="hero">
        <h1 className="title">⚛️ Elite React 19 Sandbox</h1>
        <p className="subtitle">Instant Hot-Reloading Component Architecture</p>
      </header>

      <div className="card">
        <button className="counter-btn" onClick={() => setCount(c => c + 1)}>
          Count is {count}
        </button>
        <p className="hint">Edit <code>src/App.jsx</code> to see hot updates instantly.</p>
      </div>
    </div>
  );
}`
      },
      {
        id: 'f-react-2',
        name: 'src/index.css',
        language: 'html',
        code: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.container { text-align: center; padding: 2rem; }
.title { font-size: 2.2rem; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.subtitle { color: #94a3b8; }
.card { background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 2rem; margin-top: 1.5rem; }
.counter-btn { background: #3b82f6; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.counter-btn:hover { background: #2563eb; transform: scale(1.05); }`
      },
      {
        id: 'f-react-3',
        name: 'package.json',
        language: 'javascript',
        code: `{
  "name": "elite-react-sandbox",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`
      }
    ]
  },
  {
    id: 'nextjs-app',
    name: 'Next.js 15 App Router',
    category: 'Full-Stack',
    icon: '🚀',
    description: 'Server Components, nested layouts, edge API routes, and optimized streaming.',
    files: [
      {
        id: 'f-next-1',
        name: 'app/page.jsx',
        language: 'javascript',
        code: `export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <h1 className="text-4xl font-bold tracking-tight text-center bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
          🚀 Next.js 15 App Router
        </h1>
        <p className="mt-4 text-center text-slate-400">
          Universal React Server Components running on Elite Cloud Sandbox.
        </p>
      </div>
    </main>
  );
}`
      },
      {
        id: 'f-next-2',
        name: 'app/api/users/route.js',
        language: 'javascript',
        code: `import { NextResponse } from 'next/server';

export async function GET(request) {
  const users = [
    { id: 1, name: 'Siddharth V.', role: 'Architect' },
    { id: 2, name: 'Ananya S.', role: 'Frontend Lead' }
  ];
  return NextResponse.json({ success: true, count: users.length, users });
}`
      },
      {
        id: 'f-next-3',
        name: 'package.json',
        language: 'javascript',
        code: `{
  "name": "elite-nextjs-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`
      }
    ]
  },
  {
    id: 'nodejs-express',
    name: 'Node.js Express REST API',
    category: 'Backend',
    icon: '🟢',
    description: 'Production Node microservice with routing, middleware, JSON parsing, and CORS.',
    files: [
      {
        id: 'f-node-1',
        name: 'server.js',
        language: 'javascript',
        code: `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory data store
let tasks = [
  { id: 1, title: 'Build S-Tier Elite IDE', completed: true },
  { id: 2, title: 'Deploy on Vercel Edge', completed: false }
];

app.get('/api/tasks', (req, res) => {
  res.json({ success: true, data: tasks });
});

app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const newTask = { id: tasks.length + 1, title, completed: false };
  tasks.push(newTask);
  res.status(201).json({ success: true, task: newTask });
});

app.listen(PORT, () => {
  console.log(\`🟢 Elite Express API listening on port \${PORT}\`);
});`
      },
      {
        id: 'f-node-2',
        name: 'package.json',
        language: 'javascript',
        code: `{
  "name": "elite-express-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  }
}`
      }
    ]
  },
  {
    id: 'python-flask',
    name: 'Python Flask / Django API',
    category: 'Backend',
    icon: '🐍',
    description: 'Lightweight WSGI Python microservice with routing, request validation, and templating.',
    files: [
      {
        id: 'f-py-1',
        name: 'app.py',
        language: 'python',
        code: `from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "Elite Python Flask Sandbox",
        "version": "3.12"
    })

@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json() or {}
    a = data.get("a", 0)
    b = data.get("b", 0)
    return jsonify({"result": a + b, "operation": "sum"})

if __name__ == "__main__":
    print("🐍 Flask application serving on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000)`
      },
      {
        id: 'f-py-2',
        name: 'requirements.txt',
        language: 'python',
        code: `Flask==3.0.3
Werkzeug==3.0.3`
      }
    ]
  },
  {
    id: 'flutter-web',
    name: 'Flutter Web / Dart Application',
    category: 'Mobile / Cross-Platform',
    icon: '💙',
    description: 'Declarative UI widget hierarchy targeting Web & Mobile viewports.',
    files: [
      {
        id: 'f-flutter-1',
        name: 'lib/main.dart',
        language: 'c', // Monaco c/cpp syntax highlight fallback for dart
        code: `import 'package:flutter/material.dart';

void main() {
  runApp(const EliteFlutterApp());
}

class EliteFlutterApp extends StatelessWidget {
  const EliteFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Elite Flutter Sandbox',
      theme: ThemeData.dark(),
      home: const Scaffold(
        body: Center(
          child: Text(
            '💙 Elite Flutter Cloud Sandbox',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}`
      },
      {
        id: 'f-flutter-2',
        name: 'pubspec.yaml',
        language: 'python',
        code: `name: elite_flutter_app
description: "Cross-platform flutter app"
environment:
  sdk: '>=3.0.0 <4.0.0'
dependencies:
  flutter:
    sdk: flutter`
      }
    ]
  }
];

export default function FullStackWorkspaceModal({
  isOpen,
  onClose,
  onApplyWorkspaceFiles
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(FULLSTACK_TEMPLATES[0]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedTemplate && onApplyWorkspaceFiles) {
      onApplyWorkspaceFiles(selectedTemplate.files);
    }
    onClose();
  };

  return (
    <div className="s-tier-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="s-tier-modal-container fullstack-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="s-tier-modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge fullstack-badge">
              <Layers size={22} className="text-sky-400" />
            </div>
            <div>
              <div className="modal-title-row">
                <h2>Full-Stack Cloud Sandboxes</h2>
                <span className="s-tier-pill fullstack-pill">Multi-File Architectures</span>
              </div>
              <p className="modal-subtitle">Switch your workspace to multi-file directory architectures for React, Next.js, Node.js, Django, or Flutter</p>
            </div>
          </div>
          <button className="s-tier-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="fullstack-modal-body">
          <div className="templates-sidebar">
            <div className="templates-sidebar-title">Architecture Presets</div>
            {FULLSTACK_TEMPLATES.map(tpl => (
              <div 
                key={tpl.id}
                className={`template-item ${selectedTemplate.id === tpl.id ? 'active-template' : ''}`}
                onClick={() => setSelectedTemplate(tpl)}
              >
                <span className="template-item-icon">{tpl.icon}</span>
                <div className="template-item-info">
                  <div className="template-item-name">{tpl.name}</div>
                  <div className="template-item-category">{tpl.category}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="template-details-view">
            <div className="template-header-card">
              <div className="tpl-head-top">
                <span className="tpl-big-icon">{selectedTemplate.icon}</span>
                <div>
                  <h3>{selectedTemplate.name}</h3>
                  <p>{selectedTemplate.description}</p>
                </div>
              </div>
              <button className="tpl-apply-btn" onClick={handleApply}>
                <Sparkles size={15} />
                <span>Initialize Multi-File Sandbox ({selectedTemplate.files.length} files)</span>
              </button>
            </div>

            <div className="template-file-tree">
              <h4>Directory Tree & Included Files</h4>
              <div className="file-tree-list">
                {selectedTemplate.files.map(f => (
                  <div key={f.id} className="tree-file-row">
                    <FileCode2 size={15} className="text-sky-400" />
                    <span className="tree-file-name">{f.name}</span>
                    <span className="tree-file-lang">{f.language}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
