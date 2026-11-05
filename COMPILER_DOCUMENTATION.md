# 🚀 Elite IDE — Complete System Architecture & Technical Documentation
> **Platform**: Elite IDE (Universal Cloud Compiler, Developer Studio & Academic Assessment Platform)  
> **Organization**: Elite Web Kingdom  
> **Version**: v2.6 Enterprise Pro  
> **Last Updated**: November 2026  
> **URL**: [https://www.elitewebkingdom.in/compiler/](https://www.elitewebkingdom.in/compiler/) | [Admin Portal](https://www.elitewebkingdom.in/compilercollegeadmin/)

---

## 📑 Table of Contents
1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
2. [High-Level Architecture & Tech Stack](#2-high-level-architecture--tech-stack)
3. [Repository & Directory Structure](#3-repository--directory-structure)
4. [Monaco Code Editor Core & Workspace](#4-monaco-code-editor-core--workspace)
5. [Execution Gateway & Compiler Engines (116+ Languages)](#5-execution-gateway--compiler-engines-116-languages)
6. [Client-Side In-Browser Execution Engines](#6-client-side-in-browser-execution-engines)
7. [Visual Computing & Algorithm Visualizers](#7-visual-computing--algorithm-visualizers)
8. [Competitive Programming (CP) Judge & Arena](#8-competitive-programming-cp-judge--arena)
9. [AI Developer Suite (Healer, Explainer, Debugger, Auditor)](#9-ai-developer-suite)
10. [Polyglot Transpiler Engine](#10-polyglot-transpiler-engine)
11. [College Mode, Kiosk Lockdown & Admin Portal](#11-college-mode-kiosk-lockdown--admin-portal)
12. [University Lab Practical Record (PDF) Generator](#12-university-lab-practical-record-pdf-generator)
13. [Cloud APIs & Serverless Endpoints](#13-cloud-apis--serverless-endpoints)
14. [Supabase Real-time Telemetry & Database Schemas](#14-supabase-real-time-telemetry--database-schemas)
15. [Keyboard Shortcuts Cheat Sheet](#15-keyboard-shortcuts-cheat-sheet)
16. [Deployment & Production Build Guide](#16-deployment--production-build-guide)

---

## 1. Executive Summary & System Overview

**Elite IDE** is an ultra-fast, zero-latency cloud-powered programming platform designed for students, competitive programmers, software engineers, and universities. Unlike conventional web compilers that only provide a basic code area and a black output box, Elite IDE combines:

- **116+ Compiler Environments** across 11 programming categories.
- **AST-Based ISO Flowchart Generator** synchronized bidirectionally with code lines.
- **3D Memory Matrix & Pointer Visualizer** for low-level memory tracing.
- **Recursion Call-Stack Visualizer** to demystify complex recursive branching.
- **Competitive Programming Multi-Testcase Judge** with visual diff engine.
- **AI-Powered Autonomous Code Healer** that diagnoses syntax/runtime bugs and offers 1-click repairs.
- **University College Mode & Exam Kiosk System** with anti-cheat screen lockdown, proctoring violation tracking, and faculty admin portal.
- **Automated University Lab Record PDF Generator** conforming to Indian university A4 lab practical record standards.

---

## 2. High-Level Architecture & Tech Stack

```mermaid
flowchart TD
    User([Developer / Student]) -->|Interacts| UI[Monaco Code Editor + Multi-Tab Workspace]
    UI -->|Language Auto-Detection| LangDetect[languageDetector.js]
    
    UI -->|Run Command Ctrl+Enter| ExecutionRouter{Execution Router}
    
    %% Client-side execution
    ExecutionRouter -->|HTML / CSS / JS| WebPreview[Live DOM Iframe Sandbox]
    ExecutionRouter -->|Node.js Local| NodeRunner[clientNodeRunner.js]
    ExecutionRouter -->|SQL / SQLite| JdbcRunner[clientJdbcRunner.js]
    ExecutionRouter -->|MATLAB / Octave| MatlabRunner[clientMatlabRunner.js]
    
    %% Serverless API execution
    ExecutionRouter -->|C++, Java, Python, Rust, Go, 116+ Langs| ApiRun[/api/run Serverless Gateway]
    
    ApiRun --> InMemCache[(5-Min In-Memory Cache)]
    InMemCache -.->|Cache Hit| ApiRun
    ApiRun -->|Primary Cluster| WandboxCluster[Wandbox Isolated Cluster]
    ApiRun -->|Fallback Cluster| Judge0Cluster[Judge0 CE / Piston Engines]
    
    %% Telemetry & Services
    ApiRun --> TelemetryService[compilerTelemetryService.js]
    TelemetryService --> Supabase[(Supabase Realtime PostgreSQL)]
    
    %% College / Proctored Mode
    UI -->|Kiosk Lockdown| CollegeEngine[collegeService.js]
    CollegeEngine <-->|Real-Time WebSockets| CollegeAdmin[Faculty Admin Portal]
    CollegeEngine --> IncidentLogs[(Supabase college_incident_logs)]
    
    %% Visualization & AI
    UI --> AST[astFlowchart.js -> SVG Flowchart]
    UI --> MemoryViz[MemoryArrayVisualizer]
    UI --> RecursionViz[RecursionVisualizer]
    UI --> AIHealer[aiErrorHealer & aiCodeAnalyzer]
```

### Core Technologies:
- **Frontend Core**: React 18, Vite, Monaco Editor (`@monaco-editor/react`), Lucide React Icons.
- **Styling Architecture**: Custom Cyberpunk & Glassmorphism styles (`sTierFeatures.css`, `App.css`), Tailwind utilities.
- **Backend Infrastructure**: Vercel Serverless Functions (`/api/run.js`, `/api/languages.js`).
- **Execution Grid**: Wandbox Universal Compilers Cluster + Judge0 CE / Piston Failover Grid.
- **Database & Realtime Layer**: Supabase PostgreSQL with Row Level Security (RLS) & WebSockets Realtime Broadcast.
- **Client Execution**: In-browser JavaScript Web Worker VM, `sql.js` (WebAssembly SQLite), Octave/MATLAB client evaluator.
- **Export Engines**: jsPDF & HTML2Canvas for university lab records, SVG/PNG rasterizer for flowcharts.

---

## 3. Repository & Directory Structure

```text
d:\elite we kingdom website\
├── api\                               # Vercel Serverless API Gateway
│   ├── run.js                         # Distributed compiler execution gateway (Wandbox + Judge0)
│   └── languages.js                   # 116+ languages metadata registry
├── compiler\                          # Production build output folder for IDE (/compiler)
│   ├── assets\                        # Minified JS/CSS bundle
│   ├── index.html                     # Production compiler entry point
│   └── manifest.json                  # PWA configuration
├── compilercollegeadmin\              # Production portal for University Lab Faculty (/compilercollegeadmin)
│   └── index.html                     # Faculty admin kiosk dashboard
├── COMPLIER\                          # Source code for React + Vite Compiler Studio
│   ├── public\                        # Static icons, manifest, service worker
│   ├── src\
│   │   ├── components\                # React UI Component Modules
│   │   │   ├── Navbar.jsx             # Top menubar, Run capsule, auto-detect badge
│   │   │   ├── EditorPanel.jsx        # Monaco Editor container & tab headers
│   │   │   ├── ConsolePanel.jsx       # Interactive standard input/output terminal
│   │   │   ├── GraphicalView.jsx      # AST Flowchart & Diagram renderer
│   │   │   ├── MemoryArrayVisualizer  # 3D Memory Matrix & pointer addresses
│   │   │   ├── RecursionVisualizer    # Recursive call-stack tree generator
│   │   │   ├── VisualGuiPlotViewer    # 2D/3D Data plotting and chart viewer
│   │   │   ├── CpTestCaseWorkbench    # CP Multi-testcase batch runner & diff
│   │   │   ├── AlgorithmModal.jsx     # 50+ DSA templates & Fast I/O snippets
│   │   │   ├── AiErrorFixModal.jsx    # AI Error diagnosis and auto-patching
│   │   │   ├── AiExplainerModal.jsx   # Line-by-line AI code walkthrough
│   │   │   ├── AiOneClickDebugger     # AI logic error breakpoint analyzer
│   │   │   ├── ComplexityVisualizer   # Big-O Time & Space complexity auditor
│   │   │   ├── CodeTranspilerModal    # Polyglot cross-language code translation
│   │   │   ├── LabReportModal.jsx     # University Lab Practical Record PDF builder
│   │   │   ├── CollegeModeModal.jsx   # Student Exam Kiosk Lockdown activation
│   │   │   ├── CollegeAdminPortal.jsx # Live faculty proctoring dashboard
│   │   │   ├── SpeedCodingArenaModal  # Timed competitive coding challenges
│   │   │   ├── GitControlModal.jsx    # In-editor Git version control
│   │   │   └── WebPreview.jsx         # Live HTML/CSS/JS sandbox iframe
│   │   ├── services\                  # Business Logic, APIs & Analyzers
│   │   │   ├── languagesRegistry.js   # 116 languages definition & starter code
│   │   │   ├── languageDetector.js    # Real-time regex-based syntax analyzer
│   │   │   ├── astFlowchart.js        # Parser generating ISO flowchart tree
│   │   │   ├── aiErrorHealer.js       # AI syntax & runtime error patching
│   │   │   ├── aiCodeAnalyzer.js      # Big-O auditor & refactoring suggester
│   │   │   ├── transpilerEngine.js    # Regex & AST polyglot translation engine
│   │   │   ├── collegeService.js      # Supabase Realtime kiosk sync & lock
│   │   │   ├── compilerTelemetryService.js # User execution history & live metrics
│   │   │   ├── clientJdbcRunner.js    # In-browser SQLite SQL execution
│   │   │   ├── clientMatlabRunner.js  # In-browser MATLAB matrix math solver
│   │   │   ├── clientNodeRunner.js    # In-browser sandboxed Node.js VM
│   │   │   └── soundEngine.js         # Cyberpunk typing and compilation audio FX
│   │   └── App.jsx                    # Root state coordinator
├── college_mode_supabase_schema.sql   # SQL for College Exam & Incident system
└── compiler_telemetry_supabase_schema.sql # SQL for executions, metrics, & presence
```

---

## 4. Monaco Code Editor Core & Workspace

### Multi-Tab File System
- **State Persistence**: Workspace files, active tab, and unsaved buffers are persisted in browser `localStorage` under `elite_ide_workspace_files_v2`.
- **Dynamic File Creation**: Supports arbitrary extensions (`.cpp`, `.py`, `.java`, `.rs`, `.go`, `.sql`, `.html`, etc.).
- **Unsaved Changes Indicator**: Tabs display an orange indicator badge whenever editor buffer differs from saved state.
- **File Explorer Sidebar (`Ctrl + B`)**: Provides file tree management, renaming, language badges, and deletion.

### Monaco Editor Configurations
- **Themes**: VS Code Dark (`vs-dark`), Light (`vs-light`), Cyberpunk Night, and High Contrast.
- **Language Features**:
  - Bracket Pair Colorization & Auto-Closing (`(` -> `)`, `{` -> `}`, `[` -> `]`).
  - Code Folding, Minimap toggle, and Line-by-line linting markers.
  - Document Formatter (`Shift + Alt + F`) utilizing built-in beautifiers.
  - Interactive In-Editor Search & Replace (`Ctrl + F`, `Ctrl + H`).
  - Voice Dictation (`🎙️ Voice` button) converting spoken instructions to syntax.

---

## 5. Execution Gateway & Compiler Engines (116+ Languages)

The platform supports **116 distinct language environments** distributed across 11 dedicated categories:

| Category | Environments Supported | Primary Engine |
| :--- | :--- | :--- |
| **🔥 Most Popular & Core** | Python 3.12, C++20 (GCC 14), C (GCC 14), Java 22, JavaScript (Node 22), TypeScript 5.6, Rust 1.82, Go 1.23, C# (.NET 8) | Wandbox Isolated Cluster |
| **⚙️ Systems & Low-Level** | Zig 0.13, Nim 2.0, D (DMD 2.109), NASM x86 Assembly, GNU Assembler, Fortran 14, Pascal (FPC 3.2), Ada 2021 | Wandbox / GCC Native |
| **🐍 Python & Data/AI** | Python 3.12 (with NumPy, Pandas, SymPy), PyPy 3.10, Python 2.7, MicroPython | CPython / Wandbox |
| **☕ JVM & Enterprise** | Java 17 LTS, Java 21 LTS, Kotlin 2.0, Scala 3.5, Groovy 4.0, Clojure 1.11 | OpenJDK HotSpot JVM |
| **🔷 .NET & Windows** | C# 12, F# 8.0, Visual Basic .NET 16 | .NET Core 8.0 SDK |
| **⚡ Web, Cloud & JS/TS** | Node.js 22, Deno 1.46, Bun 1.1, TypeScript 5.6, CoffeeScript, HTML/CSS/JS Sandbox | V8 Engine / In-browser Sandbox |
| **📱 Mobile & Native** | Swift 5.10, Dart 3.5, Kotlin Native | Apple Swift / Dart VM |
| **🐘 Scripting & Backend** | PHP 8.3, Ruby 3.3, Perl 5.40, Lua 5.4, R 4.4, Bash 5.2, Zsh | Native Interpreters |
| **📊 Data, Shell & DB** | SQLite 3, PostgreSQL dialect, MySQL dialect, Bash Shell, PowerShell Core | `clientJdbcRunner` (WebAssembly) |
| **λ Functional & Logic** | Haskell (GHC 9.10), Elixir 1.17, Erlang 27, OCaml 5.2, Common Lisp, Prolog (SWI), Scheme | GHC / BEAM VM |
| **🏛️ Classic & Scientific** | MATLAB / GNU Octave, COBOL 3.2, R 4.4, Julia 1.10, Forth, Smalltalk | `clientMatlabRunner` / GnuCOBOL |

### Gateway Flow (`/api/run.js`)
1. **In-Memory Cache (TTL: 5 Minutes)**: Fast SHA-256 hash lookup of `(language + code + stdin)`. Returns instantaneous response for identical executions.
2. **Primary Route (Wandbox Cluster)**: Dispatches isolated execution with strict CPU time limit (10s) and memory caps (256MB).
3. **Failover Route (Judge0 CE / Piston)**: If primary encounters timeout, rate limit, or node failure, failover executes seamlessly without user error.
4. **Interactive `stdin` Prompt Extractor**: Automatically parses code for `scanf`, `cin >>`, `readline()`, and `input()` to prompt users for input ahead of time.

---

## 6. Client-Side In-Browser Execution Engines

To guarantee instantaneous feedback without sending traffic to remote servers, Elite IDE provides embedded client-side sandboxes:

### 1. HTML / CSS / DOM Sandbox (`WebPreview.jsx`)
- Runs code inside an isolated `iframe` with `sandbox="allow-scripts allow-modals"`.
- Live auto-refresh as code is modified.
- Supports external CSS frameworks (Tailwind, Bootstrap) and JS libraries via CDN.

### 2. Embedded Node.js Runner (`clientNodeRunner.js`)
- Executes vanilla JavaScript and ES6 logic entirely within an in-browser Web Worker.
- Captures `console.log`, `console.error`, and `console.table` directly into the terminal console.

### 3. Client JDBC / SQLite Engine (`clientJdbcRunner.js`)
- Runs a complete relational SQLite database engine compiled to WebAssembly.
- Creates in-memory tables, executes `CREATE`, `INSERT`, `SELECT`, `UPDATE`, `JOIN` queries, and formats output into clean ASCII tables.

### 4. Client MATLAB / Octave Runner (`clientMatlabRunner.js`)
- Parses matrix arithmetic, linear equations, vector dot products, and basic trigonometric series on the client.

---

## 7. Visual Computing & Algorithm Visualizers

### 🌳 1. AST Flowchart Visualizer (`astFlowchart.js` + `GraphicalView.jsx`)
- Parses code structures (Conditionals `if-else`, Loops `for`, `while`, Functions, Returns) into an Abstract Syntax Tree (AST).
- Renders an interactive ISO-standard SVG Flowchart:
  - Start / End terminal nodes (ovals).
  - Decision diamonds for conditions.
  - Processing rectangles for expressions.
  - Directional connectors with `True` / `False` branches.
- **Bidirectional Sync**: Clicking any flowchart node highlights the exact code line in the Monaco editor.
- **Export**: One-click download as PNG or SVG image.

### 🧊 2. 3D Memory Matrix & Pointer Visualizer (`MemoryArrayVisualizer.jsx`)
- Scans memory allocations such as `int arr[5] = {10, 20, 30, 40, 50};`.
- Visualizes array elements as contiguous physical hardware memory cells.
- Displays hexadecimal memory addresses (e.g. `0x7ffeefbff560`, `0x7ffeefbff564`), cell indices, and current values.
- Real-time updates as code changes array indices.

### 🔄 3. Recursion Tree & Call Stack Visualizer (`RecursionVisualizer.jsx`)
- Visualizes recursive calls (Fibonacci, Factorial, Tower of Hanoi, Binary Search).
- Illustrates stack frames being **pushed** onto the runtime stack and **popped** upon return.
- Generates a hierarchical tree diagram showing branches, parameters, and return value propagation.

### 📊 4. Visual GUI Plot Viewer (`VisualGuiPlotViewer.jsx`)
- Renders 2D / 3D charts, scatter plots, sine waves, and data distributions directly inside the IDE.

---

## 8. Competitive Programming (CP) Judge & Arena

### CP Multi-TestCase Workbench (`CpTestCaseWorkbench.jsx`)
- **Custom Test Cases**: Allows inputting multiple test cases with expected outputs.
- **Batch Execution**: Runs all test cases concurrently against the active code.
- **Verdict Engine**:
  - 🟢 **AC (Accepted)**: Output matches expected exactly.
  - 🔴 **WA (Wrong Answer)**: Detailed side-by-side diff comparison highlighting discrepancies.
  - 🟡 **TLE (Time Limit Exceeded)**: Execution exceeded 2.0s threshold.
  - 🟣 **RE (Runtime Error)**: Segmentation fault, unhandled exception, or non-zero exit code.

### Speed Coding Arena (`SpeedCodingArenaModal.jsx`)
- Timed coding problem solver with difficulty tiers (Easy, Medium, Hard).
- Integrated countdown timer, scoring system, and streak tracking.

---

## 9. AI Developer Suite

### 1. Autonomous AI Error Healer (`aiErrorHealer.js`)
- Detects compilation errors and runtime tracebacks.
- Identifies the root cause (e.g., missing semicolon, index out of bounds, undefined variable).
- Generates a **1-Click Fix Diff** that automatically replaces buggy code with the patched solution.

### 2. Big-O Complexity Auditor (`aiCodeAnalyzer.js` + `ComplexityVisualizerModal.jsx`)
- Computes asymptotic Time Complexity ($O(1)$, $O(\log N)$, $O(N)$, $O(N \log N)$, $O(N^2)$, $O(2^N)$) and Space Complexity.
- Highlights nested loop bottlenecks and quadratic complexity zones.
- Provides recommendations to refactor code into optimal data structures (e.g., swapping nested search for HashMaps).

### 3. AI Code Explainer (`AiExplainerModal.jsx`)
- Generates human-friendly, step-by-step documentation explaining what each section of code achieves.

### 4. AI One-Click Debugger (`AiOneClickDebuggerModal.jsx`)
- Identifies logical pitfalls, infinite loop vulnerabilities, and unhandled edge cases (e.g., empty inputs, negative numbers, overflow).

---

## 10. Polyglot Transpiler Engine (`transpilerEngine.js`)

Enables instantaneous cross-compilation and translation between multiple mainstream languages:
- **Python ↔ C++ ↔ Java ↔ JavaScript ↔ Rust ↔ Go ↔ C#**
- Automatically maps:
  - Print statements (`print()` ↔ `std::cout` ↔ `System.out.println` ↔ `console.log`).
  - Loops & Iterators (`range()` ↔ `for (int i=0; i<n; i++)`).
  - Array/List primitives (`vector` ↔ `ArrayList` ↔ `list` ↔ `Array`).
  - Function definitions, type annotations, and main entry points.
- Previews side-by-side diff and enables loading directly into a new tab.

---

## 11. College Mode, Kiosk Lockdown & Admin Portal

Elite IDE features a dedicated **Educational Assessment Suite** built specifically for university computer laboratories and semester practical exams.

### Student Exam Kiosk Lockdown (`CollegeModeModal.jsx` + `SystemLockedOverlay.jsx`)
1. **Activation**: Student or invigilator enters College ID, Student Name, Roll Number, and Exam PIN.
2. **Strict Fullscreen Enforcement**: The browser triggers `requestFullscreen()`.
3. **Anti-Cheat Defenses**:
   - Disables Right Click, Inspect Element, Developer Tools shortcuts (`F12`, `Ctrl+Shift+I`).
   - Disables copy-pasting from external sources.
   - Listens to `visibilitychange` and `window.blur` events: switching tabs or minimizing the browser immediately registers a **Security Violation**.
4. **Emergency Lockdown (`SystemLockedOverlay.jsx`)**:
   - If violations exceed threshold or faculty initiates lockdown, the student screen displays an impenetrable lockout screen with an audio alarm.
   - Only the faculty 4-digit Master PIN can unlock the terminal.

### Faculty College Admin Portal (`compilercollegeadmin/index.html`)
- Accessible by professors and lab administrators.
- **Real-Time System Grid**: Visualizes every connected lab machine in real time (e.g., `LAB1-PC-01`, `LAB1-PC-02`).
- **Telemetry Monitored**: Active student roll number, current code lines, number of runs, violation counters.
- **Remote Commands**:
  - 🔒 **Lock Machine**: Instantly lock an individual student system or all systems simultaneously.
  - 🔓 **Unlock Machine**: Remotely dismiss lockdown overlay.
  - 📄 **Broadcast Notice**: Send announcement banners to student terminals.

---

## 12. University Lab Practical Record (PDF) Generator (`LabReportModal.jsx`)

Designed according to standard Indian engineering college (JNTU, Anna University, VTU, Mumbai University) lab observation manual formats.

### Automated Document Composition:
1. **Institution & Student Header**: College Name, Student Name, Hall Ticket / Roll Number, Subject & Lab Code.
2. **Experiment Metadata**: Experiment Title, Date, and Objective (Aim).
3. **Algorithm**: Automatically formats step-by-step algorithmic steps.
4. **Source Code**: Syntax-highlighted code block with line numbering.
5. **Test Data & Outputs**: Stdin values, expected results, and formatted execution stdout.
6. **Signature & Marks Grid**: Signature of Faculty Proctor, Date, and Marks Awarded block.
- **Export**: Generates a standard A4 PDF document ready for printing.

---

## 13. Cloud APIs & Serverless Endpoints

### 1. `POST /api/run`
Executes source code in the secure cloud sandbox.

#### Request Body:
```json
{
  "language": "python",
  "code": "print('Hello, Elite IDE!')",
  "stdin": ""
}
```

#### Response Body:
```json
{
  "stdout": "Hello, Elite IDE!\n",
  "stderr": "",
  "code": 0,
  "signal": null,
  "executionTime": 142,
  "memory": 15480,
  "compiler": "cpython-3.12.7",
  "status": "SUCCESS"
}
```

### 2. `GET /api/languages`
Returns an array of all 116+ supported compilers with runtime versions, default templates, and execution runners.

---

## 14. Supabase Real-time Telemetry & Database Schemas

Elite IDE connects to Supabase PostgreSQL for telemetry, live coders counter, and exam proctoring.

### 1. `compiler_telemetry` Table
Logs historical execution metrics for platform analytics:
```sql
CREATE TABLE public.compiler_telemetry (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Anonymous Dev',
    college_name TEXT DEFAULT 'Web IDE',
    system_name TEXT DEFAULT '',
    language TEXT NOT NULL,
    status TEXT NOT NULL,           -- 'SUCCESS' | 'ERROR'
    line_count INTEGER DEFAULT 1,
    code_snippet TEXT,
    execution_time_ms INTEGER DEFAULT 0,
    error_message TEXT,
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Browser',
    os TEXT DEFAULT 'OS',
    ip TEXT DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `compiler_active_sessions` Table
Maintains presence heartbeat for active live online coders:
```sql
CREATE TABLE public.compiler_active_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Anonymous Dev',
    current_language TEXT DEFAULT 'python',
    runs_count INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_online BOOLEAN DEFAULT true
);
```

### 3. `college_systems` & `college_incident_logs`
Powers the College Exam Kiosk and Proctoring System:
```sql
CREATE TABLE public.college_systems (
    system_id TEXT PRIMARY KEY,
    college_id TEXT REFERENCES public.college_accounts(college_id),
    system_name TEXT NOT NULL,
    lab_room TEXT DEFAULT 'Computer Lab 1',
    status TEXT DEFAULT 'idle',     -- 'idle' | 'locked' | 'violation'
    current_student_roll TEXT,
    current_student_name TEXT,
    violations_count INTEGER DEFAULT 0,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.college_incident_logs (
    id TEXT PRIMARY KEY,
    college_id TEXT,
    system_id TEXT,
    system_name TEXT NOT NULL,
    student_roll TEXT,
    student_name TEXT,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 15. Keyboard Shortcuts Cheat Sheet

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Ctrl + Enter`** | **Run Code** | Compiles and executes current active tab |
| **`Ctrl + S`** | **Save / Download** | Downloads the active file with proper extension |
| **`Ctrl + O`** | **Open File** | Opens file picker to load file into active tab |
| **`Ctrl + N`** | **New File** | Creates a new editor tab |
| **`Ctrl + B`** | **Toggle Explorer** | Toggles left workspace file explorer drawer |
| **`Ctrl + K`** | **Command Palette** | Opens search for all IDE tools and features |
| **`Shift + Alt + F`**| **Format Document** | Beautifies and cleans up active code indentations |
| **`Alt + 1`** | **Terminal Console** | Switches right pane to interactive terminal |
| **`Alt + 2`** | **Flowchart View** | Switches right pane to AST ISO Flowchart |
| **`Alt + 3`** | **CP Judge** | Switches right pane to CP Testcase Workbench |
| **`Alt + 4`** | **Memory Matrix** | Switches right pane to 3D Memory Array Visualizer |
| **`Alt + 5`** | **Recursion Tree** | Switches right pane to Call Stack Tree Visualizer |
| **`Esc`** | **Dismiss / Close** | Closes any open modal dialog or active dropdown |

---

## 16. Deployment & Production Build Guide

### Local Development Setup:
```bash
# 1. Navigate to the compiler directory
cd "d:\elite we kingdom website\COMPLIER"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

### Production Build:
```bash
# Build production bundle with minification
npm run build

# Output artifacts will be generated into COMPLIER/dist
# Copy the compiled assets into the root /compiler directory for website hosting
```

### Serverless Vercel Deployment:
- The website is configured via `vercel.json` to route `/api/*` to the serverless lambdas in `/api/run.js` and `/api/languages.js`.
- Root `/compiler` serves the Single Page Application (SPA).
- Root `/compilercollegeadmin` serves the faculty proctoring kiosk dashboard.

---

*Authored for Elite Web Kingdom Engineering & Operations Team.*  
*Maintained by the Elite IDE Core Architecture Group.*

