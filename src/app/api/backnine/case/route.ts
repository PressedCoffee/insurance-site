import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/backnine/auth";
import {
  processCaseEvent,
  getAllCaseStates,
  getCaseEvents,
} from "@/lib/backnine/events";
import type { CasePayload } from "@/lib/backnine/types";

const BACKNINE_CASE_SECRET = process.env.BACKNINE_CASE_WEBHOOK_SECRET ?? "";

export async function POST(request: NextRequest) {
  // BackNine BOSS sends webhook auth via X-BACKNINE-AUTHENTICATION header
  const authHeader = request.headers.get("x-backnine-authentication") ?? "";
  const authFallback = request.headers.get("authorization") ?? "";

  if (!BACKNINE_CASE_SECRET) {
    console.error("[backnine/case] BACKNINE_CASE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server misconfiguration: webhook secret not set" },
      { status: 500 }
    );
  }
  if (authHeader !== BACKNINE_CASE_SECRET && authFallback !== BACKNINE_CASE_SECRET) {
    console.warn("[backnine/case] Authentication failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CasePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing case id" }, { status: 400 });
  }

  const result = await processCaseEvent(payload);

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source: "backnine-case-webhook",
      event: result.eventType,
      case_id: payload.id,
      insured: payload.insured?.name ?? "unknown",
      status: payload.status,
      isNew: result.isNew,
      stateStatus: result.state.status,
    })
  );

  return NextResponse.json({
    ok: true,
    event: result.eventType,
    case_id: payload.id,
    state: result.state.status,
  });
}

export async function GET(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("case_id");

  if (caseId) {
    const events = await getCaseEvents(caseId);
    return NextResponse.json({ case_id: caseId, events });
  }

  const states = await getAllCaseStates();
  return NextResponse.json({
    count: Object.keys(states).length,
    cases: states,
  });
}