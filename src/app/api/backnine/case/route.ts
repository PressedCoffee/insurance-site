import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// BackNine Case Webhook
// POST /api/backnine/case
//
// Receives case lifecycle events from BackNine BOSS:
//   - Case created
//   - Case status changes (Underwriting, Approved, Issued, etc.)
//   - Policy details updated
//   - Commission changes
//
// Validates via X-BACKNINE-AUTHENTICATION header.
// Logs every event. Writes state alongside eApp data.
// ---------------------------------------------------------------------------

const BACKNINE_WEBHOOK_SECRET = process.env.BACKNINE_CASE_WEBHOOK_SECRET ?? "";

interface CasePayload {
  id: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  policy_number?: string | null;
  product?: {
    id: number;
    name: string;
    carrier?: { id: number; name: string };
  };
  insured?: {
    id: number;
    name: string;
  };
  agent?: {
    id: number;
    name: string;
  };
  premium?: number;
  face_amount?: number;
  [key: string]: unknown;
}

const STATE_DIR = "/tmp/backnine-state";
const CASE_STATE_FILE = `${STATE_DIR}/cases.json`;

function readCaseState(): Record<string, CasePayload> {
  try {
    const fs = require("fs");
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    if (!fs.existsSync(CASE_STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CASE_STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeCaseState(state: Record<string, CasePayload>): void {
  try {
    const fs = require("fs");
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(CASE_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("[backnine/case] Failed to write state:", err);
  }
}

function logEvent(event: string, payload: CasePayload, meta?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: "backnine-case-webhook",
    event,
    case_id: payload.id,
    insured: payload.insured?.name ?? "unknown",
    status: payload.status,
    product: payload.product?.name,
    carrier: payload.product?.carrier?.name,
    policy_number: payload.policy_number,
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
    console.error("[backnine/case] BACKNINE_CASE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server misconfiguration: webhook secret not set" },
      { status: 500 }
    );
  }
  if (authHeader !== BACKNINE_WEBHOOK_SECRET) {
    console.warn("[backnine/case] Authentication failed", {
      provided: authHeader?.slice(0, 8) + "...",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // -----------------------------------------------------------------------
  // 2. Parse payload
  // -----------------------------------------------------------------------
  let payload: CasePayload;
  try {
    payload = await request.json();
  } catch {
    console.warn("[backnine/case] Invalid JSON payload");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing case id" }, { status: 400 });
  }

  // -----------------------------------------------------------------------
  // 3. Determine event type
  // -----------------------------------------------------------------------
  let eventType = "case.updated";
  // Detect new vs updated by checking state
  const state = readCaseState();
  const isNew = !state[String(payload.id)];
  if (isNew) {
    eventType = "case.created";
  }

  // -----------------------------------------------------------------------
  // 4. Log the event
  // -----------------------------------------------------------------------
  logEvent(eventType, payload);

  // -----------------------------------------------------------------------
  // 5. Update state
  // -----------------------------------------------------------------------
  const prevRecord = state[String(payload.id)];
  const statusChanged = prevRecord && prevRecord.status !== payload.status;

  state[String(payload.id)] = {
    ...prevRecord,
    ...payload,
    _lastWebhookAt: new Date().toISOString(),
    _eventType: eventType,
  };
  writeCaseState(state);

  if (statusChanged) {
    logEvent("case.status_change", payload, {
      fromStatus: prevRecord?.status,
      toStatus: payload.status,
    });
  }

  // -----------------------------------------------------------------------
  // 6. Respond
  // -----------------------------------------------------------------------
  return NextResponse.json({
    ok: true,
    event: eventType,
    case_id: payload.id,
  });
}

// ---------------------------------------------------------------------------
// GET — health check / test verification
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verify = searchParams.get("verify");

  if (verify) {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/backnine/case",
      timestamp: new Date().toISOString(),
      secret_configured: !!BACKNINE_WEBHOOK_SECRET,
    });
  }

  const authHeader = request.headers.get("x-backnine-authentication");
  if (authHeader !== BACKNINE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = readCaseState();
  return NextResponse.json({
    count: Object.keys(state).length,
    cases: state,
  });
}