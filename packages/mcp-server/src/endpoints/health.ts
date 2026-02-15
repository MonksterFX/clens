/**
 * GET /health — simple health-check endpoint.
 */

import type { Request, Response } from "express";

import { AUTH_TOKEN } from "../lib/config.js";
import * as taskStore from "../state/task-store.js";

/** Handles GET /health requests. */
export async function handleHealth(
  _req: Request,
  res: Response
): Promise<void> {
  res.json({
    status: "ok",
    pending: taskStore.size(),
    authenticated: !!AUTH_TOKEN,
  });
}
