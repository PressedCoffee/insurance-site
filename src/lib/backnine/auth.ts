// ---------------------------------------------------------------------------
// Shared auth helper for BackNine API routes
// ---------------------------------------------------------------------------

import { NextRequest } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const BACKNINE_API_KEY = process.env.BACKNINE_API_KEY ?? "";
const BACKNINE_EAPP_SECRET = process.env.BACKNINE_EAPP_WEBHOOK_SECRET ?? "";
const BACKNINE_CASE_SECRET = process.env.BACKNINE_CASE_WEBHOOK_SECRET ?? "";

/**
 * Authenticate a request. Accepts:
 *   - Vercel cron header (x-vercel-cron: 1)
 *   - CRON_SECRET via Authorization header
 *   - BackNine API key via Authorization OR X-BACKNINE-AUTHENTICATION header
 *   - Webhook secrets (eApp or Case) via either header
 */
export function authenticateRequest(request: NextRequest): boolean {
  // Vercel cron jobs — Vercel sets x-vercel-cron: 1 on scheduled invocations
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (isVercelCron) return true;

  // Check both Authorization and X-BACKNINE-AUTHENTICATION headers
  const authHeader = request.headers.get("authorization") ?? "";
  const backnineAuth = request.headers.get("x-backnine-authentication") ?? "";

  // CRON_SECRET (via Authorization header)
  if (CRON_SECRET && authHeader === CRON_SECRET) return true;

  // BackNine API key (via either header)
  if (BACKNINE_API_KEY && (authHeader === BACKNINE_API_KEY || backnineAuth === BACKNINE_API_KEY)) return true;

  // Webhook secrets (via either header)
  if (BACKNINE_EAPP_SECRET && (authHeader === BACKNINE_EAPP_SECRET || backnineAuth === BACKNINE_EAPP_SECRET)) return true;
  if (BACKNINE_CASE_SECRET && (authHeader === BACKNINE_CASE_SECRET || backnineAuth === BACKNINE_CASE_SECRET)) return true;

  return false;
}