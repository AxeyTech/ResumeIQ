import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';
import { logger } from '../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const { Pool } = pg;

function buildPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.');
  }
  return new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

function readMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // filenames are zero-padded, so lexical sort == execution order
}

function splitUpDown(sql) {
  const upMarker = '-- UP';
  const downMarker = '-- DOWN';
  const upIdx = sql.indexOf(upMarker);
  const downIdx = sql.indexOf(downMarker);
  if (upIdx === -1 || downIdx === -1 || downIdx < upIdx) {
    throw new Error('Migration file is missing "-- UP" / "-- DOWN" markers');
  }
  return {
    up: sql.slice(upIdx + upMarker.length, downIdx).trim(),
    down: sql.slice(downIdx + downMarker.length).trim(),
  };
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT name FROM schema_migrations ORDER BY name');
  return new Set(rows.map((r) => r.name));
}

async function up(client) {
  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrations(client);
  const files = readMigrationFiles();

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const { up: upSql } = splitUpDown(sql);

    logger.info(`Applying migration: ${file}`);
    await client.query('BEGIN');
    try {
      await client.query(upSql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      ranAny = true;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${file}`, { error: err.message });
      throw err;
    }
  }

  if (!ranAny) logger.info('No pending migrations. Database is up to date.');
  else logger.info('All migrations applied successfully.');
}

async function down(client) {
  await ensureMigrationsTable(client);
  const applied = [...(await getAppliedMigrations(client))].sort();
  const last = applied[applied.length - 1];

  if (!last) {
    logger.info('No migrations to roll back.');
    return;
  }

  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, last), 'utf8');
  const { down: downSql } = splitUpDown(sql);

  logger.info(`Rolling back migration: ${last}`);
  await client.query('BEGIN');
  try {
    await client.query(downSql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [last]);
    await client.query('COMMIT');
    logger.info(`Rolled back: ${last}`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Rollback failed: ${last}`, { error: err.message });
    throw err;
  }
}

async function status(client) {
  await ensureMigrationsTable(client);
  const applied = await getAppliedMigrations(client);
  const files = readMigrationFiles();

  console.log('\nMigration status:\n');
  for (const file of files) {
    console.log(`  [${applied.has(file) ? 'x' : ' '}] ${file}`);
  }
  console.log('');
}

async function main() {
  const command = process.argv[2] || 'up';
  const pool = buildPool();
  const client = await pool.connect();

  try {
    if (command === 'up') await up(client);
    else if (command === 'down') await down(client);
    else if (command === 'status') await status(client);
    else {
      console.error(`Unknown command: ${command}. Use "up", "down", or "status".`);
      process.exitCode = 1;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  logger.error('Migration runner failed', { error: err.message, stack: err.stack });
  process.exitCode = 1;
});
