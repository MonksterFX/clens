/**
 * Bearer-token authorization middleware.
 */

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
