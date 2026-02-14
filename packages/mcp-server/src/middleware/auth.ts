/**
 * Bearer-token authorization middleware.
 */

import type { Request, Response, NextFunction } from "express";

import { AUTH_TOKEN } from "../lib/config.js";

/**
 * Validates the Authorization header against the configured token.
 * Returns `true` if auth is disabled (no token configured) or the token matches.
 */
export function isAuthorized(authHeader: string | undefined): boolean {
  if (!AUTH_TOKEN) return true;
  if (!authHeader) return false;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  return match[1] === AUTH_TOKEN;
}

/**
 * Express middleware that rejects requests without a valid bearer token.
 * Skipped automatically when no AUTH_TOKEN is configured.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isAuthorized(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
