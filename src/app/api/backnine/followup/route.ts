import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/backnine/auth";
import {
  processAbandonedFollowUps,
  getAllFollowUpStates,
  getDryRunLog,
  setManualContact,
  testCadenceSequence,
} from "@/lib/backnine/followup";

export async function GET(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const verify = searchParams.get("verify");
  const history = searchParams.get("history");
  const dryrunLog = searchParams.get("dryrun_log");
  const live = searchParams.get("live");

  if (verify) {
    return NextResponse.json({
      status: "ok",
      endpoint: "/api/backnine/followup",
      mode: live ? "LIVE" : "DRY_RUN",
      live_env_var: process.env.BACKNINE_FOLLOWUP_LIVE === "true" ? "SET" : "NOT_SET",
      timestamp: new Date().toISOString(),
    });
  }

  // ?history=1 — return current follow-up states without running cycle
  if (history) {
    const states = await getAllFollowUpStates();
    return NextResponse.json({
      followup_states: states,
      count: Object.keys(states).length,
      timestamp: new Date().toISOString(),
    });
  }

  // ?dryrun_log=1 — return the dry-run log without running cycle
  if (dryrunLog) {
    const log = await getDryRunLog();
    return NextResponse.json({
      dry_run_log: log,
      timestamp: new Date().toISOString(),
    });
  }

  // Run the follow-up cycle
  // When BACKNINE_FOLLOWUP_LIVE=true, cron runs in LIVE mode. ?dry=1 forces dry-run.
  const dryOverride = searchParams.get("dry") === "1";
  const liveParam = searchParams.get("live") === "1";
  const shouldRunLive = (liveParam || process.env.BACKNINE_FOLLOWUP_LIVE === "true") && !dryOverride;
  const dryRun = !shouldRunLive;

  try {
    const result = await processAbandonedFollowUps(dryRun);

    return NextResponse.json({
      mode: shouldRunLive ? "LIVE" : "DRY_RUN",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[backnine/followup] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST: register manual contact suppression, or run cycle
export async function POST(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Register manual contact for a lead
    if (body.eapp_id && body.action === "manual_contact") {
      const followUp = await setManualContact(body.eapp_id, {
        smsSent: body.sms_sent ?? false,
        emailSent: body.email_sent ?? false,
        cooldownHours: body.cooldown_hours,
      });
      return NextResponse.json({
        status: "manual_contact_registered",
        followup: followUp,
        timestamp: new Date().toISOString(),
      });
    }

    // Cadence verification test — stages synthetic lead, walks T1→T2→T3→exhausted
    // Only available when BACKNINE_TEST_MODE is set (not for production use)
    if (body.action === "test_cadence") {
      if (process.env.BACKNINE_TEST_MODE !== "enabled") {
        return NextResponse.json(
          { error: "Test mode not enabled. Set BACKNINE_TEST_MODE=enabled to use test_cadence." },
          { status: 403 }
        );
      }
      const result = await testCadenceSequence();
      return NextResponse.json({
        status: "cadence_test_complete",
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback: run follow-up cycle
    return GET(request);
  } catch {
    // If no valid JSON body, just run the cycle
    return GET(request);
  }
}