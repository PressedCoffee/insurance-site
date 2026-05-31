// ---------------------------------------------------------------------------
// BackNine Event Handler — dedup, state machine, step tracking, abandonment
// ---------------------------------------------------------------------------
//
// Key design:
//   - Every webhook event is logged to KV with a content hash for dedup
//   - eApp state machine: created → in_progress → (abandoned | completed)
//   - Step changes are detected by comparing against stored state
//   - Abandonment: eApp that hasn't progressed in ABANDONMENT_THRESHOLD_HOURS
//   - Event log is append-only, keyed by eapp:events:{id} (list) and
//     case:events:{id} (list)
//   - Lead queue stored as a sorted set for dashboard reads
// ---------------------------------------------------------------------------

import { kv } from "./kv";
import {
  EAppPayload,
  CasePayload,
  EAppState,
  CaseState,
  EventLogEntry,
  ABANDONMENT_THRESHOLD_HOURS,
  ABANDONMENT_STEP_THRESHOLD,
} from "./types";

// ---------------------------------------------------------------------------
// Utility: hash a payload for dedup
// ---------------------------------------------------------------------------

function hashPayload(payload: Record<string, unknown>): string {
  // Simple content hash: id + updated_at + step + is_completed + status
  // This is sufficient because BackNine sends the full object each time
  const key = [
    payload.id,
    payload.updated_at ?? "",
    payload.step ?? "",
    payload.is_completed ?? false,
    payload.status ?? "",
    payload.step_display_name ?? "",
  ].join("|");
  // Simple hash (not crypto, just for dedup)
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
  }
  return h.toString(36);
}

// ---------------------------------------------------------------------------
// EApp State Machine
// ---------------------------------------------------------------------------

function eappPayloadToState(payload: EAppPayload, existing: EAppState | null): EAppState {
  const now = new Date().toISOString();
  return {
    id: payload.id,
    status: payload.is_completed
      ? "completed"
      : existing?.status === "completed"
        ? "completed"
        : payload.step === 1 || payload.step === -5 || !existing
          ? "created"
          : existing.status === "abandoned"
            ? "in_progress" // re-engaged after abandonment
            : "in_progress",
    step: payload.step ?? existing?.step ?? 0,
    named_step: payload.named_step ?? existing?.named_step ?? null,
    step_display_name: payload.step_display_name ?? existing?.step_display_name ?? null,
    premium: payload.premium ?? existing?.premium ?? null,
    benefit_amount: payload.benefit_amount ?? existing?.benefit_amount ?? null,
    product_name: payload.product?.name ?? existing?.product_name ?? null,
    carrier_name: payload.product?.carrier?.name ?? existing?.carrier_name ?? null,
    insured_name: payload.insured?.name ?? existing?.insured_name ?? null,
    insured_email: payload.insured?.email ?? existing?.insured_email ?? null,
    insured_phone: payload.insured?.phone_mobile ?? existing?.insured_phone ?? null,
    apply_link: payload.apply_link ?? existing?.apply_link ?? null,
    lead_status: payload.lead_status ?? existing?.lead_status ?? null,
    is_completed: payload.is_completed ?? existing?.is_completed ?? false,
    created_at: payload.created_at ?? existing?.created_at ?? null,
    updated_at: payload.updated_at ?? existing?.updated_at ?? now,
    completed_at: payload.completed_at ?? existing?.completed_at ?? null,
    first_seen_at: existing?.first_seen_at ?? now,
    last_event_at: now,
    last_step_at: null,
    event_count: (existing?.event_count ?? 0) + 1,
  };
}

// ---------------------------------------------------------------------------
// Process eApp webhook event
// ---------------------------------------------------------------------------

export interface EAppProcessResult {
  eventType: string;
  isNew: boolean;
  stepChanged: boolean;
  fromStep?: number;
  toStep?: number;
  completedNow: boolean;
  stateChanged: boolean;
  state: EAppState;
  deduped: boolean;
}

export async function processEAppEvent(payload: EAppPayload): Promise<EAppProcessResult> {
  const now = new Date().toISOString();
  const payloadHash = hashPayload(payload as Record<string, unknown>);
  const eappId = String(payload.id);

  // Read existing state
  const existing: EAppState | null = await kv.get<EAppState>(`eapp:state:${eappId}`);
  const lastHash: string | null = await kv.get<string>(`eapp:lasthash:${eappId}`);

  // Check dedup — skip if identical payload
  if (lastHash === payloadHash && existing) {
    return {
      eventType: "eapp.deduped",
      isNew: false,
      stepChanged: false,
      completedNow: false,
      stateChanged: false,
      state: existing,
      deduped: true,
    };
  }

  // Determine event type
  let eventType = "eapp.updated";
  const isNew = !existing;
  if (isNew) {
    eventType = "eapp.created";
  } else if (payload.is_completed && !existing.is_completed) {
    eventType = "eapp.completed";
  }

  // Detect step changes
  const stepChanged = existing !== null && existing.step !== payload.step;
  const fromStep = existing?.step;
  const toStep = payload.step;

  const completedNow = existing !== null && !existing.is_completed && payload.is_completed;

  // Build new state
  const newState = eappPayloadToState(payload, existing);

  // Track step change timestamp
  // For existing leads, use updated_at from BackNine as the true last activity time.
  // For new leads from backfill, use payload.updated_at (original BackNine timestamp)
  // so abandonment detection works correctly.
  if (stepChanged || isNew) {
    // Prefer the original updated_at from the payload for backfill accuracy
    newState.last_step_at = payload.updated_at ?? now;
  } else {
    newState.last_step_at = existing?.last_step_at ?? payload.updated_at ?? null;
  }

  const stateChanged = !existing || JSON.stringify(existing) !== JSON.stringify(newState);

  // Update step progress event type
  if (stepChanged && !completedNow) {
    eventType = "eapp.step_progress";
  }

  // Write state to KV
  await kv.set(`eapp:state:${eappId}`, newState);
  await kv.set(`eapp:lasthash:${eappId}`, payloadHash);

  // Append to event log
  const eventEntry: EventLogEntry = {
    timestamp: now,
    source: "eapp",
    event: eventType,
    id: payload.id,
    payload_hash: payloadHash,
    details: {
      step: payload.step,
      named_step: payload.named_step,
      is_completed: payload.is_completed,
      status: payload.status ?? payload.edited_status,
      insured: payload.insured?.name,
      premium: payload.premium,
      benefit_amount: payload.benefit_amount,
      product: payload.product?.name,
      carrier: payload.product?.carrier?.name,
      ...(stepChanged ? { from_step: fromStep, to_step: toStep } : {}),
    },
  };
  await kv.rpush(`eapp:events:${eappId}`, eventEntry);

  // Update lead queue (sorted set by last_event_at for dashboard)
  await kv.zadd("leads:queue", {
    score: Date.now(),
    member: eappId,
  });

  return {
    eventType,
    isNew,
    stepChanged,
    fromStep: stepChanged ? fromStep : undefined,
    toStep: stepChanged ? toStep : undefined,
    completedNow: !!completedNow,
    stateChanged,
    state: newState,
    deduped: false,
  };
}

// ---------------------------------------------------------------------------
// Check for abandoned eApps (called periodically or on webhook)
// ---------------------------------------------------------------------------

export async function checkEAppAbandonment(eappId: string): Promise<boolean> {
  const state: EAppState | null = await kv.get<EAppState>(`eapp:state:${eappId}`);
  if (!state || state.is_completed || state.status === "completed") return false;

  const lastStepTime = state.last_step_at ?? state.first_seen_at;
  if (!lastStepTime) return false;

  const hoursSinceLastStep =
    (Date.now() - new Date(lastStepTime).getTime()) / (1000 * 60 * 60);

  // Only mark as abandoned if:
  // 1. More than ABANDONMENT_THRESHOLD_HOURS since last step change
  // 2. Not already marked abandoned
  // 3. Had at least some progress (step > 0)
  if (
    hoursSinceLastStep >= ABANDONMENT_THRESHOLD_HOURS &&
    state.status !== "abandoned" &&
    state.step > 0
  ) {
    state.status = "abandoned";
    await kv.set(`eapp:state:${eappId}`, state);

    // Log the abandonment event
    const eventEntry: EventLogEntry = {
      timestamp: new Date().toISOString(),
      source: "eapp",
      event: "eapp.abandoned",
      id: parseInt(eappId, 10),
      payload_hash: "",
      details: {
        hours_since_last_step: Math.round(hoursSinceLastStep * 10) / 10,
        last_step: state.step,
        insured: state.insured_name,
      },
    };
    await kv.rpush(`eapp:events:${eappId}`, eventEntry);

    // Add to abandoned set (sorted by abandon time for follow-up priority)
    await kv.zadd("leads:abandoned", {
      score: Date.now(),
      member: eappId,
    });

    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Process Case webhook event
// ---------------------------------------------------------------------------

export interface CaseProcessResult {
  eventType: string;
  isNew: boolean;
  statusChanged: boolean;
  fromStatus?: string;
  toStatus?: string;
  state: CaseState;
  stateChanged: boolean;
  deduped: boolean;
}

export async function processCaseEvent(payload: CasePayload): Promise<CaseProcessResult> {
  const now = new Date().toISOString();
  const payloadHash = hashPayload(payload as Record<string, unknown>);
  const caseId = String(payload.id);

  const existing: CaseState | null = await kv.get<CaseState>(`case:state:${caseId}`);
  const lastHash: string | null = await kv.get<string>(`case:lasthash:${caseId}`);

  // Dedup
  if (lastHash === payloadHash && existing) {
    return {
      eventType: "case.deduped",
      isNew: false,
      statusChanged: false,
      state: existing,
      stateChanged: false,
      deduped: true,
    };
  }

  const isNew = !existing;
  const statusChanged = existing !== null && existing.status !== payload.status;

  let eventType = "case.updated";
  if (isNew) {
    eventType = "case.created";
  } else if (statusChanged) {
    eventType = "case.status_change";
  }

  const newState: CaseState = {
    id: payload.id,
    status: payload.status ?? existing?.status ?? "Unknown",
    policy_number: payload.policy_number ?? existing?.policy_number ?? null,
    product_name: payload.product?.name ?? existing?.product_name ?? null,
    carrier_name: payload.product?.carrier?.name ?? existing?.carrier_name ?? null,
    insured_name: payload.insured?.name ?? existing?.insured_name ?? null,
    premium: payload.premium ?? existing?.premium ?? null,
    face_amount: payload.face_amount ?? existing?.face_amount ?? null,
    first_seen_at: existing?.first_seen_at ?? now,
    last_event_at: now,
    event_count: (existing?.event_count ?? 0) + 1,
  };

  const stateChanged = !existing || JSON.stringify(existing) !== JSON.stringify(newState);

  await kv.set(`case:state:${caseId}`, newState);
  await kv.set(`case:lasthash:${caseId}`, payloadHash);

  // Append to event log
  const eventEntry: EventLogEntry = {
    timestamp: now,
    source: "case",
    event: eventType,
    id: payload.id,
    payload_hash: payloadHash,
    details: {
      status: payload.status,
      policy_number: payload.policy_number,
      insured: payload.insured?.name,
      product: payload.product?.name,
      ...(statusChanged ? { from_status: existing?.status, to_status: payload.status } : {}),
    },
  };
  await kv.rpush(`case:events:${caseId}`, eventEntry);

  return {
    eventType,
    isNew,
    statusChanged,
    fromStatus: statusChanged ? existing?.status : undefined,
    toStatus: statusChanged ? payload.status : undefined,
    state: newState,
    stateChanged,
    deduped: false,
  };
}

// ---------------------------------------------------------------------------
// Scan all eApps for abandonment (call periodically, e.g., from a cron or GET endpoint)
// ---------------------------------------------------------------------------

export async function scanForAbandonedEApps(): Promise<string[]> {
  const leadIds = await kv.zrange("leads:queue", 0, -1);
  const abandoned: string[] = [];

  for (const id of leadIds) {
    const eappId = String(id);
    const wasAbandoned = await checkEAppAbandonment(eappId);
    if (wasAbandoned) {
      abandoned.push(eappId);
    }
  }

  return abandoned;
}

// ---------------------------------------------------------------------------
// Read endpoints for dashboard
// ---------------------------------------------------------------------------

export async function getAllEAppStates(): Promise<Record<string, EAppState>> {
  const leadIds = await kv.zrange("leads:queue", 0, -1);
  const states: Record<string, EAppState> = {};

  for (const id of leadIds) {
    const state = await kv.get<EAppState>(`eapp:state:${id}`);
    if (state) {
      states[String(id)] = state;
    }
  }

  return states;
}

export async function getEAppEvents(eappId: string): Promise<EventLogEntry[]> {
  return await kv.lrange<EventLogEntry>(`eapp:events:${eappId}`, 0, -1);
}

export async function getAllCaseStates(): Promise<Record<string, CaseState>> {
  // Cases don't have a sorted set yet, so we'll iterate known IDs from events
  // For now, return empty — cases track state but don't have a unified queue
  return {};
}

export async function getCaseEvents(caseId: string): Promise<EventLogEntry[]> {
  return await kv.lrange<EventLogEntry>(`case:events:${caseId}`, 0, -1);
}

export async function getAbandonedLeads(): Promise<string[]> {
  return (await kv.zrange("leads:abandoned", 0, -1)).map(String);
}