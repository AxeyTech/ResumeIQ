import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.PGSSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (err) => {
  // Errors on idle clients (e.g. connection dropped by the server) must be
  // handled here or they crash the whole process.
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Run a single query against the pool.
 * @param {string} text
 * @param {any[]} [params]
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a callback within a single client transaction, committing on success
 * and rolling back on any thrown error.
 * @template T
 * @param {(client: pg.PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function checkDbConnection() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
