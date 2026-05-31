// ---------------------------------------------------------------------------
// BackNine Backfill — seed historical eApps into KV from the REST API
// ---------------------------------------------------------------------------
//
// Fetches all electronic applications from the BackNine REST API and
// processes them through the same processEAppEvent() pipeline as webhooks,
// so KV state is 100% identical to webhook-produced state.
//
// After backfill, runs abandonment scan to populate leads:abandoned.
// ---------------------------------------------------------------------------

import { kv } from "./kv";
import { processEAppEvent, checkEAppAbandonment, scanForAbandonedEApps } from "./events";
import type { EAppPayload } from "./types";

const BACKNINE_API_KEY = process.env.BACKNINE_API_KEY ?? "";
const BACKNINE_API_BASE = "https://app.back9ins.com/api/v1";

// ---------------------------------------------------------------------------
// Fetch all eApps from BackNine REST API
// ---------------------------------------------------------------------------

async function fetchAllEAppsFromAPI(): Promise<EAppPayload[]> {
  if (!BACKNINE_API_KEY) {
    throw new Error("BACKNINE_API_KEY not configured");
  }

  const response = await fetch(`${BACKNINE_API_BASE}/electronic_applications`, {
    headers: {
      "X-BACKNINE-AUTHENTICATION": BACKNINE_API_KEY,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`BackNine API ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  // API returns: { electronic_applications: [...], meta: { total, page } }
  if (data.electronic_applications && Array.isArray(data.electronic_applications)) {
    return data.electronic_applications;
  }

  // Fallback: if it's a plain array
  if (Array.isArray(data)) {
    return data;
  }

  throw new Error(`Unexpected API response format: ${Object.keys(data).join(",")}`);
}

// ---------------------------------------------------------------------------
// Map API eApp to EAppPayload (API uses same structure as webhook)
// ---------------------------------------------------------------------------

function mapApiToPayload(apiEApp: Record<string, unknown>): EAppPayload {
  // The BackNine REST API returns the same field structure as the webhook
  // payload, so we can pass it through directly with minimal mapping.
  // Key difference: webhook wraps in { electronic_application: {...} }
  // REST API returns the eApp object directly.

  const payload: EAppPayload = {
    id: apiEApp.id as number,
    created_at: apiEApp.created_at as string | undefined,
    updated_at: apiEApp.updated_at as string | undefined,
    status: apiEApp.edited_status as string | undefined,
    is_completed: !!apiEApp.completed_at,
    step: apiEApp.step as number | undefined,
    named_step: apiEApp.named_step as string | undefined,
    step_display_name: apiEApp.step_display_name as string | undefined,
    premium: apiEApp.premium as number | undefined,
    benefit_amount: apiEApp.benefit_amount as number | undefined,
    pay_duration: apiEApp.pay_duration as number | undefined,
    mode: apiEApp.mode as number | undefined,
    edited_status: apiEApp.edited_status as string | undefined,
    lead_status: apiEApp.lead_status as string | null | undefined,
    follow_up_at: apiEApp.follow_up_at as string | null | undefined,
    completed_at: apiEApp.completed_at as string | null | undefined,
    refer: apiEApp.refer as boolean | undefined,
    product: apiEApp.product as EAppPayload["product"],
    insured: apiEApp.insured as EAppPayload["insured"],
    agent: apiEApp.agent as EAppPayload["agent"],
    apply_link: apiEApp.apply_link as string | undefined,
  };

  // Build apply_link if not present (BackNine format)
  if (!payload.apply_link && payload.id) {
    const domain = (apiEApp.approved_domain as Record<string, string>)?.domain;
    if (domain) {
      payload.apply_link = `https://${domain}/${payload.id}`;
    }
  }

  // Extract phone from parties[] if insured.phone_mobile is missing
  if (payload.insured && !payload.insured.phone_mobile && apiEApp.parties) {
    const parties = apiEApp.parties as Array<Record<string, unknown>>;
    const primaryParty = parties.find(
      (p) => p.type === "proposed" || p.type === "insured"
    );
    if (primaryParty?.primary_phone) {
      payload.insured.phone_mobile = primaryParty.primary_phone as string;
    }
    // Also grab email if missing
    if (!payload.insured?.email && primaryParty?.email) {
      payload.insured = { ...payload.insured!, email: primaryParty.email as string };
    }
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Infer step from step_display_name if step field is missing
// ---------------------------------------------------------------------------

function inferStep(apiEApp: Record<string, unknown>): number {
  if (apiEApp.step !== undefined && apiEApp.step !== null) {
    return apiEApp.step as number;
  }

  // Parse percentage from step_display_name
  const displayName = apiEApp.step_display_name as string | undefined;
  if (displayName) {
    const match = displayName.match(/(\d+)%/);
    if (match) {
      const pct = parseInt(match[1], 10);
      // Rough mapping: 0%=1, 5%=2, 10%=3, 25%=4, 35%=5, 45%=6, ...
      if (pct === 0) return 1;
      if (pct <= 5) return 2;
      if (pct <= 15) return 3;
      if (pct <= 25) return 4;
      if (pct <= 35) return 5;
      if (pct <= 45) return 6;
      if (pct <= 55) return 7;
      if (pct <= 65) return 8;
      if (pct <= 75) return 9;
      if (pct <= 85) return 10;
      if (pct <= 95) return 11;
      return 12;
    }
  }

  return 1; // Default to step 1 (created)
}

// ---------------------------------------------------------------------------
// Backfill all eApps from API into KV
// ---------------------------------------------------------------------------

export interface BackfillResult {
  fetched: number;
  seeded: number;
  skipped_existing: number;
  abandoned: number;
  contactable: string[];
  unrecoverable: string[];
  errors: string[];
}

export async function backfillEApps(force: boolean = false): Promise<BackfillResult> {
  const result: BackfillResult = {
    fetched: 0,
    seeded: 0,
    skipped_existing: 0,
    abandoned: 0,
    contactable: [],
    unrecoverable: [],
    errors: [],
  };

  // 1. Fetch all eApps from API
  let apiEApps: Record<string, unknown>[];
  try {
    apiEApps = await fetchAllEAppsFromAPI();
    result.fetched = apiEApps.length;
  } catch (err) {
    result.errors.push(`API fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return result;
  }

  // 2. Process each eApp through the canonical pipeline
  for (const apiEApp of apiEApps) {
    const eappId = String(apiEApp.id);

    try {
      // Check if already exists (skip unless force)
      if (!force) {
        const existing = await kv.get(`eapp:state:${eappId}`);
        if (existing) {
          result.skipped_existing++;
          // Still check contactability for reporting
          const state = existing as Record<string, unknown>;
          if (state.insured_phone) {
            result.contactable.push(`${eappId} (${state.insured_name})`);
          } else {
            result.unrecoverable.push(`${eappId} (${state.insured_name ?? "unknown"})`);
          }
          continue;
        }
      }

      // Map API response to EAppPayload
      const payload = mapApiToPayload(apiEApp);

      // Ensure step is populated (API sometimes omits it)
      if (!payload.step || payload.step === 0) {
        payload.step = inferStep(apiEApp);
      }

      // Process through the same pipeline as webhooks
      const processResult = await processEAppEvent(payload);

      if (processResult.isNew || force) {
        result.seeded++;
      } else {
        result.skipped_existing++;
      }

      // Track contactability
      const phone = payload.insured?.phone_mobile;
      if (phone) {
        result.contactable.push(`${eappId} (${payload.insured?.name ?? "unknown"})`);
      } else {
        result.unrecoverable.push(`${eappId} (${payload.insured?.name ?? "unknown"})`);
      }
    } catch (err) {
      result.errors.push(`${eappId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Scan all seeded eApps for abandonment
  const abandonedIds = await scanForAbandonedEApps();
  result.abandoned = abandonedIds.length;

  return result;
}