import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import cron from 'node-cron';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * NFR-S1: automatic, incremental backups of user data at least once every
 * 24 hours. Shells out to `pg_dump` (the standard, reliable way to back up
 * PostgreSQL) and writes a timestamped, compressed dump to BACKUP_DIR.
 *
 * In production this directory should be a mounted volume that itself
 * syncs to durable off-instance storage (e.g. S3/GCS) — see README.
 */
export function runBackupOnce() {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(env.BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(env.BACKUP_DIR, `resumeiq-${timestamp}.dump`);

    const args = [env.DATABASE_URL, '--format=custom', '--file', outFile];
    const proc = spawn(env.PG_DUMP_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      // Most commonly: pg_dump is not installed / not on PATH.
      logger.error('Backup failed to start (is pg_dump installed and on PATH?)', { error: err.message });
      reject(err);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        logger.info('Database backup completed', { file: outFile });
        pruneOldBackups();
        resolve(outFile);
      } else {
        logger.error('Database backup failed', { code, stderr: stderr.slice(0, 2000) });
        reject(new Error(`pg_dump exited with code ${code}: ${stderr.slice(0, 500)}`));
      }
    });
  });
}

/** Keeps the most recent 30 backups so the directory doesn't grow unbounded. */
function pruneOldBackups(keep = 30) {
  try {
    const files = fs
      .readdirSync(env.BACKUP_DIR)
      .filter((f) => f.startsWith('resumeiq-') && f.endsWith('.dump'))
      .map((f) => ({ f, t: fs.statSync(path.join(env.BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);

    for (const { f } of files.slice(keep)) {
      fs.unlinkSync(path.join(env.BACKUP_DIR, f));
    }
  } catch (err) {
    logger.warn('Could not prune old backups', { error: err.message });
  }
}

/** Registers the recurring backup schedule. Call once at server startup. */
export function scheduleBackups() {
  if (!cron.validate(env.BACKUP_CRON)) {
    logger.warn(`BACKUP_CRON "${env.BACKUP_CRON}" is not a valid cron expression; backups are disabled.`);
    return null;
  }

  const task = cron.schedule(env.BACKUP_CRON, () => {
    runBackupOnce().catch(() => {
      // Already logged inside runBackupOnce; swallow here so the scheduler
      // itself keeps running for the next scheduled attempt.
    });
  });

  logger.info(`Automated backups scheduled ("${env.BACKUP_CRON}") to ${env.BACKUP_DIR}/`);
  return task;
}

// Allows `npm run backup` to trigger a one-off backup from the CLI.
if (process.argv.includes('--once')) {
  runBackupOnce()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
