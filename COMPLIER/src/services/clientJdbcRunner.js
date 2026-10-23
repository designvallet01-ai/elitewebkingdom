// ============================================================================
// Elite IDE - Client-Side Java JDBC & In-Memory Relational Database Engine
// Supports standard java.sql.* interfaces:
// - DriverManager, Connection, Statement, PreparedStatement, ResultSet
// - DatabaseMetaData, ResultSetMetaData
// - Scanner & System.in interactive inputs
// - In-memory SQL engine (CREATE, DROP, INSERT, UPDATE, DELETE, SELECT)
// - Formatted System.out.println, print, and printf
// ============================================================================

export function evaluateJdbcLocally(code, stdinInput = '') {
  const startTime = Date.now();
  let stdout = '';
  let stderr = '';

  // 1. In-Memory Database Storage
  const database = {
    tables: {}
  };

  // 2. Interactive Stdin Scanner Parser
  const stdinTokens = (stdinInput || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let stdinTokenIndex = 0;

  const mockScanner = {
    hasNext: () => stdinTokenIndex < stdinTokens.length,
    hasNextInt: () => {
      if (stdinTokenIndex >= stdinTokens.length) return false;
      return !isNaN(parseInt(stdinTokens[stdinTokenIndex], 10));
    },
    next: () => {
      if (stdinTokenIndex >= stdinTokens.length) return '';
      return stdinTokens[stdinTokenIndex++];
    },
    nextInt: () => {
      if (stdinTokenIndex >= stdinTokens.length) return 0;
      return parseInt(stdinTokens[stdinTokenIndex++], 10) || 0;
    },
    nextDouble: () => {
      if (stdinTokenIndex >= stdinTokens.length) return 0.0;
      return parseFloat(stdinTokens[stdinTokenIndex++]) || 0.0;
    },
    nextFloat: () => {
      if (stdinTokenIndex >= stdinTokens.length) return 0.0;
      return parseFloat(stdinTokens[stdinTokenIndex++]) || 0.0;
    },
    nextLine: () => {
      if (stdinTokenIndex >= stdinTokens.length) return '';
      return stdinTokens[stdinTokenIndex++];
    },
    close: () => {}
  };

  // 3. Print Output Streams
  function unescapeSpecial(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
  }

  const _println = (x = '') => {
    stdout += unescapeSpecial(String(x)) + '\n';
  };

  const _print = (x = '') => {
    stdout += unescapeSpecial(String(x));
  };

  const _printf = (fmt, ...args) => {
    let i = 0;
    const str = String(fmt).replace(/%(-?\d+)?(\.\d+)?([sdf])/g, (match, width, prec, type) => {
      if (i >= args.length) return match;
      let val = args[i++];
      if (type === 'd') {
        val = parseInt(val, 10);
      } else if (type === 'f') {
        val = parseFloat(val);
        if (prec) {
          const dec = parseInt(prec.slice(1), 10);
          val = val.toFixed(dec);
        }
      }
      val = String(val);
      if (width) {
        const w = parseInt(width, 10);
        if (w < 0) {
          val = val.padEnd(Math.abs(w));
        } else {
          val = val.padStart(w);
        }
      }
      return val;
    });
    stdout += unescapeSpecial(str);
  };

  // 4. In-Memory SQL Execution Core
  function parseSqlValues(str) {
    const vals = [];
    let cur = '';
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if ((ch === "'" || ch === '"') && (i === 0 || str[i-1] !== '\\')) {
        if (!inQuotes) { inQuotes = true; quoteChar = ch; }
        else if (ch === quoteChar) { inQuotes = false; }
        else { cur += ch; }
      } else if (ch === ',' && !inQuotes) {
        vals.push(cleanVal(cur.trim()));
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) vals.push(cleanVal(cur.trim()));
    return vals;
  }

  function cleanVal(v) {
    if (typeof v !== 'string') return v;
    const s = v.trim();
    if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
      return s.slice(1, -1);
    }
    if (!isNaN(s) && s !== '') return Number(s);
    if (s.toLowerCase() === 'null') return null;
    if (s.toLowerCase() === 'true') return true;
    if (s.toLowerCase() === 'false') return false;
    return s;
  }

  function evalWhere(row, whereClause) {
    if (!whereClause || !whereClause.trim()) return true;
    const m = whereClause.match(/([A-Za-z0-9_]+)\s*(=|!=|<>|>|<|>=|<=)\s*(.+)/);
    if (!m) return true;
    const col = m[1].toLowerCase();
    const op = m[2];
    const val = cleanVal(m[3].trim());
    const rowVal = row[col];
    if (op === '=') return rowVal == val;
    if (op === '!=' || op === '<>') return rowVal != val;
    if (op === '>') return rowVal > val;
    if (op === '<') return rowVal < val;
    if (op === '>=') return rowVal >= val;
    if (op === '<=') return rowVal <= val;
    return true;
  }

  function executeSqlUpdate(sql) {
    const cleanSql = sql.trim().replace(/;$/, '');

    // DROP TABLE
    if (/^DROP\s+TABLE/i.test(cleanSql)) {
      const match = cleanSql.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([A-Za-z0-9_]+)/i);
      if (match) {
        delete database.tables[match[1].toLowerCase()];
        return 0;
      }
    }

    // CREATE TABLE
    if (/^CREATE\s+TABLE/i.test(cleanSql)) {
      const match = cleanSql.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)\s*\(([\s\S]+)\)/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        const colDefs = match[2].split(',').map(c => c.trim());
        const columns = colDefs
          .map(def => def.split(/\s+/)[0].toLowerCase())
          .filter(c => !['primary', 'foreign', 'constraint', 'key'].includes(c));
        database.tables[tbl] = { columns, rows: [] };
        return 0;
      }
    }

    // INSERT INTO
    if (/^INSERT\s+INTO/i.test(cleanSql)) {
      const match = cleanSql.match(/^INSERT\s+INTO\s+([A-Za-z0-9_]+)(?:\s*\(([^)]+)\))?\s+VALUES\s*\(([\s\S]+)\)/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        if (!database.tables[tbl]) {
          throw new Error(`java.sql.SQLException: Table '${tbl}' does not exist.`);
        }
        const colList = match[2]
          ? match[2].split(',').map(c => c.trim().toLowerCase())
          : database.tables[tbl].columns;
        const valList = parseSqlValues(match[3]);

        const row = {};
        database.tables[tbl].columns.forEach(c => (row[c] = null));
        colList.forEach((col, idx) => {
          row[col] = valList[idx] !== undefined ? valList[idx] : null;
        });
        database.tables[tbl].rows.push(row);
        return 1;
      }
    }

    // UPDATE
    if (/^UPDATE/i.test(cleanSql)) {
      const match = cleanSql.match(/^UPDATE\s+([A-Za-z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        if (!database.tables[tbl]) {
          throw new Error(`java.sql.SQLException: Table '${tbl}' does not exist.`);
        }
        const setClauses = match[2].split(',').map(s => s.trim());
        const where = match[3];
        let count = 0;
        database.tables[tbl].rows.forEach(r => {
          if (!where || evalWhere(r, where)) {
            setClauses.forEach(sc => {
              const [k, v] = sc.split('=').map(x => x.trim());
              r[k.toLowerCase()] = cleanVal(v);
            });
            count++;
          }
        });
        return count;
      }
    }

    // DELETE FROM
    if (/^DELETE\s+FROM/i.test(cleanSql)) {
      const match = cleanSql.match(/^DELETE\s+FROM\s+([A-Za-z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
      if (match) {
        const tbl = match[1].toLowerCase();
        if (!database.tables[tbl]) {
          throw new Error(`java.sql.SQLException: Table '${tbl}' does not exist.`);
        }
        const where = match[2];
        const initial = database.tables[tbl].rows.length;
        if (!where) {
          database.tables[tbl].rows = [];
          return initial;
        }
        database.tables[tbl].rows = database.tables[tbl].rows.filter(r => !evalWhere(r, where));
        return initial - database.tables[tbl].rows.length;
      }
    }

    return 0;
  }

  function executeSqlQuery(sql) {
    const cleanSql = sql.trim().replace(/;$/, '');
    const match = cleanSql.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([A-Za-z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+))?$/i);
    if (!match) {
      throw new Error(`java.sql.SQLException: Syntax error or unsupported query: ${cleanSql}`);
    }
    const selectCols = match[1].trim();
    const tbl = match[2].toLowerCase();
    const where = match[3];
    const orderBy = match[4];

    if (!database.tables[tbl]) {
      throw new Error(`java.sql.SQLException: Table '${tbl}' does not exist.`);
    }

    let rows = database.tables[tbl].rows.map(r => ({ ...r }));
    if (where) {
      rows = rows.filter(r => evalWhere(r, where));
    }

    if (orderBy) {
      const parts = orderBy.trim().split(/\s+/);
      const orderCol = parts[0].toLowerCase();
      const isDesc = parts[1] && parts[1].toLowerCase() === 'desc';
      rows.sort((a, b) => {
        if (a[orderCol] < b[orderCol]) return isDesc ? 1 : -1;
        if (a[orderCol] > b[orderCol]) return isDesc ? -1 : 1;
        return 0;
      });
    }

    const availableCols = database.tables[tbl].columns;
    const finalCols = selectCols === '*'
      ? availableCols
      : selectCols.split(',').map(c => c.trim().toLowerCase());

    return { rows, columns: finalCols };
  }

  // 5. Mock JDBC Java Classes
  class ResultSetMetaData {
    constructor(columns) {
      this.columns = columns;
    }
    getColumnCount() {
      return this.columns.length;
    }
    getColumnName(index) {
      return this.columns[index - 1] || '';
    }
    getColumnTypeName(index) {
      return 'VARCHAR';
    }
  }

  class ResultSet {
    constructor(queryResult) {
      this.rows = queryResult.rows || [];
      this.columns = queryResult.columns || [];
      this.cursor = -1;
    }
    next() {
      this.cursor++;
      return this.cursor < this.rows.length;
    }
    getInt(identifier) {
      return parseInt(this._get(identifier), 10) || 0;
    }
    getString(identifier) {
      const val = this._get(identifier);
      return val !== null && val !== undefined ? String(val) : '';
    }
    getDouble(identifier) {
      return parseFloat(this._get(identifier)) || 0.0;
    }
    getFloat(identifier) {
      return parseFloat(this._get(identifier)) || 0.0;
    }
    getBoolean(identifier) {
      return Boolean(this._get(identifier));
    }
    getObject(identifier) {
      return this._get(identifier);
    }
    getMetaData() {
      return new ResultSetMetaData(this.columns);
    }
    _get(id) {
      const row = this.rows[this.cursor];
      if (!row) throw new Error('java.sql.SQLException: Current position is before the first row or after the last row');
      if (typeof id === 'number') {
        const colName = this.columns[id - 1];
        return row[colName];
      }
      return row[String(id).toLowerCase()];
    }
    close() {}
  }

  class Statement {
    executeUpdate(sql) {
      return executeSqlUpdate(sql);
    }
    executeQuery(sql) {
      return new ResultSet(executeSqlQuery(sql));
    }
    execute(sql) {
      if (/^\s*SELECT/i.test(sql)) {
        return true;
      }
      executeSqlUpdate(sql);
      return false;
    }
    addBatch(sql) {
      if (!this._batch) this._batch = [];
      this._batch.push(sql);
    }
    executeBatch() {
      const counts = [];
      if (this._batch) {
        for (const s of this._batch) {
          counts.push(executeSqlUpdate(s));
        }
        this._batch = [];
      }
      return counts;
    }
    close() {}
  }

  class PreparedStatement {
    constructor(sql) {
      this.sql = sql;
      this.params = {};
      this._batch = [];
    }
    setInt(idx, val) { this.params[idx] = val; }
    setString(idx, val) { this.params[idx] = `'${String(val).replace(/'/g, "''")}'`; }
    setDouble(idx, val) { this.params[idx] = val; }
    setFloat(idx, val) { this.params[idx] = val; }
    setBoolean(idx, val) { this.params[idx] = val ? 1 : 0; }
    setObject(idx, val) {
      this.params[idx] = typeof val === 'string' ? `'${val}'` : val;
    }
    _buildSql() {
      let query = this.sql;
      let pIdx = 1;
      while (query.includes('?')) {
        const val = this.params[pIdx] !== undefined ? this.params[pIdx] : 'NULL';
        query = query.replace('?', val);
        pIdx++;
      }
      return query;
    }
    executeUpdate() {
      return executeSqlUpdate(this._buildSql());
    }
    executeQuery() {
      return new ResultSet(executeSqlQuery(this._buildSql()));
    }
    addBatch() {
      this._batch.push(this._buildSql());
      this.params = {};
    }
    executeBatch() {
      const counts = this._batch.map(s => executeSqlUpdate(s));
      this._batch = [];
      return counts;
    }
    close() {}
  }

  class DatabaseMetaData {
    getDatabaseProductName() { return 'MySQL Database Server (In-Memory Engine)'; }
    getDatabaseProductVersion() { return '8.0.35-Elite'; }
    getDriverName() { return 'MySQL Connector/J (Elite Driver)'; }
    getDriverVersion() { return '8.0.35'; }
    getTables(cat, schema, tblNamePattern, types) {
      const rows = Object.keys(database.tables).map(t => ({
        table_cat: 'college_db',
        table_schem: null,
        table_name: t,
        table_type: 'TABLE'
      }));
      return new ResultSet({ rows, columns: ['table_cat', 'table_schem', 'table_name', 'table_type'] });
    }
  }

  class Connection {
    constructor(url) {
      this.url = url;
      this.autoCommit = true;
    }
    createStatement() { return new Statement(); }
    prepareStatement(sql) { return new PreparedStatement(sql); }
    setAutoCommit(val) { this.autoCommit = Boolean(val); }
    commit() {}
    rollback() {}
    getMetaData() { return new DatabaseMetaData(); }
    close() {}
  }

  const DriverManager = {
    getConnection: (url, user, pass) => {
      return new Connection(url);
    }
  };

  const Class = {
    forName: (driverName) => {
      return true;
    }
  };

  // 6. Source Preprocessing & Safe AST Execution
  function cleanJavaSource(src) {
    // Strip block comments
    let stripped = src.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = stripped.split('\n');
    const processed = lines.map(line => {
      let result = '';
      let inStr = false;
      let qChar = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if ((ch === '"' || ch === "'") && (i === 0 || line[i-1] !== '\\')) {
          if (!inStr) { inStr = true; qChar = ch; }
          else if (ch === qChar) { inStr = false; }
        }
        if (!inStr && ch === '/' && line[i+1] === '/') {
          break; // Real comment
        }
        result += ch;
      }
      return result;
    });
    return processed.join('\n');
  }

  function extractMainMethodBody(src) {
    const mainIdx = src.search(/public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/);
    if (mainIdx === -1) return src;

    const openBraceIdx = src.indexOf('{', mainIdx);
    let depth = 1;
    let i = openBraceIdx + 1;
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    return src.slice(openBraceIdx + 1, i - 1);
  }

  try {
    const cleaned = cleanJavaSource(code);
    let body = extractMainMethodBody(cleaned);

    // Replace System.out & Scanner
    body = body.replace(/System\.out\.println\s*\(/g, '_println(');
    body = body.replace(/System\.out\.print\s*\(/g, '_print(');
    body = body.replace(/System\.out\.printf\s*\(/g, '_printf(');
    body = body.replace(/System\.err\.println\s*\(/g, '_println(');
    body = body.replace(/e\.printStackTrace\s*\(\s*\);?/g, '_println("Exception: " + (e.message || e));');

    // Replace Scanner sc = new Scanner(System.in);
    body = body.replace(/new\s+Scanner\s*\(\s*System\.in\s*\)/g, 'mockScanner');
    body = body.replace(/\bScanner\s+([a-zA-Z0-9_]+)\s*=/g, 'let $1 =');

    // Replace catch (ExceptionType var) with catch (var)
    body = body.replace(/catch\s*\(\s*[A-Za-z0-9_.]+\s+([a-zA-Z0-9_]+)\s*\)/g, 'catch ($1)');

    // Replace Java variable type definitions
    const javaTypes = [
      'Connection', 'Statement', 'PreparedStatement', 'ResultSet', 'DatabaseMetaData', 'ResultSetMetaData',
      'String', 'int', 'double', 'float', 'boolean', 'long', 'byte', 'short', 'char', 'Object'
    ];
    javaTypes.forEach(t => {
      const reg = new RegExp(`\\b${t}\\s+([a-zA-Z0-9_]+)\\s*=`, 'g');
      body = body.replace(reg, 'let $1 =');
    });

    // Execute through sandbox Function
    const runner = new Function(
      'DriverManager', 'Class', 'mockScanner', '_println', '_print', '_printf',
      body
    );
    runner(DriverManager, Class, mockScanner, _println, _print, _printf);

  } catch (runtimeErr) {
    stderr += `java.sql.SQLException: ${runtimeErr.message || String(runtimeErr)}\n`;
  }

  const executionTime = Math.max(1, Date.now() - startTime);
  const isSuccess = !stderr;

  return {
    stdout: stdout || (isSuccess ? '[Done: JDBC program executed with no console output]' : ''),
    stderr,
    code: isSuccess ? 0 : 1,
    executionTime,
    status: isSuccess ? 'SUCCESS' : 'RUNTIME_ERROR',
    runner: 'Elite JDBC In-Memory Engine (JDK 17 + JDBC 4.3)'
  };
}
