# 🚀 Elite IDE — Master QA Testing Checklist & Test Suite
> **Platform**: Elite IDE (Online Compiler, Code Editor & Developer Studio)  
> **Repository**: `elitewebkingdom/COMPLIER`  
> **Version**: v2.6 Pro  
> **Last Updated**: October 18, 2026

---

## 📌 Table of Contents
1. [Header & Navigation Bar](#1-header--navigation-bar)
2. [Desktop IDE Menubar](#2-desktop-ide-menubar)
3. [Center Command Controls (Run & Studio Hub)](#3-center-command-controls)
4. [Right Header Controls (Auto-Detect, Share, Palette, Theme)](#4-right-header-controls)
5. [Multi-Tab Workspace & Explorer Sidebar](#5-multi-tab-workspace--explorer-sidebar)
6. [Monaco Code Editor Core](#6-monaco-code-editor-core)
7. [1-Click DSA Arsenal & Algorithm Library](#7-1-click-dsa-arsenal--algorithm-library)
8. [Compiler Terminal & Interactive Execution](#8-compiler-terminal--interactive-execution)
9. [ISO Flowchart Visualizer (AST)](#9-iso-flowchart-visualizer-ast)
10. [Competitive Programming (CP) Judge Workbench](#10-competitive-programming-cp-judge-workbench)
11. [3D Memory Matrix & Pointer Visualizer](#11-3d-memory-matrix--pointer-visualizer)
12. [Recursion Tree & Call Stack Visualizer](#12-recursion-tree--call-stack-visualizer)
13. [HTML / CSS / JS Sandbox Web Preview](#13-html--css--js-sandbox-web-preview)
14. [AI Logic & Big-O Complexity Auditor](#14-ai-logic--big-o-complexity-auditor)
15. [Polyglot Code Transpiler Engine](#15-polyglot-code-transpiler-engine)
16. [University Lab Practical Record (PDF) Generator](#16-university-lab-practical-record-pdf-generator)
17. [College Exam Kiosk Lockdown & Admin Portal](#17-college-exam-kiosk-lockdown--admin-portal)
18. [Keyboard Shortcuts & Command Palette](#18-keyboard-shortcuts--command-palette)
19. [Mobile Responsiveness & PWA Features](#19-mobile-responsiveness--pwa-features)

---

## 1. Header & Navigation Bar
- [ ] **Brand Identity**: Click the `Elite IDE [PRO COMPILER]` logo to verify navigation back to the main website home.
- [ ] **Geometry & Alignment**: Verify that Left (Brand + Menubar), Center (Run + Studio Hub), and Right (Auto-Detect + Utilities) have ample breathing room with **zero overlaps**.
- [ ] **Z-Index & Stacking Context**: Verify that `.ide-navbar` (`z-index: 50000;`) renders cleanly above the editor tabs and canvas under all circumstances.

---

## 2. Desktop IDE Menubar

### 📂 File Menu
- [ ] **New File (`Ctrl + N`)**: Creates a new blank tab (e.g. `untitled_3.cpp`).
- [ ] **Open / Upload File... (`Ctrl + O`)**: Opens the system file picker; selecting `.cpp`, `.java`, or `.py` immediately populates the active tab with the file name and contents.
- [ ] **Save / Download (`Ctrl + S`)**: Downloads the active file with proper extension (`.cpp`, `.java`, `.py`, etc.).
- [ ] **Share Code Snippet**: Opens the modal with generated share URL and WhatsApp sharing button.
- [ ] **Return to Main Website**: Links back to `https://www.elitewebkingdom.in/`.

### ✏️ Edit Menu
- [ ] **Format Document (`Shift + Alt + F`)**: Formats and beautifies dirty unindented code in the active editor.
- [ ] **Clear Editor Buffer**: Clears all code in the active file after confirmation.
- [ ] **Editor Font Size (12px, 14px, 16px, 18px)**: Clicking each chip immediately scales the Monaco font size.

### 👁️ View Menu
- [ ] **Terminal Console (`Alt + 1`)**: Switches right pane to interactive terminal output.
- [ ] **Flowchart Visualizer (`Alt + 2`)**: Switches right pane to AST-based Flowchart.
- [ ] **CP Judge Workbench (`Alt + 3`)**: Switches right pane to Multi-Testcase CP Judge.
- [ ] **Memory Matrix & Pointers (`Alt + 4`)**: Switches right pane to 3D Memory Matrix.
- [ ] **Recursion Tree (`Alt + 5`)**: Switches right pane to Recursive Call Stack Tree.
- [ ] **Toggle File Explorer (`Ctrl + B`)**: Toggles visibility of the left workspace files drawer.

### ▶️ Run Menu
- [ ] **Start Execution (`Ctrl + ↵`)**: Triggers active code compilation and execution.
- [ ] **Run Test Cases (Judge)**: Executes CP test suite and diff comparisons.

### 🛠️ Tools Menu
- [ ] **AI Big-O & Logic Auditor**: Opens the complexity analysis and code optimizer modal.
- [ ] **Algorithms & DSA Library**: Opens the 50+ Algorithm Library modal.
- [ ] **Polyglot Code Transpiler**: Opens the cross-language translation engine.
- [ ] **Lab Practical Record (PDF)**: Opens the university lab record PDF generator.
- [ ] **College Exam Kiosk Mode**: Initiates secure fullscreen student kiosk setup.

### ❓ Help Menu
- [ ] **Command Palette (`Ctrl + K`)**: Opens the fuzzy search command palette.
- [ ] **Keyboard Shortcuts Guide (`Ctrl + /`)**: Opens keyboard shortcuts cheat sheet.
- [ ] **Theme Switcher**: Toggles between VS Code Dark (`vs-dark`) and Light Mode.

---

## 3. Center Command Controls
- [ ] **Capsule Run Button (`#run-code-button`)**:
  - Gradient: Cyber-emerald with glowing border.
  - Shortcut Badge: Visible `<kbd>Ctrl+↵</kbd>`.
  - Loading State: Shows spinner and "Running..." during execution; button is disabled while busy.
- [ ] **Studio Hub Button (`#nav-options-menu-btn`)**:
  - Sits directly adjacent to the Run button in the dead center.
  - Clicking opens the 560px 2-column workstation menu.
  - Left column displays Code & Workbench actions; right column displays AI, Academics, and Preferences.
  - Clicking outside or pressing `Esc` smoothly closes the menu.

---

## 4. Right Header Controls
- [ ] **Real-Time Language Auto-Detection**:
  - Type `def solve(): return 42` ➔ Badge switches to `Python 3.12`.
  - Type `#include <iostream>` ➔ Badge switches to `C++ (GCC 14)`.
  - Type `public class Main { ... }` ➔ Badge switches to `Java (JDK 17)`.
- [ ] **Manual Engine Override**: Selecting a language from the dropdown locks execution to that compiler.
- [ ] **Share Code Button (`#share-code-button`)**: Generates unique shareable URL with embedded code.
- [ ] **Search / Command Palette (`#command-palette-button`)**: Launches Command Palette.
- [ ] **Theme Toggle Button (`#toggle-theme-button`)**: Toggles Monaco and UI between Dark and Light.

---

## 5. Multi-Tab Workspace & Explorer Sidebar
- [ ] **Create New Tab (`+`)**: Adds tab with default naming (`untitled_N.<ext>`).
- [ ] **Tab Selection**: Clicking tabs smoothly switches editor buffers without flickering or data loss.
- [ ] **Unsaved Changes Dot**: Yellow badge appears when code differs from saved state.
- [ ] **Tab Close (`✕`)**: Closes tab; prevents closing the last remaining tab.
- [ ] **Left Explorer Sidebar (`Ctrl + B`)**:
  - Displays all open workspace files with language color badges.
  - Supports file renaming and file deletion.
  - Persists state in `localStorage` across page reloads.

---

## 6. Monaco Code Editor Core
- [ ] **Syntax Highlighting**: Verified across C++, Java, Python, JavaScript, Rust, Go, SQL.
- [ ] **Bracket Colorization & Auto-Closing**: Matching brackets share colors; typing `(` auto-inserts `)`.
- [ ] **Find & Replace (`Ctrl + F`, `Ctrl + H`)**: In-editor search and replace bar works as expected.
- [ ] **Copy Code Button**: Copies editor contents to system clipboard and displays "Copied!".
- [ ] **Voice Dictation (`🎙️ Voice`)**: Spoken phrases (e.g. "print hello world") convert to valid syntax.

---

## 7. 1-Click DSA Arsenal & Algorithm Library
- [ ] **DSA Arsenal Dropdown**:
  - Clicking `DSA Arsenal` in the tab strip opens a floating menu **on top of the editor** (`z-index: 99999;`).
  - Outside click automatically dismisses the menu.
- [ ] **Language-Aware Snippets**:
  - **Fast I/O**: Inserts `std::ios_base` in C++, `BufferedReader` in Java, `sys.stdin.readline` in Python.
  - **Binary Search**: Inserts valid $O(\log N)$ search function in the active language.
  - **Kadane's Algorithm**: Inserts max subarray algorithm.
  - **Sieve of Eratosthenes**: Inserts prime generation algorithm.
  - **BFS Traversal**: Inserts queue-based graph traversal template.
- [ ] **Full DSA Library (50+ Algorithms)**:
  - Clicking `Full DSA Library...` opens the comprehensive modal.
  - Search filters algorithms by keyword, category, or tag.
  - Multi-language tabs display pre-written code for Python, C++, Java, and JS.
  - Clicking `Load into Current` or `Open in New Tab` transfers code into the workspace.

---

## 8. Compiler Terminal & Interactive Execution
- [ ] **Standard Execution**: Output is rendered in real-time in the terminal window.
- [ ] **Interactive Input (`cin`, `scanf`, `input()`)**:
  - Prompts for stdin when execution requests input.
  - Submitting input feeds data to the backend engine and continues execution.
- [ ] **Execution Metrics**: Shows accurate Exit Code, Runtime (ms), and Memory.
- [ ] **Error Reporting**: Compilation errors and runtime tracebacks display with red styling.
- [ ] **Terminal Tools**: `Copy` button copies stdout; `Clear` wipes terminal buffer; `Stop` terminates runaway loops.

---

## 9. ISO Flowchart Visualizer (AST)
- [ ] **Automatic AST Parsing**: Writing `if-else`, `while`, or `for` constructs automatically renders an SVG flowchart.
- [ ] **Two-Way Code Synchronization**: Clicking any flowchart node highlights the corresponding code line in Monaco!
- [ ] **Canvas Controls**: Zoom in, Zoom out, Reset view, and Pan canvas operate smoothly.
- [ ] **Export Feature**: Download flowchart as clean PNG/SVG image.

---

## 10. Competitive Programming (CP) Judge Workbench
- [ ] **Add Custom Testcases**: Click `+ Add Testcase` to define input and expected output pairs.
- [ ] **Batch Execution**: Run all testcases against the active code with a single click.
- [ ] **Verdict Engine**:
  - Shows green **Accepted (AC)** badge when stdout matches expected output.
  - Shows red **Wrong Answer (WA)** badge with visual diff comparison when outputs differ.
  - Shows amber **Time Limit Exceeded (TLE)** badge if runtime exceeds threshold.

---

## 11. 3D Memory Matrix & Pointer Visualizer
- [ ] **Array Memory Layout**: Declaring an array (e.g. `int arr[5] = {10, 20, 30, 40, 50}`) visualizes continuous memory cells.
- [ ] **Cell Metadata**: Each memory cell shows element index, value, and hexadecimal address (`0x7ffe...`).
- [ ] **Dynamic Updates**: Modifying array values in code updates memory grid state.

---

## 12. Recursion Tree & Call Stack Visualizer
- [ ] **Recursive Stack Frames**: Writing recursive functions (Fibonacci, Factorial, Tower of Hanoi) visualizes frame pushes and pops.
- [ ] **Tree Branching**: Graphically maps recursive sub-calls into an interactive tree diagram.

---

## 13. HTML / CSS / JS Sandbox Web Preview
- [ ] **Web Engine Mode**: Selecting `HTML / DOM Sandbox` activates the Web Preview tab.
- [ ] **Live DOM Sandbox**: Renders HTML/CSS/JS in a secured iframe with live DOM execution.

---

## 14. AI Logic & Big-O Complexity Auditor
- [ ] **Complexity Breakdown**: Analyzes active code and reports Time Complexity ($O(1)$, $O(N)$, $O(N \log N)$, $O(N^2)$) and Space Complexity.
- [ ] **Line-by-Line Audit**: Highlights bottlenecks and inefficient algorithms.
- [ ] **1-Click Apply**: "Apply Optimized Code" writes AI-improved code directly into the editor.

---

## 15. Polyglot Code Transpiler Engine
- [ ] **Cross-Language Translation**: Translates code between Python, C++, Java, JavaScript, Rust, Go, and C#.
- [ ] **Diff Preview**: Displays side-by-side comparison of original and transpiled source.
- [ ] **Workspace Integration**: Replaces current editor or opens transpiled code in a new tab.

---

## 16. University Lab Practical Record (PDF) Generator
- [ ] **Metadata Input**: Accepts Student Name, Roll Number, Subject, and Experiment Title.
- [ ] **Document Assembly**: Combines Aim, Algorithm, Source Code, Test Cases, and Terminal Output into university format.
- [ ] **PDF Export**: Generates and downloads a print-ready, formatted A4 laboratory practical PDF.

---

## 17. College Exam Kiosk Lockdown & Admin Portal
- [ ] **Kiosk Activation**: Setting a 4-digit PIN triggers strict fullscreen lockdown.
- [ ] **Security Enforcement**:
  - Exiting fullscreen or pressing `Alt + Tab` triggers violation warnings.
  - Violations counter increments and broadcasts to the College Admin Portal.
- [ ] **PIN Exit**: Entering the correct PIN deactivates kiosk mode and restores full IDE access.
- [ ] **Admin Portal**: Instructors can view connected student machines, violation counts, and lock/unlock terminals remotely.

---

## 18. Keyboard Shortcuts & Command Palette
- [ ] **`Ctrl + K`**: Opens Command Palette; fuzzy searching any tool filters and executes it immediately.
- [ ] **`Ctrl + Enter`**: Compiles and runs active code.
- [ ] **`Ctrl + S`**: Saves and downloads active file.
- [ ] **`Ctrl + O`**: Opens file upload prompt.
- [ ] **`Ctrl + B`**: Toggles left file explorer sidebar.
- [ ] **`Shift + Alt + F`**: Formats current document.
- [ ] **`Alt + 1` to `Alt + 5`**: Switches right pane between Terminal, Flowchart, CP Judge, Memory, and Recursion.
- [ ] **`Esc`**: Closes any active modal or dropdown menu.

---

## 19. Mobile Responsiveness & PWA Features
- [ ] **Responsive Navigation**: Replaces desktop menubar with a compact mobile drawer and slide-up tools sheet.
- [ ] **Mobile Accessory Bar**: Renders quick-coding touch keys (`;`, `{`, `}`, `(`, `)`, `"`, `tab`) above mobile keyboard.
- [ ] **PWA Installation**: Triggers browser native install prompt for standalone desktop and mobile home screen launch.

---

*Verified by Elite Web Kingdom Quality Assurance Engineering Team.*
