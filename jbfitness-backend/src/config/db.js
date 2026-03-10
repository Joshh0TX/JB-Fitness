import { Pool } from "pg";

function toPgPlaceholders(sql) {
  let idx = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let output = "";

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const prev = sql[i - 1];

    if (ch === "'" && !inDouble && !inBacktick && prev !== "\\") {
      inSingle = !inSingle;
      output += ch;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick && prev !== "\\") {
      inDouble = !inDouble;
      output += ch;
      continue;
    }
    if (ch === "`" && !inSingle && !inDouble && prev !== "\\") {
      inBacktick = !inBacktick;
      output += ch;
      continue;
    }

    if (ch === "?" && !inSingle && !inDouble && !inBacktick) {
      idx += 1;
      output += `$${idx}`;
      continue;
    }

    output += ch;
  }

  return output;
}

function adaptMySqlSyntax(sql) {
  return sql
    .replace(/CURDATE\(\)/gi, "CURRENT_DATE")
    .replace(
      /DATE_SUB\(\s*CURRENT_DATE\s*,\s*INTERVAL\s+(\d+)\s+DAY\s*\)/gi,
      "CURRENT_DATE - INTERVAL '$1 day'"
    )
    .replace(/CURRENT_DATE\s*-\s*INTERVAL\s+(\d+)\s+DAY/gi, "CURRENT_DATE - INTERVAL '$1 day'");
}

function normalizeSql(sql, params = []) {
  const trimmed = String(sql || "").trim();

  // Support existing MySQL metadata lookup used by auth controller.
  if (/^SHOW\s+COLUMNS\s+FROM\s+users\s+LIKE\s+'password%'/i.test(trimmed)) {
    return {
      kind: "show-columns-password",
      sql: trimmed,
      values: params,
    };
  }

  const pgSql = toPgPlaceholders(adaptMySqlSyntax(trimmed));
  return {
    kind: "query",
    sql: pgSql,
    values: params,
  };
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;
const shouldUseSsl = String(process.env.PGSSL || "true").toLowerCase() !== "false";

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: Number(process.env.PGPORT || 5432),
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
      }
);

async function runQuery(sql, params = [], client = pool) {
  const normalized = normalizeSql(sql, params);

  if (normalized.kind === "show-columns-password") {
    const result = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name ILIKE 'password%'
       ORDER BY ordinal_position ASC`
    );

    const rows = result.rows.map((row) => ({ Field: row.column_name }));
    return [rows, []];
  }

  const isInsert = /^INSERT\s+/i.test(normalized.sql);
  const insertSql = isInsert && !/\bRETURNING\b/i.test(normalized.sql)
    ? `${normalized.sql} RETURNING *`
    : normalized.sql;

  const result = await client.query(insertSql, normalized.values);

  // Keep mysql2-like shape used by controllers.
  const packet = {
    affectedRows: result.rowCount || 0,
    insertId: result.rows?.[0]?.id,
  };

  if (/^\s*(INSERT|UPDATE|DELETE)/i.test(normalized.sql)) {
    return [packet, []];
  }

  return [result.rows, []];
}

const db = {
  query(sql, params = []) {
    return runQuery(sql, params, pool);
  },

  execute(sql, params = []) {
    return runQuery(sql, params, pool);
  },

  async getConnection() {
    const client = await pool.connect();
    return {
      query(sql, params = []) {
        return runQuery(sql, params, client);
      },
      execute(sql, params = []) {
        return runQuery(sql, params, client);
      },
      release() {
        client.release();
      },
    };
  },

  end() {
    return pool.end();
  },
};

export default db;
