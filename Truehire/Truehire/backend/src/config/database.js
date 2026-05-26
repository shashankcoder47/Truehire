import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';
import { env } from './env.js';

const globalForPrisma = globalThis;
const databaseUrl = new URL(env.databaseUrl);
const provider = databaseUrl.protocol.replace(':', '');
const isMysql = provider === 'mysql';
const isPostgres = provider === 'postgresql' || provider === 'postgres';

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl,
      },
    },
    log: [
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
  });

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma.$on('warn', (event) => console.warn('[database] Prisma warning:', event.message));
prisma.$on('error', (event) => console.error('[database] Prisma error:', event.message));

export { prisma };
export const isPostgresDatabase = isPostgres;

const buildMysqlPoolConfig = () => {
  const parsedUrl = new URL(env.databaseUrl);
  parsedUrl.searchParams.delete('connection_limit');
  parsedUrl.searchParams.delete('pool_timeout');

  return {
    uri: parsedUrl.toString(),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || process.env.PRISMA_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    multipleStatements: true,
  };
};

const translatePlaceholders = (statement) => {
  let index = 0;
  let quote = null;
  let translated = '';

  for (let cursor = 0; cursor < statement.length; cursor += 1) {
    const character = statement[cursor];
    const next = statement[cursor + 1];

    if (quote) {
      translated += character;
      if (character === quote && next === quote) {
        translated += next;
        cursor += 1;
      } else if (character === quote && statement[cursor - 1] !== '\\') {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      translated += character;
      continue;
    }

    if (character === '?') {
      index += 1;
      translated += `$${index}`;
      continue;
    }

    translated += character;
  }

  return translated;
};

const translatePostgresStatement = (statement) => {
  let translated = String(statement).trim().replace(/;$/, '');
  translated = translated.replace(
    /JSON_UNQUOTE\s*\(\s*JSON_EXTRACT\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*'\$\.([a-zA-Z0-9_]+)'\s*\)\s*\)/gi,
    "($1->>'$2')",
  );
  translated = translated.replace(
    /TIMESTAMPDIFF\s*\(\s*SECOND\s*,\s*([a-zA-Z0-9_.]+)\s*,\s*NOW\s*\(\s*\)\s*\)/gi,
    'EXTRACT(EPOCH FROM (NOW() - $1))',
  );
  translated = translated.replace(
    /DATE_ADD\s*\(\s*NOW\s*\(\s*\)\s*,\s*INTERVAL\s+24\s+HOUR\s*\)/gi,
    "(NOW() + INTERVAL '24 hours')",
  );
  translated = translated.replace(/\bCURDATE\s*\(\s*\)/gi, 'CURRENT_DATE');

  const ignoreInsert = /^\s*INSERT\s+IGNORE\s+INTO\b/i.test(translated);
  if (ignoreInsert) {
    translated = translated.replace(/^\s*INSERT\s+IGNORE\s+INTO\b/i, 'INSERT INTO');
    translated = `${translated} ON CONFLICT DO NOTHING`;
  }

  return translatePlaceholders(translated);
};

const isSchemaSetupStatement = (statement) => (
  /^\s*(CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS|ALTER\s+TABLE)\b/i.test(statement)
  || /\bINFORMATION_SCHEMA\b/i.test(statement)
);

const mapPostgresError = (error) => {
  const databaseCode = error?.meta?.code || error?.meta?.dbError?.code;
  if (databaseCode === '23505') error.code = 'ER_DUP_ENTRY';
  if (databaseCode === '23503') error.code = 'ER_NO_REFERENCED_ROW_2';
  return error;
};

const postgresPool = {
  async query(statement, values = []) {
    if (isSchemaSetupStatement(statement)) {
      return [[], undefined];
    }

    const query = translatePostgresStatement(statement);
    const returnsRows = /^\s*(SELECT|WITH)\b/i.test(query) || /\bRETURNING\b/i.test(query);

    try {
      if (returnsRows) {
        const rows = await prisma.$queryRawUnsafe(query, ...values);
        if (/^\s*(INSERT|UPDATE|DELETE)\b/i.test(query)) {
          return [{
            affectedRows: rows.length,
            insertId: rows[0]?.id ?? null,
            rows,
          }, undefined];
        }
        return [rows, undefined];
      }

      const affectedRows = await prisma.$executeRawUnsafe(query, ...values);
      return [{ affectedRows, insertId: null }, undefined];
    } catch (error) {
      throw mapPostgresError(error);
    }
  },
  async execute(statement, values = []) {
    return this.query(statement, values);
  },
  async getConnection() {
    return { release() {} };
  },
  async end() {},
};

export const pool = isMysql ? mysql.createPool(buildMysqlPoolConfig()) : postgresPool;

const targetDetails = {
  provider,
  host: databaseUrl.hostname,
  port: databaseUrl.port || (isPostgres ? '5432' : '3306'),
  database: databaseUrl.pathname.replace(/^\//, ''),
};

const describeConnectionError = (error) => {
  if (error.code === 'P1000') {
    return 'PostgreSQL rejected the username or password in DATABASE_URL.';
  }

  if (error.code === 'P1001') {
    return `Cannot reach PostgreSQL at ${targetDetails.host}:${targetDetails.port}. Check the Windows service and listening port.`;
  }

  if (error.code === 'P1003') {
    return `PostgreSQL database "${targetDetails.database}" does not exist. Create it or update DATABASE_URL.`;
  }

  return error.message || 'Unknown database connection error.';
};

export const checkDatabaseHealth = async () => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return {
      ok: true,
      ...targetDetails,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      ...targetDetails,
      latencyMs: Date.now() - startedAt,
      error: describeConnectionError(error),
      code: error.code || 'DATABASE_ERROR',
    };
  }
};

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRawUnsafe('SELECT 1');

    if (isMysql) {
      const connection = await pool.getConnection();
      connection.release();
    }

    console.info(
      `[database] Connected: ${targetDetails.provider}://${targetDetails.host}:${targetDetails.port}/${targetDetails.database}`,
    );
  } catch (error) {
    console.error('[database] Connection failed:', describeConnectionError(error));
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.info('[database] Disconnected');
  } catch (error) {
    console.error('[database] Disconnect failed:', error.message);
  }
};
