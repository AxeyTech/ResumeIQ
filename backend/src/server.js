import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool, checkDbConnection } from './config/db.js';
import { scheduleBackups } from './jobs/backup.job.js';

async function main() {
  const dbOk = await checkDbConnection().catch((err) => {
    logger.error('Could not connect to the database on startup', { error: err.message });
    return false;
  });

  if (!dbOk) {
    logger.error(
      'Startup aborted: database is unreachable. Check DATABASE_URL and that PostgreSQL is running, ' +
        'then run "npm run migrate".',
    );
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`ResumeIQ API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Frontend CORS origin: ${env.FRONTEND_URL}`);
  });

  // NFR-S1: automatic, scheduled backups.
  const backupTask = scheduleBackups();

  // Fail fast and loud on ports already in use, permission errors, etc.
  server.on('error', (err) => {
    logger.error('Server failed to start', { error: err.message });
    process.exit(1);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    backupTask?.stop();

    server.close(async (err) => {
      if (err) {
        logger.error('Error while closing HTTP server', { error: err.message });
      }
      try {
        await pool.end();
        logger.info('Database pool closed. Goodbye.');
        process.exit(err ? 1 : 0);
      } catch (poolErr) {
        logger.error('Error closing database pool', { error: poolErr.message });
        process.exit(1);
      }
    });

    // Safety net: force-exit if connections do not close within 10s.
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: reason?.stack || reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception — exiting', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

main();
