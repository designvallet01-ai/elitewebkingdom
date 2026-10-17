// ============================================================================
// Elite IDE - Real High-Precision ISO Flowchart & DAG Execution Graph Engine
// Full Branching Tree, Condition Diamonds, Parallelogram I/O & Loop-Back Edges
// ============================================================================

/**
 * Standard Flowchart Node Categories & ISO Shapes:
 * - 'start' / 'end': Oval / Stadium Terminal Capsule
 * - 'decision': Diamond / Rhombus with True and False branches
 * - 'loop': Diamond / Hexagonal Loop Header with Iteration & Exit paths
 * - 'io': Parallelogram for cin, cout, printf, scanf, print, input, console.log
 * - 'function': Predefined Process (Subroutine with double vertical borders)
 * - 'process': Rounded Rectangle for calculations, state mutations, calls
 * - 'merge': Circular Connector Junction (⨁) where parallel branches reunite
 */

export function parseCodeToGraph(code = '', language = 'python') {
  if (!code || !code.trim()) {
    return getEmptyGraph(language);
  }

  const rawLines = code.split('\n');
  const lang = (language || 'python').toLowerCase();
  
  // Step 1: Pre-process lines with indentation and clean tokens
  const parsedLines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Skip full line comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }
    // Calculate indentation spaces
    const indentMatch = raw.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].replace(/\t/g, '    ').length : 0;
    
    parsedLines.push({
      lineNum: i + 1,
      raw: trimmed,
      indent,
      type: classifyStatement(trimmed, lang)
    });
  }

  if (parsedLines.length === 0) {
    return getEmptyGraph(language);
  }

  // Step 2: Build Structured Abstract Flow Tree with Branches & Loops
  const flowTree = buildFlowTree(parsedLines, lang);

  // Step 3: Flatten Tree into Real 2D Coordinate Graph with Branch Offsets
  const graph = layoutFlowTree(flowTree, lang);

  // Step 4: Calculate Cyclomatic Complexity and Graph Metrics
  const stats = calculateGraphStats(graph);

  // Step 5: Generate valid Mermaid flowchart syntax for 1-click export
  const mermaidCode = generateMermaidCode(graph);

  return {
    ...graph,
    stats,
    mermaidCode,
    totalLines: rawLines.length
  };
}

// ---------------------------------------------------------------------------
// Helper: Classify each line of code
// ---------------------------------------------------------------------------
function classifyStatement(trimmed, lang) {
  // Function / Entry
  if (trimmed.match(/^(def\s+|function\s+|public\s+static|void\s+|int\s+main|fn\s+|func\s+|class\s+)/)) {
    return 'function';
  }
  // Decision condition
  if (trimmed.match(/^(if\s*\(?|elif\s*|else\s*if\s*\(?)/)) {
    return 'decision';
  }
  // Else block
  if (trimmed.startsWith('else:') || trimmed.startsWith('else {') || trimmed === 'else') {
    return 'else';
  }
  // Loops
  if (trimmed.match(/^(for\s*\(?|while\s*\(?|do\s*\{?)/)) {
    return 'loop';
  }
  // Input / Output
  if (trimmed.match(/(print\s*\(|console\.log\s*\(|printf\s*\(|cout\s*<<|System\.out\.println\s*\(|println!\s*\(|cin\s*>>|scanf\s*\(|input\s*\()/)) {
    return 'io';
  }
  // Return / Terminate
  if (trimmed.startsWith('return') || trimmed.startsWith('exit(') || trimmed.startsWith('sys.exit(')) {
    return 'terminal';
  }
  // Assignment / Mutation
  if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('!=') && !trimmed.includes('<=') && !trimmed.includes('>=')) {
    return 'process';
  }
  // Generic Statement
  return 'process';
}

// ---------------------------------------------------------------------------
// Helper: Build Hierarchical Flow Tree
// ---------------------------------------------------------------------------
function buildFlowTree(lines, lang) {
  const isPython = lang === 'python' || lang === 'py';
  let cursor = 0;

  function parseBlock(currentIndent, endCondition) {
    const block = [];

    while (cursor < lines.length) {
      const item = lines[cursor];

      if (endCondition && endCondition(item)) {
        break;
      }

      if (isPython && item.indent < currentIndent) {
        break;
      }

      cursor++;

      if (item.type === 'decision') {
        // Condition diamond node
        const condNode = {
          type: 'decision',
          item,
          thenBranch: [],
          elseBranch: null
        };

        // Determine then-branch indentation/block
        const branchIndent = isPython ? item.indent + 1 : currentIndent;
        condNode.thenBranch = parseBlock(branchIndent, (nextItem) => {
          if (isPython) {
            return nextItem.indent <= item.indent && (nextItem.type === 'else' || nextItem.type === 'decision');
          }
          return nextItem.type === 'else';
        });

        // Check if immediately followed by else
        if (cursor < lines.length) {
          const nextItem = lines[cursor];
          const isElseMatching = isPython 
            ? nextItem.indent === item.indent && (nextItem.type === 'else' || nextItem.raw.startsWith('elif'))
            : nextItem.type === 'else';

          if (isElseMatching) {
            cursor++; // consume else
            const elseIndent = isPython ? nextItem.indent + 1 : currentIndent;
            condNode.elseBranch = parseBlock(elseIndent, () => false);
          }
        }

        block.push(condNode);
      } else if (item.type === 'loop') {
        // Loop header node with loop-back
        const loopNode = {
          type: 'loop',
          item,
          body: []
        };
        const loopIndent = isPython ? item.indent + 1 : currentIndent;
        loopNode.body = parseBlock(loopIndent, (nextItem) => {
          if (isPython) return nextItem.indent <= item.indent;
          return false;
        });
        block.push(loopNode);
      } else {
        block.push({
          type: item.type,
          item
        });
      }
    }

    return block;
  }

  return parseBlock(0, () => false);
}

// ---------------------------------------------------------------------------
// Helper: Layout Flow Tree into Real 2D SVG Graph Coordinates
// ---------------------------------------------------------------------------
function layoutFlowTree(tree, lang) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = 1;

  // Add Terminal Start Node
  const startId = 'node_start';
  nodes.push({
    id: startId,
    type: 'terminal',
    category: 'start',
    label: 'START',
    subtitle: `${lang.toUpperCase()} Execution`,
    line: 1,
    x: 400,
    y: 50,
    width: 170,
    height: 48,
    isStadium: true
  });

  let currentY = 140;
  let lastEntryId = startId;
  let maxGraphX = 550;
  let minGraphX = 250;

  // Recursive Layout Function
  function layoutBlock(block, startId, centerX, initialY, branchOffset = 180) {
    let prevId = startId;
    let localY = initialY;

    for (let k = 0; k < block.length; k++) {
      const element = block[k];
      const curId = `node_${nodeIdCounter++}`;

      if (element.type === 'decision') {
        // 1. Condition Node (Diamond)
        const condText = cleanConditionText(element.item.raw);
        nodes.push({
          id: curId,
          type: 'decision',
          category: 'decision',
          label: condText,
          subtitle: 'Evaluate Condition',
          line: element.item.lineNum,
          raw: element.item.raw,
          x: centerX,
          y: localY,
          width: 200,
          height: 84,
          isDiamond: true
        });

        // Edge into condition
        if (prevId) {
          edges.push({
            id: `edge_${prevId}_${curId}`,
            from: prevId,
            to: curId,
            label: ''
          });
        }

        const conditionY = localY;
        const branchStartY = conditionY + 110;
        const trueX = centerX + branchOffset;
        const falseX = centerX - branchOffset;

        maxGraphX = Math.max(maxGraphX, trueX + 130);
        minGraphX = Math.min(minGraphX, falseX - 130);

        // Layout Then/True Branch (Right side)
        let thenLastId = curId;
        let thenEndY = branchStartY;
        if (element.thenBranch && element.thenBranch.length > 0) {
          const thenRes = layoutBlock(element.thenBranch, null, trueX, branchStartY, branchOffset * 0.75);
          thenLastId = thenRes.lastId;
          thenEndY = thenRes.endY;
          // Edge from Condition -> First node of True branch
          const firstThen = element.thenBranch[0];
          const firstThenId = thenRes.firstNodeId;
          edges.push({
            id: `edge_${curId}_${firstThenId}`,
            from: curId,
            to: firstThenId,
            label: 'TRUE / YES',
            isBranchTrue: true
          });
        }

        // Layout Else/False Branch (Left side)
        let elseLastId = curId;
        let elseEndY = branchStartY;
        if (element.elseBranch && element.elseBranch.length > 0) {
          const elseRes = layoutBlock(element.elseBranch, null, falseX, branchStartY, branchOffset * 0.75);
          elseLastId = elseRes.lastId;
          elseEndY = elseRes.endY;
          const firstElseId = elseRes.firstNodeId;
          edges.push({
            id: `edge_${curId}_${firstElseId}`,
            from: curId,
            to: firstElseId,
            label: 'FALSE / NO',
            isBranchFalse: true
          });
        }

        // Merge Junction Node (⨁)
        const mergeY = Math.max(thenEndY, elseEndY) + 60;
        const mergeId = `merge_${nodeIdCounter++}`;
        nodes.push({
          id: mergeId,
          type: 'merge',
          category: 'merge',
          label: '⨁',
          subtitle: 'Branch Merge',
          line: element.item.lineNum,
          x: centerX,
          y: mergeY,
          width: 36,
          height: 36,
          isMerge: true
        });

        // Connect Then Last -> Merge
        if (thenLastId) {
          edges.push({
            id: `edge_${thenLastId}_${mergeId}`,
            from: thenLastId,
            to: mergeId,
            label: ''
          });
        }

        // Connect Else Last or Direct False Bypass -> Merge
        if (element.elseBranch && element.elseBranch.length > 0) {
          edges.push({
            id: `edge_${elseLastId}_${mergeId}`,
            from: elseLastId,
            to: mergeId,
            label: ''
          });
        } else {
          // Direct bypass line from Condition diamond to Merge
          edges.push({
            id: `edge_${curId}_${mergeId}_bypass`,
            from: curId,
            to: mergeId,
            label: 'FALSE / NO',
            isBranchFalse: true,
            isBypass: true
          });
        }

        prevId = mergeId;
        localY = mergeY + 70;
      } else if (element.type === 'loop') {
        // 2. Loop Node (Diamond / Hexagon Header)
        const loopCond = cleanLoopText(element.item.raw);
        nodes.push({
          id: curId,
          type: 'loop',
          category: 'loop',
          label: loopCond,
          subtitle: 'Iteration Test',
          line: element.item.lineNum,
          raw: element.item.raw,
          x: centerX,
          y: localY,
          width: 210,
          height: 84,
          isDiamond: true
        });

        if (prevId) {
          edges.push({
            id: `edge_${prevId}_${curId}`,
            from: prevId,
            to: curId,
            label: ''
          });
        }

        const loopHeaderId = curId;
        const bodyStartY = localY + 95;

        // Layout Body Nodes directly below loop header
        let bodyLastId = loopHeaderId;
        let bodyEndY = bodyStartY;
        if (element.body && element.body.length > 0) {
          const bodyRes = layoutBlock(element.body, null, centerX, bodyStartY, branchOffset);
          bodyLastId = bodyRes.lastId;
          bodyEndY = bodyRes.endY;

          edges.push({
            id: `edge_${loopHeaderId}_${bodyRes.firstNodeId}`,
            from: loopHeaderId,
            to: bodyRes.firstNodeId,
            label: 'DO / NEXT',
            isBranchTrue: true
          });

          // Loop-Back Edge curving from last body node back up to the loop condition!
          edges.push({
            id: `loopback_${bodyLastId}_${loopHeaderId}`,
            from: bodyLastId,
            to: loopHeaderId,
            label: 'REPEAT',
            isLoopBack: true
          });
        }

        prevId = loopHeaderId;
        localY = bodyEndY + 60;
      } else {
        // 3. Regular Process / I-O / Function / Terminal Node
        const { label, subtitle, width, height, isParallelogram, isSubroutine } = formatNodeDetails(element.item);
        
        nodes.push({
          id: curId,
          type: element.type,
          category: element.type,
          label,
          subtitle,
          line: element.item.lineNum,
          raw: element.item.raw,
          x: centerX,
          y: localY,
          width,
          height,
          isParallelogram,
          isSubroutine
        });

        if (prevId) {
          edges.push({
            id: `edge_${prevId}_${curId}`,
            from: prevId,
            to: curId,
            label: ''
          });
        }

        prevId = curId;
        localY += height + 36;
      }
    }

    return {
      lastId: prevId,
      endY: localY,
      firstNodeId: block.length > 0 ? nodes[nodes.length - block.length]?.id : null
    };
  }

  // Layout the entire program body
  const bodyResult = layoutBlock(tree, lastEntryId, 400, currentY, 210);
  currentY = bodyResult.endY + 20;

  // Add Terminal End Node
  const endId = 'node_end';
  nodes.push({
    id: endId,
    type: 'terminal',
    category: 'end',
    label: 'END',
    subtitle: 'Program Terminated (Exit 0)',
    line: tree.length > 0 ? tree[tree.length - 1].item?.lineNum || 1 : 1,
    x: 400,
    y: currentY,
    width: 170,
    height: 48,
    isStadium: true
  });

  if (bodyResult.lastId) {
    edges.push({
      id: `edge_${bodyResult.lastId}_${endId}`,
      from: bodyResult.lastId,
      to: endId,
      label: 'EXIT'
    });
  }

  // Compute bounding box for auto-fit camera
  const bounds = {
    minX: minGraphX - 80,
    maxX: maxGraphX + 80,
    minY: 0,
    maxY: currentY + 100,
    width: Math.max(maxGraphX - minGraphX + 260, 800),
    height: currentY + 120
  };

  return { nodes, edges, bounds };
}

// ---------------------------------------------------------------------------
// Helpers: Clean Text Formats & Details
// ---------------------------------------------------------------------------
function cleanConditionText(raw) {
  let cond = raw
    .replace(/^(if|elif|else\s+if)\s*\(?/, '')
    .replace(/[\){}:]+$/, '')
    .trim();
  if (!cond) cond = 'condition';
  return `is (${cond})?`;
}

function cleanLoopText(raw) {
  let loop = raw
    .replace(/^(for|while)\s*\(?/, '')
    .replace(/[\){}:]+$/, '')
    .trim();
  if (!loop) loop = 'condition';
  return `loop (${loop.slice(0, 24)})`;
}

function formatNodeDetails(item) {
  const raw = item.raw;
  const type = item.type;

  // 1. I/O Statements (Parallelogram)
  if (type === 'io') {
    let ioLabel = raw;
    let subtitle = 'Standard I/O';
    const printMatch = raw.match(/(?:print|console\.log|printf|System\.out\.println)\((.*)\)/);
    if (printMatch) {
      ioLabel = `OUTPUT: ${printMatch[1].replace(/;$/, '').trim().slice(0, 24)}`;
      subtitle = 'Console Print';
    } else if (raw.includes('cout')) {
      ioLabel = `OUTPUT: ${raw.replace(/^.*cout\s*<<\s*/, '').replace(/<<\s*endl\s*;?$/, '').replace(/;$/, '').slice(0, 24)}`;
      subtitle = 'Stream Output';
    } else if (raw.includes('cin') || raw.includes('scanf') || raw.includes('input')) {
      ioLabel = `INPUT: ${raw.slice(0, 24)}`;
      subtitle = 'Standard Input';
    }
    return {
      label: ioLabel,
      subtitle,
      width: 220,
      height: 54,
      isParallelogram: true
    };
  }

  // 2. Subroutine / Function (Predefined Process)
  if (type === 'function') {
    const fnMatch = raw.match(/^(?:def\s+|function\s+|public\s+static\s+\w+\s+|void\s+|int\s+main|fn\s+|func\s+)?([A-Za-z0-9_]+)/);
    const fnName = fnMatch ? fnMatch[1] : 'function';
    return {
      label: `def ${fnName}()`,
      subtitle: 'Subroutine Entry',
      width: 230,
      height: 56,
      isSubroutine: true
    };
  }

  // 3. Return / Terminal
  if (type === 'terminal') {
    return {
      label: raw.slice(0, 26),
      subtitle: 'Return Value',
      width: 200,
      height: 50,
      isStadium: true
    };
  }

  // 4. General Process / Assignment
  return {
    label: raw.slice(0, 30),
    subtitle: raw.includes('=') ? 'Variable Mutation' : 'Operation',
    width: 220,
    height: 52
  };
}

// ---------------------------------------------------------------------------
// Helper: Graph Stats & Complexity Metrics
// ---------------------------------------------------------------------------
function calculateGraphStats(graph) {
  const nodes = graph.nodes;
  const edges = graph.edges;

  const decisionCount = nodes.filter(n => n.category === 'decision').length;
  const loopCount = nodes.filter(n => n.category === 'loop').length;
  const ioCount = nodes.filter(n => n.category === 'io').length;
  const processCount = nodes.filter(n => n.category === 'process').length;

  // McCabe's Cyclomatic Complexity M = E - N + 2P (P=1 for single program)
  const complexity = Math.max(edges.length - nodes.length + 2, 1);

  let rating = 'Simple Flow';
  let badgeColor = '#10b981';
  if (complexity > 6) {
    rating = 'Moderate Complexity';
    badgeColor = '#f59e0b';
  }
  if (complexity > 12) {
    rating = 'High Complexity';
    badgeColor = '#ef4444';
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    decisionCount,
    loopCount,
    ioCount,
    processCount,
    cyclomaticComplexity: complexity,
    complexityRating: rating,
    complexityColor: badgeColor
  };
}

// ---------------------------------------------------------------------------
// Helper: Generate Mermaid Flowchart Code
// ---------------------------------------------------------------------------
function generateMermaidCode(graph) {
  let md = 'graph TD\n';
  const nodeMap = {};

  graph.nodes.forEach(n => {
    const cleanLabel = n.label.replace(/"/g, "'").replace(/[\[\]\(\)\{\}]/g, '');
    let shape = `["${cleanLabel}"]`;
    if (n.category === 'start' || n.category === 'end') {
      shape = `(["${cleanLabel}"])`;
    } else if (n.category === 'decision' || n.category === 'loop') {
      shape = `{"${cleanLabel}"}`;
    } else if (n.category === 'io') {
      shape = `[/"${cleanLabel}"/]`;
    } else if (n.category === 'merge') {
      shape = `(("⨁"))`;
    }
    md += `  ${n.id}${shape}\n`;
    nodeMap[n.id] = true;
  });

  graph.edges.forEach(e => {
    if (nodeMap[e.from] && nodeMap[e.to]) {
      if (e.label) {
        md += `  ${e.from} -->|"${e.label}"| ${e.to}\n`;
      } else {
        md += `  ${e.from} --> ${e.to}\n`;
      }
    }
  });

  return md;
}

// ---------------------------------------------------------------------------
// Helper: Empty Graph State
// ---------------------------------------------------------------------------
function getEmptyGraph(lang) {
  return {
    nodes: [
      {
        id: 'node_start',
        type: 'terminal',
        category: 'start',
        label: 'START',
        subtitle: `${(lang || 'CODE').toUpperCase()} Entry`,
        x: 400,
        y: 60,
        width: 170,
        height: 48,
        isStadium: true
      },
      {
        id: 'node_empty',
        type: 'process',
        category: 'process',
        label: 'Write or paste code in editor',
        subtitle: 'Flowchart generates instantly with live branching',
        x: 400,
        y: 170,
        width: 300,
        height: 56
      },
      {
        id: 'node_end',
        type: 'terminal',
        category: 'end',
        label: 'END',
        subtitle: 'Program Exit',
        x: 400,
        y: 280,
        width: 170,
        height: 48,
        isStadium: true
      }
    ],
    edges: [
      { id: 'edge_start_empty', from: 'node_start', to: 'node_empty', label: '' },
      { id: 'edge_empty_end', from: 'node_empty', to: 'node_end', label: '' }
    ],
    bounds: { minX: 150, maxX: 650, minY: 0, maxY: 380, width: 800, height: 400 },
    stats: {
      totalNodes: 3,
      totalEdges: 2,
      decisionCount: 0,
      loopCount: 0,
      ioCount: 0,
      processCount: 1,
      cyclomaticComplexity: 1,
      complexityRating: 'Awaiting Code',
      complexityColor: '#64748b'
    },
    mermaidCode: 'graph TD\n  START([START]) --> P["Write or paste code"]\n  P --> END([END])',
    totalLines: 0
  };
}

// ---------------------------------------------------------------------------
// Memory & State Variables Extractor
// ---------------------------------------------------------------------------
export function extractVariables(code = '') {
  if (!code) return [];
  const lines = code.split('\n');
  const vars = [];
  const seen = new Set();
  const regex = /(?:(?:const|let|var|int|float|double|String|auto|char|long|bool)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;,\n]+)/g;

  lines.forEach((line, idx) => {
    let match;
    const cleanLine = line.trim();
    if (cleanLine.startsWith('//') || cleanLine.startsWith('#')) return;

    while ((match = regex.exec(cleanLine)) !== null) {
      const varName = match[1];
      const val = match[2].trim();
      const reserved = ['if', 'for', 'while', 'return', 'include', 'def', 'class', 'import'];
      
      if (varName && !reserved.includes(varName) && !seen.has(varName)) {
        seen.add(varName);
        vars.push({
          name: varName,
          value: val.slice(0, 36),
          line: idx + 1,
          type: /^[0-9]+(\.[0-9]+)?$/.test(val) ? 'number' :
                (val.startsWith('"') || val.startsWith("'") || val.startsWith('`')) ? 'string' :
                (val === 'true' || val === 'false' || val === 'True' || val === 'False') ? 'boolean' :
                (val.startsWith('[') || val.startsWith('{')) ? 'collection' : 'expression'
        });
      }
    }
  });

  return vars;
}

// ---------------------------------------------------------------------------
// Structural AST Tree Generator
// ---------------------------------------------------------------------------
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
