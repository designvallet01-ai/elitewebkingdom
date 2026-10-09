// High-Precision Code Flowchart & Execution Graph Engine

export function parseCodeToGraph(code = '', language = 'python') {
  if (!code || !code.trim()) {
    return {
      nodes: [
        {
          id: 'start',
          type: 'terminal',
          label: 'Start',
          subtitle: 'Program Entrypoint',
          line: 1,
          category: 'start',
          x: 360,
          y: 70,
          width: 190,
          height: 52
        },
        {
          id: 'empty_prompt',
          type: 'process',
          label: 'Awaiting Code',
          subtitle: 'Write code in editor to visualize flow',
          line: 1,
          category: 'placeholder',
          x: 360,
          y: 180,
          width: 270,
          height: 60
        },
        {
          id: 'end',
          type: 'terminal',
          label: 'End',
          subtitle: 'Exit (Code 0)',
          line: 1,
          category: 'end',
          x: 360,
          y: 290,
          width: 190,
          height: 52
        }
      ],
      edges: [
        { from: 'start', to: 'empty_prompt', label: '' },
        { from: 'empty_prompt', to: 'end', label: '' }
      ],
      totalLines: 0
    };
  }

  const lines = code.split('\n');
  const nodes = [];
  const edges = [];
  let currentId = 1;

  // Add Start node
  nodes.push({
    id: 'start',
    type: 'terminal',
    label: 'Start',
    subtitle: `${language.toUpperCase()} Execution`,
    line: 1,
    category: 'start',
    icon: 'start'
  });

  let prevNodeId = 'start';
  let loopStack = [];
  let ifStack = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const lineNum = i + 1;

    // Skip empty lines or pure comment lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    const nodeId = `node_${currentId++}`;

    // 1. Function / Main Method Definition
    if (trimmed.match(/^(def\s+|function\s+|public\s+static|void\s+|int\s+main|fn\s+|func\s+|class\s+)/)) {
      const match = trimmed.match(/^(def\s+|function\s+|public\s+static\s+\w+\s+|void\s+|int\s+main|fn\s+|func\s+)?([A-Za-z0-9_]+)/);
      const funcName = match ? match[2] : 'function';
      nodes.push({
        id: nodeId,
        type: 'function',
        label: `def ${funcName}()`,
        subtitle: trimmed.slice(0, 36),
        line: lineNum,
        raw: trimmed,
        category: 'function',
        icon: 'func'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: 'call' });
      prevNodeId = nodeId;
      continue;
    }

    // 2. Conditions (if, elif, else if)
    if (trimmed.match(/^(if\s*\(?|elif\s*|else\s*if\s*\(?)/)) {
      const cond = trimmed.replace(/^(if|elif|else\s+if)\s*\(?/, '').replace(/[\){}:]+$/, '').trim();
      nodes.push({
        id: nodeId,
        type: 'decision',
        label: `is (${cond || 'condition'})?`,
        subtitle: 'Branch Decision',
        line: lineNum,
        raw: trimmed,
        category: 'decision',
        icon: 'branch'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: 'eval' });
      ifStack.push(nodeId);
      prevNodeId = nodeId;
      continue;
    }

    // 3. Else branch
    if (trimmed.startsWith('else:') || trimmed.startsWith('else {') || trimmed === 'else') {
      const parentIf = ifStack.length > 0 ? ifStack[ifStack.length - 1] : prevNodeId;
      nodes.push({
        id: nodeId,
        type: 'decision',
        label: 'else fallback',
        subtitle: 'False Path',
        line: lineNum,
        raw: trimmed,
        category: 'decision',
        icon: 'branch'
      });
      edges.push({ from: parentIf, to: nodeId, label: 'false' });
      prevNodeId = nodeId;
      continue;
    }

    // 4. Loops (for, while, do)
    if (trimmed.match(/^(for\s*\(?|while\s*\(?|do\s*\{?)/)) {
      const loopCond = trimmed.replace(/^(for|while)\s*\(?/, '').replace(/[\){}:]+$/, '').trim();
      nodes.push({
        id: nodeId,
        type: 'loop',
        label: `loop (${loopCond.slice(0, 24) || 'condition'})`,
        subtitle: 'Iteration Block',
        line: lineNum,
        raw: trimmed,
        category: 'loop',
        icon: 'loop'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: 'repeat' });
      loopStack.push(nodeId);
      prevNodeId = nodeId;
      continue;
    }

    // 5. Output / Print / Console
    if (trimmed.match(/(print\(|console\.log\(|printf\(|cout\s*<<|System\.out\.println\(|println!\()/)) {
      let printContent = trimmed;
      const m = trimmed.match(/(?:print|console\.log|printf|System\.out\.println)\((.*)\)/);
      if (m) printContent = m[1].replace(/;$/, '').trim();
      if (trimmed.includes('cout')) {
        printContent = trimmed.replace(/^.*cout\s*<<\s*/, '').replace(/<<\s*endl\s*;?$/, '').replace(/;$/, '');
      }

      nodes.push({
        id: nodeId,
        type: 'io',
        label: `print: ${printContent.slice(0, 26)}`,
        subtitle: 'Standard Output',
        line: lineNum,
        raw: trimmed,
        category: 'io',
        icon: 'io'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: '' });
      prevNodeId = nodeId;
      continue;
    }

    // 6. Return / Exit
    if (trimmed.startsWith('return') || trimmed.startsWith('exit(')) {
      nodes.push({
        id: nodeId,
        type: 'terminal',
        label: trimmed.replace(/;$/, '').slice(0, 26),
        subtitle: 'Function Return',
        line: lineNum,
        raw: trimmed,
        category: 'end',
        icon: 'end'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: 'return' });
      prevNodeId = nodeId;
      continue;
    }

    // 7. Variable Assignment / Expressions
    if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('!=') && !trimmed.includes('<=') && !trimmed.includes('>=')) {
      const expr = trimmed.replace(/;$/, '').trim();
      nodes.push({
        id: nodeId,
        type: 'process',
        label: expr.slice(0, 28),
        subtitle: 'State Mutation',
        line: lineNum,
        raw: trimmed,
        category: 'process',
        icon: 'calc'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: '' });
      prevNodeId = nodeId;
      continue;
    }

    // 8. General function call / statements
    if (trimmed.endsWith(';') || trimmed.includes('(')) {
      nodes.push({
        id: nodeId,
        type: 'process',
        label: trimmed.replace(/;$/, '').slice(0, 28),
        subtitle: 'Statement',
        line: lineNum,
        raw: trimmed,
        category: 'process',
        icon: 'calc'
      });
      edges.push({ from: prevNodeId, to: nodeId, label: '' });
      prevNodeId = nodeId;
      continue;
    }

    // Loop close bracket check
    if ((trimmed === '}' || trimmed === 'done') && loopStack.length > 0) {
      const loopHead = loopStack.pop();
      edges.push({ from: prevNodeId, to: loopHead, label: 'next iter' });
      prevNodeId = loopHead;
    }
  }

  // End Node
  const endNodeId = 'end';
  nodes.push({
    id: endNodeId,
    type: 'terminal',
    label: 'End',
    subtitle: 'Process Terminated',
    line: lines.length,
    category: 'end',
    icon: 'end'
  });
  edges.push({ from: prevNodeId, to: endNodeId, label: 'exit' });

  // Grid Layout Computation
  const nodeWidth = 240;
  const nodeHeight = 56;
  const startY = 48;
  const gapY = 82;
  const centerX = 360;

  nodes.forEach((node, idx) => {
    let offsetX = 0;
    if (node.category === 'decision') offsetX = 32;
    if (node.category === 'function') offsetX = -24;
    if (node.category === 'loop') offsetX = 28;

    node.x = centerX + offsetX;
    node.y = startY + idx * gapY;
    node.width = nodeWidth;
    node.height = nodeHeight;
  });

  return { nodes, edges, totalLines: lines.length };
}

// Extract variables with type checking
export function extractVariables(code = '') {
  if (!code) return [];
  const lines = code.split('\n');
  const vars = [];
  const regex = /(?:(?:const|let|var|int|float|double|String|auto|char|long)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;,\n]+)/g;

  lines.forEach((line, idx) => {
    let match;
    const cleanLine = line.trim();
    if (cleanLine.startsWith('//') || cleanLine.startsWith('#')) return;

    while ((match = regex.exec(cleanLine)) !== null) {
      const varName = match[1];
      const val = match[2].trim();
      if (varName && !['if', 'for', 'while', 'return', 'include'].includes(varName)) {
        vars.push({
          name: varName,
          value: val.slice(0, 36),
          line: idx + 1,
          type: /^[0-9]+(\.[0-9]+)?$/.test(val) ? 'number' :
                (val.startsWith('"') || val.startsWith("'") || val.startsWith('`')) ? 'string' :
                (val.startsWith('[') || val.startsWith('{')) ? 'collection' : 'expression'
        });
      }
    }
  });

  return vars;
}

// Generate structural AST Tree
export function generateAstTree(code = '', language = 'python') {
  const root = {
    name: `Source File (${language.toUpperCase()})`,
    type: 'ProgramRoot',
    children: []
  };

  if (!code || !code.trim()) {
    root.children.push({
      name: 'Empty File',
      type: 'EmptyStatement',
      line: 1
    });
    return root;
  }

  const lines = code.split('\n');
  let currentBlock = null;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

    if (trimmed.match(/^(import|from|#include|package|using)/)) {
      root.children.push({
        name: trimmed,
        type: 'IncludeDirective',
        line: idx + 1
      });
    } else if (trimmed.match(/^(def\s+|function\s+|public\s+static|fn\s+|func\s+|class\s+|int\s+main)/)) {
      const funcNode = {
        name: trimmed.replace(/[{:]$/, ''),
        type: 'FunctionDefinition',
        line: idx + 1,
        children: []
      };
      root.children.push(funcNode);
      currentBlock = funcNode;
    } else if (trimmed.match(/^(for|while|if|else)/)) {
      const stmtNode = {
        name: trimmed.replace(/[{:]$/, ''),
        type: 'ControlFlowStatement',
        line: idx + 1,
        children: []
      };
      if (currentBlock) {
        currentBlock.children.push(stmtNode);
      } else {
        root.children.push(stmtNode);
      }
    } else if (trimmed.includes('=')) {
      const assignNode = {
        name: trimmed.replace(/;$/, ''),
        type: 'AssignmentExpression',
        line: idx + 1
      };
      if (currentBlock) {
        currentBlock.children.push(assignNode);
      } else {
        root.children.push(assignNode);
      }
    }
  });

  return root;
}
