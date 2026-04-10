import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// BackNine Electronic Application Webhook
// POST /api/backnine/eapp
//
// Receives eApp lifecycle events from BackNine BOSS:
//   - Application created
//   - Step progress (e.g., "Address - 25% Complete")
//   - Application completed/submitted
//   - Any data change on the eApp
//
// Validates via X-BACKNINE-AUTHENTICATION header.
// Logs every event. Writes state to /api/backnine/_state for dashboard use.
// ---------------------------------------------------------------------------

const BACKNINE_WEBHOOK_SECRET = process.env.BACKNINE_EAPP_WEBHOOK_SECRET ?? "";

interface EAppPayload {
  id: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  is_completed?: boolean;
  step?: number;
  named_step?: string;
  step_display_name?: string;
  premium?: number;
  benefit_amount?: number;
  pay_duration?: number;
  mode?: number;
  edited_status?: string;
  lead_status?: string | null;
  follow_up_at?: string | null;
  completed_at?: string | null;
  refer?: boolean;
  product?: {
    id: number;
    name: string;
    category?: string;
    carrier?: { id: number; name: string };
  };
  insured?: {
    id: number;
    name: string;
    phone_mobile?: string | null;
    email?: string | null;
  };
  agent?: {
    id: number;
    name: string;
  };
  apply_link?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Simple file-backed state store (Vercel /tmp — ephemeral per cold start,
// but sufficient for webhook validation flow; will migrate to KV later)
// ---------------------------------------------------------------------------
const STATE_DIR = "/tmp/backnine-state";
const EAPP_STATE_FILE = `${STATE_DIR}/eapps.json`;

function readEAppState(): Record<string, EAppPayload> {
  try {
    const fs = require("fs");
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    if (!fs.existsSync(EAPP_STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(EAPP_STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeEAppState(state: Record<string, EAppPayload>): void {
  try {
    const fs = require("fs");
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(EAPP_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("[backnine/eapp] Failed to write state:", err);
  }
}

// ---------------------------------------------------------------------------
// Log entry — structured for Vercel log drain / Axiom / etc.
// ---------------------------------------------------------------------------
function logEvent(event: string, payload: EAppPayload, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: "backnine-eapp-webhook",
    event,
    eapp_id: payload.id,
    insured: payload.insured?.name ?? "unknown",
    step: payload.step_display_name ?? payload.named_step ?? payload.step,
    status: payload.edited_status ?? payload.status,
    is_completed: payload.is_completed,
    product: payload.product?.name,
    carrier: payload.product?.carrier?.name,
    benefit: payload.benefit_amount,
    premium: payload.premium,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

export async function POST(request: NextRequest) {
  // -----------------------------------------------------------------------
  // 1. Validate authentication
  // -----------------------------------------------------------------------
  const authHeader = request.headers.get("x-backnine-authentication");
  if (!BACKNINE_WEBHOOK_SECRET) {
    console.error("[backnine/eapp] BACKNINE_EAPP_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server misconfiguration: webhook secret not set" },
      { status: 500 }
    );
  }
  if (authHeader !== BACKNINE_WEBHOOK_SECRET) {
    console.warn("[backnine/eapp] Authentication failed", {
      provided: authHeader?.slice(0, 8) + "...",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // -----------------------------------------------------------------------
  // 2. Parse payload
  // -----------------------------------------------------------------------
  let payload: EAppPayload;
  try {
    payload = await request.json();
  } catch {
    console.warn("[backnine/eapp] Invalid JSON payload");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing eApp id" }, { status: 400 });
  }

  // -----------------------------------------------------------------------
  // 3. Determine event type
  // -----------------------------------------------------------------------
  let eventType = "eapp.updated";
  if (payload.is_completed) {
    eventType = "eapp.completed";
  } else if (payload.step === 1 || payload.step === -5) {
    // step -5 = "Hearts Step" (first step in BackNine flow)
    // step 1 = first named step
    eventType = "eapp.created";
  }

  // -----------------------------------------------------------------------
  // 4. Log the event
  // -----------------------------------------------------------------------
  logEvent(eventType, payload);

  // -----------------------------------------------------------------------
  // 5. Update state
  // -----------------------------------------------------------------------
  const state = readEAppState();
  const prevRecord = state[String(payload.id)];
  const isNew = !prevRecord;
  const stepChanged = prevRecord && prevRecord.step !== payload.step;
  const completedNow = !prevRecord?.is_completed && payload.is_completed;

  state[String(payload.id)] = {
    ...prevRecord,
    ...payload,
    _lastWebhookAt: new Date().toISOString(),
    _eventType: eventType,
  };
  writeEAppState(state);

  // -----------------------------------------------------------------------
  // 6. Trigger side effects (abandoned app recovery, notifications, etc.)
  //    For now — log and return. Follow-up automation hooks go here.
  // -----------------------------------------------------------------------
  if (completedNow) {
    logEvent("eapp.completion_detected", payload, { previousStep: prevRecord?.step });
  }
  if (stepChanged) {
    logEvent("eapp.step_progress", payload, {
      fromStep: prevRecord?.step,
      toStep: payload.step,
    });
  }
  if (isNew) {
    logEvent("eapp.new_lead", payload);
  }

  // -----------------------------------------------------------------------
  // 7. Respond — BackNine expects 200 OK to confirm delivery
  // -----------------------------------------------------------------------
  return NextResponse.json({
    ok: true,
    event: eventType,
    eapp_id: payload.id,
  });
}

// ---------------------------------------------------------------------------
// GET — health check / test verification
// Call with ?verify=1 to confirm the endpoint is alive without triggering state
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verify = searchParams.get("verify");

  if (verify) {
    // Lightweight health check — no auth required
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/backnine/eapp",
      timestamp: new Date().toISOString(),
      secret_configured: !!BACKNINE_WEBHOOK_SECRET,
    });
  }

  // Authenticated read — return current eApp state
  const authHeader = request.headers.get("x-backnine-authentication");
  if (authHeader !== BACKNINE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = readEAppState();
  return NextResponse.json({
    count: Object.keys(state).length,
    eapps: state,
  });
}