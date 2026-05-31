import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Vapi Webhook]', JSON.stringify(body, null, 2));
    
    // Vapi sends function calls here when server tools are triggered.
    // Stub: return 200 so the assistant doesn't hang.
    // TODO: Wire up send_onboarding_packet when ready.
    return NextResponse.json({ success: true, message: 'Received' });
  } catch (e) {
    console.error('[Vapi Webhook] Error:', e);
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 200 });
  }
}
