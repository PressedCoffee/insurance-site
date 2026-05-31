import { NextRequest, NextResponse } from "next/server";
import {
  processEAppEvent,
  getAllEAppStates,
  getEAppEvents,
  scanForAbandonedEApps,
  getAbandonedLeads,
} from "@/lib/backnine/events";
import { authenticateRequest } from "@/lib/backnine/auth";
import type { EAppPayload } from "@/lib/backnine/types";

// ---------------------------------------------------------------------------
// GET /api/backnine/test — Integration test for KV persistence + auth
// Auth-protected. Self-cleaning.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testResults: Record<string, unknown> = {};

  try {
    const testPayload: EAppPayload = {
      id: 999999,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "Quote",
      edited_status: "Quote",
      is_completed: false,
      step: 10,
      named_step: "Health Step - 10% Complete",
      step_display_name: "Health Questions",
      next_step: "Continue eApplication",
      insured: {
        id: 999999,
        name: "Test Insured",
        first_name: "Test",
        last_name: "Insured",
        email: "test@example.com",
        phone_mobile: "555-0100",
      },
      product: {
        id: 100,
        name: "OPTerm-20 Banner",
        carrier: { id: 1, name: "Banner Life" },
      },
      benefit_amount: 500000,
      premium: 123.45,
      apply_link: "https://app.back9ins.com/apply/Test?eapp_id=999999",
      agents_npn: 22165498,
      metadata: null,
    };

    const result1 = await processEAppEvent(testPayload);
    testResults["step1_new_eapp"] = {
      eventType: result1.eventType,
      isNew: result1.isNew,
      stepChanged: result1.stepChanged,
      completedNow: result1.completedNow,
      state: result1.state,
    };

    const result2 = await processEAppEvent(testPayload);
    testResults["step2_dedup"] = {
      deduped: result2.deduped,
    };

    const updatedPayload = {
      ...testPayload,
      step: 50,
      named_step: "Payment Step - 50% Complete",
      step_display_name: "Payment",
      updated_at: new Date(Date.now() + 60000).toISOString(),
    };
    const result3 = await processEAppEvent(updatedPayload);
    testResults["step3_step_change"] = {
      eventType: result3.eventType,
      stepChanged: result3.stepChanged,
      fromStep: result3.fromStep,
      toStep: result3.toStep,
      state: result3.state,
    };

    const completedPayload = {
      ...testPayload,
      is_completed: true,
      status: "Submitted",
      edited_status: "Submitted",
      step: 100,
      named_step: "Completed",
      updated_at: new Date(Date.now() + 120000).toISOString(),
    };
    const result4 = await processEAppEvent(completedPayload);
    testResults["step4_completed"] = {
      eventType: result4.eventType,
      completedNow: result4.completedNow,
      state: result4.state,
    };

    const allStates = await getAllEAppStates();
    testResults["step5_all_states"] = {
      count: Object.keys(allStates).length,
      states: allStates,
    };

    const events = await getEAppEvents("999999");
    testResults["step6_event_log"] = {
      count: events.length,
      events: events,
    };

    const abandoned = await getAbandonedLeads();
    testResults["step7_abandoned"] = abandoned;

    const newlyAbandoned = await scanForAbandonedEApps();
    testResults["step8_newly_abandoned"] = newlyAbandoned;

    const { kv } = await import("@/lib/backnine/kv");
    await kv.del(`eapp:state:999999`);
    await kv.del(`eapp:events:999999`);
    await kv.del(`eapp:lasthash:999999`);
    await kv.zrem("leads:queue", "999999");
    await kv.zrem("leads:completed", "999999");
    await kv.zrem("leads:abandoned", "999999");
    testResults["step9_cleanup"] = "done";

    return NextResponse.json({
      status: "success",
      test_timestamp: new Date().toISOString(),
      results: testResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        partial_results: testResults,
      },
      { status: 500 }
    );
  }
}