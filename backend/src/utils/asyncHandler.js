/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * next(err) automatically, instead of needing a try/catch in every controller.
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
