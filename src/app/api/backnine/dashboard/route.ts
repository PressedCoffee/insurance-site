import { NextRequest, NextResponse } from "next/server";
import {
  getAllEAppStates,
  getEAppEvents,
  scanForAbandonedEApps,
  getAbandonedLeads,
} from "@/lib/backnine/events";

// ---------------------------------------------------------------------------
// GET /api/backnine/dashboard
//
// Auth-protected admin endpoint that returns the full lead dashboard:
//   - All eApp states (sorted by last_event_at desc)
//   - Abandoned leads
//   - Summary stats
//
// Query params:
//   ?abandoned=1     — also scan for new abandonments
//   ?eapp_id=X       — return events for a specific eApp
// ---------------------------------------------------------------------------

const BACKNINE_EAPP_SECRET = process.env.BACKNINE_EAPP_WEBHOOK_SECRET ?? "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Auth check — accept either webhook secret
  const authHeader = request.headers.get("x-backnine-authentication") ?? "";
  if (!BACKNINE_EAPP_SECRET || authHeader !== BACKNINE_EAPP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eappId = searchParams.get("eapp_id");
  const shouldScanAbandoned = searchParams.get("abandoned") === "1";

  // Return events for a specific eApp
  if (eappId) {
    const events = await getEAppEvents(eappId);
    return NextResponse.json({ eapp_id: eappId, event_count: events.length, events });
  }

  // Optionally scan for abandoned eApps
  let newlyAbandoned: string[] = [];
  if (shouldScanAbandoned) {
    newlyAbandoned = await scanForAbandonedEApps();
  }

  // Get all states
  const states = await getAllEAppStates();
  const abandonedIds = await getAbandonedLeads();

  // Sort by last_event_at descending
  const sorted = Object.values(states).sort(
    (a, b) => new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime()
  );

  // Compute summary stats
  const stats = {
    total: sorted.length,
    created: sorted.filter((s) => s.status === "created").length,
    in_progress: sorted.filter((s) => s.status === "in_progress").length,
    abandoned: sorted.filter((s) => s.status === "abandoned").length,
    completed: sorted.filter((s) => s.status === "completed").length,
  };

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    stats,
    newly_abandoned: newlyAbandoned,
    all_abandoned_ids: abandonedIds,
    leads: sorted,
  });
}