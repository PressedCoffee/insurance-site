import { NextRequest, NextResponse } from "next/server";
import {
  processEAppEvent,
  checkEAppAbandonment,
  getAllEAppStates,
  getEAppEvents,
  scanForAbandonedEApps,
  getAbandonedLeads,
} from "@/lib/backnine/events";
import { authenticateRequest } from "@/lib/backnine/auth";
import type { EAppPayload } from "@/lib/backnine/types";

const BACKNINE_WEBHOOK_SECRET = process.env.BACKNINE_EAPP_WEBHOOK_SECRET ?? "";

export async function POST(request: NextRequest) {
  // BackNine BOSS sends webhook auth via X-BACKNINE-AUTHENTICATION header
  const authHeader = request.headers.get("x-backnine-authentication") ?? "";
  const authFallback = request.headers.get("authorization") ?? "";

  if (!BACKNINE_WEBHOOK_SECRET) {
    console.error("[backnine/eapp] BACKNINE_EAPP_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server misconfiguration: webhook secret not set" },
      { status: 500 }
    );
  }
  if (authHeader !== BACKNINE_WEBHOOK_SECRET && authFallback !== BACKNINE_WEBHOOK_SECRET) {
    console.warn("[backnine/eapp] Authentication failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: EAppPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing eApp id" }, { status: 400 });
  }

  const result = await processEAppEvent(payload);

  if (result.deduped) {
    return NextResponse.json({
      ok: true,
      event: "eapp.deduped",
      eapp_id: payload.id,
      message: "Duplicate event, no state change",
    });
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source: "backnine-eapp-webhook",
      event: result.eventType,
      eapp_id: payload.id,
      insured: payload.insured?.name ?? "unknown",
      step: payload.step_display_name ?? payload.named_step ?? payload.step,
      status: payload.edited_status ?? payload.status,
      is_completed: payload.is_completed,
      product: payload.product?.name,
      carrier: payload.product?.carrier?.name,
      isNew: result.isNew,
      stepChanged: result.stepChanged,
      stateStatus: result.state.status,
    })
  );

  if (!payload.is_completed) {
    await checkEAppAbandonment(String(payload.id));
  }

  return NextResponse.json({
    ok: true,
    event: result.eventType,
    eapp_id: payload.id,
    state: result.state.status,
    ...(result.stepChanged ? { from_step: result.fromStep, to_step: result.toStep } : {}),
    ...(result.completedNow ? { completed: true } : {}),
  });
}

// GET -- health check / dashboard read / abandoned scan
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verify = searchParams.get("verify");
  const eappId = searchParams.get("eapp_id");
  const abandoned = searchParams.get("abandoned");

  if (verify) {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/backnine/eapp",
      timestamp: new Date().toISOString(),
      secret_configured: !!BACKNINE_WEBHOOK_SECRET,
    });
  }

  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (eappId) {
    const events = await getEAppEvents(eappId);
    return NextResponse.json({ eapp_id: eappId, events });
  }

  if (abandoned) {
    const justAbandoned = await scanForAbandonedEApps();
    const abandonedIds = await getAbandonedLeads();
    return NextResponse.json({
      newly_abandoned: justAbandoned,
      all_abandoned: abandonedIds,
    });
  }

  const states = await getAllEAppStates();
  return NextResponse.json({
    count: Object.keys(states).length,
    eapps: states,
  });
}