import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(backendRoot, 'database', 'migrations');

dotenv.config({ path: path.join(backendRoot, '.env') });

const dbName = process.env.DB_NAME || 'truehire';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
  multipleStatements: true,
});

const ensureMigrationTable = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS mysql_migrations (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getMigrationFiles = async () => {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
};

const run = async () => {
  const connection = await pool.getConnection();

  try {
    await ensureMigrationTable(connection);

    const [appliedRows] = await connection.query('SELECT filename FROM mysql_migrations');
    const applied = new Set(appliedRows.map((row) => row.filename));
    const files = await getMigrationFiles();
    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      if (!sql.trim()) {
        console.log(`Skipping empty migration ${file}`);
        continue;
      }

      console.log(`Applying ${file}`);
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO mysql_migrations (filename) VALUES (?)', [file]);
        await connection.commit();
        appliedCount += 1;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }

    console.log(
      appliedCount === 0
        ? `MySQL migrations are already up to date for ${dbName}.`
        : `Applied ${appliedCount} MySQL migration(s) to ${dbName}.`,
    );
  } finally {
    connection.release();
    await pool.end();
  }
};

run().catch((error) => {
  console.error('MySQL migration failed:', error.message);
  process.exit(1);
});
