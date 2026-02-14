/**
 * Request logging middleware with colored status output.
 */

import type { Request, Response, NextFunction } from "express";

/** Logs every request with method, URL, status code, and duration. */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status < 400 ? "\x1b[32m" : "\x1b[31m";
    console.error(`${color}${method}\x1b[0m ${url} ${status} ${duration}ms`);
  });

  next();
}
