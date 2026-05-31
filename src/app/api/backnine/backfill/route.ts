import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/backnine/auth";
import { backfillEApps } from "@/lib/backnine/backfill";

export async function POST(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await backfillEApps();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[backnine/backfill] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for easy curl testing
export async function GET(request: NextRequest) {
  return POST(request);
}