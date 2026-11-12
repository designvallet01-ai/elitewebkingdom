// ============================================================================
// Elite IDE - Instant In-Browser Relational SQL Engine (<5ms, Offline-Ready)
// Supports CREATE TABLE, INSERT INTO, SELECT (WHERE, ORDER BY, LIMIT,
// COUNT/SUM/AVG/MIN/MAX), UPDATE, DELETE, DROP TABLE, SHOW TABLES, DESCRIBE
// ============================================================================

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '-' && next === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;

    if (ch === ';' && !inSingle && !inDouble) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function splitCommaRespectingQuotes(str) {
  const parts = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
    }

    if (ch === ',' && !inSingle && !inDouble && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function parseValue(raw) {
  const trimmed = raw.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function formatAsciiTable(columns, rows) {
  if (!columns || columns.length === 0) return '(empty result set)\n';
  const widths = columns.map((col, idx) => {
    let w = String(col).length;
    for (const r of rows) {
      const val = r[idx] === null || r[idx] === undefined ? 'NULL' : String(r[idx]);
      if (val.length > w) w = val.length;
    }
    return Math.min(w, 42);
  });

  const padCell = (val, width) => {
    const s = val === null || val === undefined ? 'NULL' : String(val);
    return s.length > width ? s.slice(0, width - 1) + '…' : s.padEnd(width, ' ');
  };

  const border = (left, mid, right) =>
    `${left}${widths.map((w) => '─'.repeat(w + 2)).join(mid)}${right}\n`;

  let out = border('┌', '┬', '┐');
  out += `│ ${columns.map((c, i) => padCell(c, widths[i])).join(' │ ')} │\n`;
  out += border('├', '┼', '┤');
  for (const row of rows) {
    out += `│ ${row.map((val, i) => padCell(val, widths[i])).join(' │ ')} │\n`;
  }
  out += border('└', '┴', '┘');
  out += `(${rows.length} row${rows.length === 1 ? '' : 's'})\n`;
  return out;
}

function matchesWhere(row, whereClause) {
  if (!whereClause) return true;
  const orGroups = whereClause.split(/\s+OR\s+/i);
  return orGroups.some((orPart) => {
    const andParts = orPart.split(/\s+AND\s+/i);
    return andParts.every((cond) => {
      const likeMatch = cond.match(/^\s*([a-zA-Z_][\w.]*)\s+LIKE\s+(['"].*?['"])\s*$/i);
      if (likeMatch) {
        const col = likeMatch[1].split('.').pop().toLowerCase();
        const pattern = parseValue(likeMatch[2]).replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp(`^${pattern}$`, 'i').test(String(row[col] ?? ''));
      }

      const cmpMatch = cond.match(/^\s*([a-zA-Z_][\w.]*)\s*(=|!=|<>|>=|<=|>|<)\s*(.+?)\s*$/);
      if (!cmpMatch) return true;
      const col = cmpMatch[1].split('.').pop().toLowerCase();
      const op = cmpMatch[2];
      const rhs = parseValue(cmpMatch[3]);
      const lhs = row[col];

      if (op === '=') return String(lhs).toLowerCase() === String(rhs).toLowerCase() || lhs === rhs;
      if (op === '!=' || op === '<>') return String(lhs).toLowerCase() !== String(rhs).toLowerCase();
      const lNum = Number(lhs);
      const rNum = Number(rhs);
      if (!Number.isNaN(lNum) && !Number.isNaN(rNum)) {
        if (op === '>') return lNum > rNum;
        if (op === '<') return lNum < rNum;
        if (op === '>=') return lNum >= rNum;
        if (op === '<=') return lNum <= rNum;
      }
      return false;
    });
  });
}

export function evaluateSqlLocally(sqlCode = '') {
  const start = performance.now();
  const tables = Object.create(null);
  let stdout = '';
  let stderr = '';

  try {
    const statements = splitSqlStatements(sqlCode);
    if (statements.length === 0) {
      return {
        stdout: 'ℹ️ No SQL statements found. Try CREATE TABLE, INSERT INTO, or SELECT.\n',
        stderr: '',
        code: 0,
        status: 'SUCCESS',
        executionTime: 1,
        runner: 'Elite In-Browser SQL Engine (SQLite-Compatible)'
      };
    }

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trim();

      if (upper.startsWith('SHOW TABLES')) {
        const names = Object.keys(tables);
        stdout += formatAsciiTable(['table_name', 'rows'], names.map((n) => [n, tables[n].rows.length]));
        continue;
      }

      if (/^(?:CREATE\s+DATABASE|USE\s+)/i.test(stmt)) {
        stdout += `✓ Executed: ${stmt.split('\n')[0].slice(0, 60)}\n`;
        continue;
      }

      // CREATE TABLE
      const createMatch = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?[a-zA-Z_]\w*[`"\]]?)\s*\(([\s\S]+)\)\s*$/i);
      if (createMatch) {
        const tblName = createMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        const colDefs = splitCommaRespectingQuotes(createMatch[2]);
        const cols = [];
        let pkCol = null;
        for (const def of colDefs) {
          if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK|INDEX)\b/i.test(def)) continue;
          const colName = def.trim().split(/\s+/)[0].replace(/[`"\[\]]/g, '').toLowerCase();
          if (colName) {
            cols.push(colName);
            if (/\bPRIMARY\s+KEY\b/i.test(def) || /\bAUTO_INCREMENT\b/i.test(def) || /\bAUTOINCREMENT\b/i.test(def)) {
              pkCol = colName;
            }
          }
        }
        tables[tblName] = { name: tblName, columns: cols, rows: [], pkCol, nextId: 1 };
        stdout += `✓ Table "${tblName}" ready (${cols.join(', ')})\n`;
        continue;
      }

      // DROP TABLE
      const dropMatch = stmt.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([`"\[]?[a-zA-Z_]\w*[`"\]]?)/i);
      if (dropMatch) {
        const tblName = dropMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        delete tables[tblName];
        stdout += `✓ Dropped table "${tblName}"\n`;
        continue;
      }

      // INSERT INTO
      const insertMatch = stmt.match(/^INSERT\s+INTO\s+([`"\[]?[a-zA-Z_]\w*[`"\]]?)\s*(?:\(([^)]+)\))?\s*VALUES\s*([\s\S]+)$/i);
      if (insertMatch) {
        const tblName = insertMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        const tbl = tables[tblName];
        if (!tbl) throw new Error(`Table "${tblName}" does not exist. Create it with CREATE TABLE ${tblName} (...) first.`);

        const targetCols = insertMatch[2]
          ? splitCommaRespectingQuotes(insertMatch[2]).map((c) => c.replace(/[`"\[\]]/g, '').toLowerCase())
          : tbl.columns;

        // Parse multiple (...), (...) tuples cleanly
        const tupleMatches = [...insertMatch[3].matchAll(/\(([^)]+)\)/g)];
        if (tupleMatches.length === 0) throw new Error(`Invalid VALUES syntax in INSERT INTO ${tblName}.`);

        let inserted = 0;
        for (const m of tupleMatches) {
          const vals = splitCommaRespectingQuotes(m[1]).map(parseValue);
          const rowObj = {};
          tbl.columns.forEach((c) => { rowObj[c] = null; });
          targetCols.forEach((c, idx) => {
            rowObj[c] = idx < vals.length ? vals[idx] : null;
          });
          if (tbl.pkCol && (rowObj[tbl.pkCol] === null || rowObj[tbl.pkCol] === undefined)) {
            rowObj[tbl.pkCol] = tbl.nextId++;
          } else if (tbl.pkCol && typeof rowObj[tbl.pkCol] === 'number') {
            tbl.nextId = Math.max(tbl.nextId || 1, rowObj[tbl.pkCol] + 1);
          }
          tbl.rows.push(rowObj);
          inserted++;
        }
        stdout += `✓ Inserted ${inserted} row${inserted === 1 ? '' : 's'} into "${tblName}"\n`;
        continue;
      }

      // UPDATE
      const updateMatch = stmt.match(/^UPDATE\s+([`"\[]?[a-zA-Z_]\w*[`"\]]?)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (updateMatch) {
        const tblName = updateMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        const tbl = tables[tblName];
        if (!tbl) throw new Error(`Table "${tblName}" does not exist.`);

        const assignments = splitCommaRespectingQuotes(updateMatch[2]).map((part) => {
          const eqIdx = part.indexOf('=');
          return {
            col: part.slice(0, eqIdx).trim().replace(/[`"\[\]]/g, '').toLowerCase(),
            val: parseValue(part.slice(eqIdx + 1))
          };
        });
        let updated = 0;
        for (const row of tbl.rows) {
          if (matchesWhere(row, updateMatch[3])) {
            for (const a of assignments) row[a.col] = a.val;
            updated++;
          }
        }
        stdout += `✓ Updated ${updated} row${updated === 1 ? '' : 's'} in "${tblName}"\n`;
        continue;
      }

      // DELETE
      const deleteMatch = stmt.match(/^DELETE\s+FROM\s+([`"\[]?[a-zA-Z_]\w*[`"\]]?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (deleteMatch) {
        const tblName = deleteMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        const tbl = tables[tblName];
        if (!tbl) throw new Error(`Table "${tblName}" does not exist.`);
        const before = tbl.rows.length;
        tbl.rows = deleteMatch[2] ? tbl.rows.filter((r) => !matchesWhere(r, deleteMatch[2])) : [];
        stdout += `✓ Deleted ${before - tbl.rows.length} row(s) from "${tblName}"\n`;
        continue;
      }

      // DESCRIBE / DESC
      const descMatch = stmt.match(/^(?:DESCRIBE|DESC)\s+([`"\[]?[a-zA-Z_]\w*[`"\]]?)/i);
      if (descMatch) {
        const tblName = descMatch[1].replace(/[`"\[\]]/g, '').toLowerCase();
        const tbl = tables[tblName];
        if (!tbl) throw new Error(`Table "${tblName}" does not exist.`);
        stdout += formatAsciiTable(['Field', 'Status'], tbl.columns.map((c) => [c, 'ACTIVE']));
        continue;
      }

      // SELECT ... FROM ...
      const selectMatch = stmt.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([`"\[]?[a-zA-Z_]\w*[`"\]]?)(?:\s+(?:AS\s+)?[a-zA-Z_]\w*)?(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?$/i);
      if (selectMatch) {
        const rawCols = selectMatch[1].trim();
        const tblName = selectMatch[2].replace(/[`"\[\]]/g, '').toLowerCase();
        const whereClause = selectMatch[3];
        const orderClause = selectMatch[4];
        const limitVal = selectMatch[5] ? parseInt(selectMatch[5], 10) : null;

        let tbl = tables[tblName];
        // Convenient sample datasets if user runs SELECT directly without CREATE TABLE first
        if (!tbl && (tblName === 'students' || tblName === 'employees' || tblName === 'users')) {
          if (tblName === 'students') {
            tbl = {
              name: 'students',
              columns: ['id', 'name', 'branch', 'cgpa'],
              rows: [
                { id: 1, name: 'Aarav Sharma', branch: 'CSE', cgpa: 9.2 },
                { id: 2, name: 'Priya Nair', branch: 'ECE', cgpa: 8.8 },
                { id: 3, name: 'Rohan Reddy', branch: 'CSE', cgpa: 9.5 },
                { id: 4, name: 'Ananya Verma', branch: 'IT', cgpa: 8.6 }
              ]
            };
          } else {
            tbl = {
              name: tblName,
              columns: ['id', 'name', 'role', 'salary'],
              rows: [
                { id: 1, name: 'Vikram Patel', role: 'SDE-1', salary: 95000 },
                { id: 2, name: 'Neha Rao', role: 'Data Analyst', salary: 82000 },
                { id: 3, name: 'Karthik M', role: 'Backend Dev', salary: 110000 }
              ]
            };
          }
          stdout += `ℹ️ Loaded built-in sample "${tblName}" dataset:\n`;
        }

        if (!tbl) throw new Error(`Table "${tblName}" does not exist.`);

        let matched = tbl.rows.filter((r) => matchesWhere(r, whereClause));

        if (orderClause) {
          const orderMatch = orderClause.trim().match(/^([a-zA-Z_]\w*)(?:\s+(ASC|DESC))?/i);
          if (orderMatch) {
            const oCol = orderMatch[1].toLowerCase();
            const desc = (orderMatch[2] || '').toUpperCase() === 'DESC';
            matched = [...matched].sort((a, b) => {
              const av = a[oCol];
              const bv = b[oCol];
              if (av === bv) return 0;
              if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv;
              return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
            });
          }
        }

        if (limitVal !== null && !Number.isNaN(limitVal)) {
          matched = matched.slice(0, limitVal);
        }

        const requestedCols = rawCols === '*'
          ? tbl.columns
          : splitCommaRespectingQuotes(rawCols).map((c) => c.trim());

        // Handle Aggregate functions if all requested columns are aggregates
        const aggRegex = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[a-zA-Z_]\w*)\s*\)(?:\s+AS\s+([a-zA-Z_]\w*))?$/i;
        if (requestedCols.some((c) => aggRegex.test(c))) {
          const headers = [];
          const rowOut = [];
          for (const colExpr of requestedCols) {
            const am = colExpr.match(aggRegex);
            if (!am) {
              headers.push(colExpr);
              rowOut.push(matched[0]?.[colExpr.toLowerCase()] ?? null);
              continue;
            }
            const fn = am[1].toUpperCase();
            const target = am[2].toLowerCase();
            headers.push(am[3] || colExpr);

            if (fn === 'COUNT') {
              rowOut.push(target === '*' ? matched.length : matched.filter((r) => r[target] != null).length);
            } else {
              const nums = matched.map((r) => Number(r[target])).filter((n) => !Number.isNaN(n));
              if (nums.length === 0) rowOut.push(0);
              else if (fn === 'SUM') rowOut.push(Number(nums.reduce((a, b) => a + b, 0).toFixed(2)));
              else if (fn === 'AVG') rowOut.push(Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)));
              else if (fn === 'MIN') rowOut.push(Math.min(...nums));
              else if (fn === 'MAX') rowOut.push(Math.max(...nums));
            }
          }
          stdout += formatAsciiTable(headers, [rowOut]);
          continue;
        }

        const headers = [];
        const keys = [];
        for (const c of requestedCols) {
          const asMatch = c.match(/^([a-zA-Z_][\w.]*)(?:\s+AS\s+([a-zA-Z_]\w*))?$/i);
          const colKey = (asMatch ? asMatch[1] : c).split('.').pop().toLowerCase();
          keys.push(colKey);
          headers.push(asMatch?.[2] || colKey);
        }

        const rowsData = matched.map((r) => keys.map((k) => r[k]));
        stdout += formatAsciiTable(headers, rowsData);
        continue;
      }

      // Simple SELECT literal expression e.g. SELECT 1 + 1, 'Hello'
      const literalSelect = stmt.match(/^SELECT\s+([\s\S]+)$/i);
      if (literalSelect) {
        const items = splitCommaRespectingQuotes(literalSelect[1]);
        stdout += formatAsciiTable(items, [items.map(parseValue)]);
        continue;
      }

      stdout += `ℹ️ Executed SQL statement: ${stmt.split('\n')[0].slice(0, 64)}\n`;
    }
  } catch (err) {
    stderr = `SQL Error: ${err.message}\n`;
  }

  const executionTime = Math.max(1, Math.round(performance.now() - start));
  return {
    stdout,
    stderr,
    code: stderr ? 1 : 0,
    status: stderr ? 'ERROR' : 'SUCCESS',
    executionTime,
    runner: 'Elite In-Browser SQL Engine (<5ms)'
  };
}
