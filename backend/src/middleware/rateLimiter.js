import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../config/logger.js';

/** NFR-P2: general-purpose API rate limiting to protect shared capacity. */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down and try again shortly.' } },
});

/** Tighter limit on auth endpoints to blunt credential-stuffing / brute force. */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a minute and try again.' } },
});

/**
 * NFR-S3: the analysis pipeline (parsing + Gemini calls) is the most
 * expensive operation in the system. Rather than letting unbounded
 * concurrent requests exhaust memory/CPU or hit Gemini rate limits, this
 * queues requests beyond ANALYZE_CONCURRENCY and degrades gracefully with a
 * 503 (asking the client to retry) once the queue itself is full, instead
 * of the process falling over.
 */
class ConcurrencyQueue {
  constructor(concurrency, queueLimit) {
    this.concurrency = concurrency;
    this.queueLimit = queueLimit;
    this.active = 0;
    this.queue = [];
  }

  get pending() {
    return this.queue.length;
  }

  async run(task) {
    if (this.active >= this.concurrency) {
      if (this.queue.length >= this.queueLimit) {
        throw ApiError.serviceUnavailable(
          'The analysis service is under heavy load right now. Please try again in a moment.',
          { code: 'QUEUE_FULL' },
        );
      }
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

export const analysisQueue = new ConcurrencyQueue(env.ANALYZE_CONCURRENCY, env.ANALYZE_QUEUE_LIMIT);

/** Express middleware form: wraps the rest of the request pipeline in the queue. */
export function withAnalysisQueue(req, res, next) {
  if (analysisQueue.pending > 0 || analysisQueue.active >= analysisQueue.concurrency) {
    logger.info('Analysis request queued', {
      active: analysisQueue.active,
      pending: analysisQueue.pending,
    });
  }

  analysisQueue
    .run(() => new Promise((resolve, reject) => {
      // Let the route handler run; it will call res.json/res.send itself.
      // We resolve once the response has finished so the queue slot frees up.
      res.on('finish', resolve);
      res.on('close', resolve);
      try {
        next();
      } catch (err) {
        reject(err);
      }
    }))
    .catch((err) => next(err));
}
