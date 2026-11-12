import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{r as t,t as n}from"./vendor-react-CPYPbbnH.js";import{E as r,It as i,ht as a,i as o}from"./vendor-icons-B_s5zbUZ.js";var s=e(t(),1),c=n(),l=[{id:`react-vite`,name:`React 19 + Vite Workspace`,category:`Frontend`,icon:`⚛️`,description:`Modern component-driven frontend architecture with hot-module reloading and CSS styling.`,files:[{id:`f-react-1`,name:`src/App.jsx`,language:`javascript`,code:`import React, { useState } from 'react';
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
}`},{id:`f-react-2`,name:`src/index.css`,language:`html`,code:`body {
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
.counter-btn:hover { background: #2563eb; transform: scale(1.05); }`},{id:`f-react-3`,name:`package.json`,language:`javascript`,code:`{
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
}`}]},{id:`nextjs-app`,name:`Next.js 15 App Router`,category:`Full-Stack`,icon:`🚀`,description:`Server Components, nested layouts, edge API routes, and optimized streaming.`,files:[{id:`f-next-1`,name:`app/page.jsx`,language:`javascript`,code:`export default function Page() {
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
}`},{id:`f-next-2`,name:`app/api/users/route.js`,language:`javascript`,code:`import { NextResponse } from 'next/server';

export async function GET(request) {
  const users = [
    { id: 1, name: 'Siddharth V.', role: 'Architect' },
    { id: 2, name: 'Ananya S.', role: 'Frontend Lead' }
  ];
  return NextResponse.json({ success: true, count: users.length, users });
}`},{id:`f-next-3`,name:`package.json`,language:`javascript`,code:`{
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
}`}]},{id:`nodejs-express`,name:`Node.js Express REST API`,category:`Backend`,icon:`🟢`,description:`Production Node microservice with routing, middleware, JSON parsing, and CORS.`,files:[{id:`f-node-1`,name:`server.js`,language:`javascript`,code:`const express = require('express');
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
});`},{id:`f-node-2`,name:`package.json`,language:`javascript`,code:`{
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
}`}]},{id:`python-flask`,name:`Python Flask / Django API`,category:`Backend`,icon:`🐍`,description:`Lightweight WSGI Python microservice with routing, request validation, and templating.`,files:[{id:`f-py-1`,name:`app.py`,language:`python`,code:`from flask import Flask, jsonify, request

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
    app.run(host="0.0.0.0", port=5000)`},{id:`f-py-2`,name:`requirements.txt`,language:`python`,code:`Flask==3.0.3
Werkzeug==3.0.3`}]},{id:`flutter-web`,name:`Flutter Web / Dart Application`,category:`Mobile / Cross-Platform`,icon:`💙`,description:`Declarative UI widget hierarchy targeting Web & Mobile viewports.`,files:[{id:`f-flutter-1`,name:`lib/main.dart`,language:`c`,code:`import 'package:flutter/material.dart';

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
}`},{id:`f-flutter-2`,name:`pubspec.yaml`,language:`python`,code:`name: elite_flutter_app
description: "Cross-platform flutter app"
environment:
  sdk: '>=3.0.0 <4.0.0'
dependencies:
  flutter:
    sdk: flutter`}]}];function u({isOpen:e,onClose:t,onApplyWorkspaceFiles:n}){let[u,d]=(0,s.useState)(l[0]);return e?(0,c.jsx)(`div`,{className:`s-tier-modal-overlay`,onClick:t,role:`dialog`,"aria-modal":`true`,children:(0,c.jsxs)(`div`,{className:`s-tier-modal-container fullstack-modal-container`,onClick:e=>e.stopPropagation(),children:[(0,c.jsxs)(`div`,{className:`s-tier-modal-header`,children:[(0,c.jsxs)(`div`,{className:`modal-header-left`,children:[(0,c.jsx)(`div`,{className:`modal-icon-badge fullstack-badge`,children:(0,c.jsx)(a,{size:22,className:`text-sky-400`})}),(0,c.jsxs)(`div`,{children:[(0,c.jsxs)(`div`,{className:`modal-title-row`,children:[(0,c.jsx)(`h2`,{children:`Full-Stack Cloud Sandboxes`}),(0,c.jsx)(`span`,{className:`s-tier-pill fullstack-pill`,children:`Multi-File Architectures`})]}),(0,c.jsx)(`p`,{className:`modal-subtitle`,children:`Switch your workspace to multi-file directory architectures for React, Next.js, Node.js, Django, or Flutter`})]})]}),(0,c.jsx)(`button`,{className:`s-tier-close-btn`,onClick:t,"aria-label":`Close`,children:(0,c.jsx)(o,{size:18})})]}),(0,c.jsxs)(`div`,{className:`fullstack-modal-body`,children:[(0,c.jsxs)(`div`,{className:`templates-sidebar`,children:[(0,c.jsx)(`div`,{className:`templates-sidebar-title`,children:`Architecture Presets`}),l.map(e=>(0,c.jsxs)(`div`,{className:`template-item ${u.id===e.id?`active-template`:``}`,onClick:()=>d(e),children:[(0,c.jsx)(`span`,{className:`template-item-icon`,children:e.icon}),(0,c.jsxs)(`div`,{className:`template-item-info`,children:[(0,c.jsx)(`div`,{className:`template-item-name`,children:e.name}),(0,c.jsx)(`div`,{className:`template-item-category`,children:e.category})]})]},e.id))]}),(0,c.jsxs)(`div`,{className:`template-details-view`,children:[(0,c.jsxs)(`div`,{className:`template-header-card`,children:[(0,c.jsxs)(`div`,{className:`tpl-head-top`,children:[(0,c.jsx)(`span`,{className:`tpl-big-icon`,children:u.icon}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`h3`,{children:u.name}),(0,c.jsx)(`p`,{children:u.description})]})]}),(0,c.jsxs)(`button`,{className:`tpl-apply-btn`,onClick:()=>{u&&n&&n(u.files),t()},children:[(0,c.jsx)(r,{size:15}),(0,c.jsxs)(`span`,{children:[`Initialize Multi-File Sandbox (`,u.files.length,` files)`]})]})]}),(0,c.jsxs)(`div`,{className:`template-file-tree`,children:[(0,c.jsx)(`h4`,{children:`Directory Tree & Included Files`}),(0,c.jsx)(`div`,{className:`file-tree-list`,children:u.files.map(e=>(0,c.jsxs)(`div`,{className:`tree-file-row`,children:[(0,c.jsx)(i,{size:15,className:`text-sky-400`}),(0,c.jsx)(`span`,{className:`tree-file-name`,children:e.name}),(0,c.jsx)(`span`,{className:`tree-file-lang`,children:e.language})]},e.id))})]})]})]})]})}):null}export{l as FULLSTACK_TEMPLATES,u as default};