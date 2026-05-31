import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: 'shaddock@rostineinsurance.com',
    pass: process.env.SMTP_PASS || '',
  },
};

function buildSubject(agencyName: string): string {
  return `Your Life Desk referral link is ready — ${agencyName}`;
}

function buildPlainTextBody(params: any, referralUrl: string): string {
  return `Hello ${params.principal_name},

As promised during our call, here is everything you need to start sending your life insurance overflow to Ryan Rostine at Independent Insurance Advisor.

═══════════════════════════════════════════
YOUR REFERRAL LINK
${referralUrl}

This link is unique to your agency (${params.agency_name}). Share it with clients who ask about life insurance and Ryan will handle the rest.
═══════════════════════════════════════════

HOW THE LIFE DESK WORKS

1. What happens when you send a client to the Life Desk?
You provide the client with your unique referral link. The client schedules directly with Ryan Rostine, California-licensed Life & Health agent. Ryan handles the quote, application, and servicing. You do not need to learn new products or handle paperwork.

2. What do you need to do?
Just share the link. The Life Desk handles everything from first call to policy delivery.

3. Can you change your mind?
Absolutely. You can pause or stop sending referrals at any time with one email.

4. What if the client has a problem?
Ryan handles all service and support. Direct questions to him at (661) 220-0928.

═══════════════════════════════════════════

RYAN'S DIRECT CONTACT

Ryan Rostine — California Licensed Life & Health Agent (#4479678)
Phone: (661) 220-0928
Email: shaddock@rostineinsurance.com
Website: https://rostineinsurance.com

═══════════════════════════════════════════

No insurance is being sold, quoted, or solicited. This is a personal, private, preference-based introduction. You can unsubscribe at any time by replying STOP and we will remove you.

—
Independent Insurance Advisor
Ryan Rostine, California License #4479678
rostineinsurance.com
`;
}

function buildHtmlBody(params: any, referralUrl: string): string {
  const subject = buildSubject(params.agency_name);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/>
  <style>
    body{font-family:Arial,sans-serif;color:#333;line-height:1.5;max-width:560px;margin:0 auto;padding:24px}
    .accent{background:#2b6cb0;color:#fff;padding:12px 16px;border-radius:6px;display:inline-block;margin:6px 0}
    .grey{background:#f7fafc;padding:14px 16px;border-radius:6px;margin:12px 0}
  </style>
</head>
<body>
  <h2>Your Life Desk referral link is ready</h2>
  <p>Hello ${params.principal_name},</p>
  <p>As promised during our call, here is everything you need to start sending your life insurance overflow to Ryan Rostine.</p>

  <div class="accent">
    <strong>YOUR REFERRAL LINK</strong><br/>
    <a href="https://${referralUrl}" style="color:#fff;text-decoration:underline">${referralUrl}</a>
  </div>

  <p>This link is unique to <strong>${params.agency_name}</strong>. Share it with clients who ask about life insurance and Ryan will handle the rest.</p>

  <div class="grey">
    <strong>How the Life Desk Works</strong><br/>
    • You share the link with a client.<br/>
    • The client schedules with Ryan directly.<br/>
    • Ryan handles quotes, applications, and servicing.<br/>
    • You don’t need to learn new products or handle paperwork.
  </div>

  <p><strong>Is this exclusive?</strong> No. You may continue any existing referral relationships. This is additive, not exclusive.</p>
  <p><strong>Can you change your mind?</strong> Yes. Pause or stop sending referrals at any time.</p>
  <p><strong>Do you need a license or appointment?</strong> No. You are not selling insurance — you are referring to a licensed agent.</p>

  <div class="grey">
    <strong>Ryan’s Direct Contact</strong><br/>
    Ryan Rostine — California Licensed Life &amp; Health Agent (#4479678)<br/>
    📞 (661) 220-0928<br/>
    ✉ shaddock@rostineinsurance.com<br/>
    🌐 https://rostineinsurance.com
  </div>

  <p><em>No insurance is being sold, quoted, or solicited. This is a personal, private, preference-based introduction. Reply STOP to unsubscribe.</em></p>

  <p>—<br/>
  Independent Insurance Advisor<br/>
  Ryan Rostine, California License #4479678<br/>
  rostineinsurance.com</p>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Vapi Webhook]', JSON.stringify(body, null, 2));

    // Detect tool-call payloads from Vapi
    const message = body.message;
    const toolCalls = message?.toolCalls || message?.toolCallList || [];
    const toolCall = toolCalls[0] || body.toolCall || body.tool || null;

    if (toolCall && toolCall.function?.name === 'send_onboarding_packet') {
      const params = toolCall.function.arguments || toolCall.arguments || {};
      const agencyName = params.agency_name || params.agencyName || 'Your Agency';
      const referralUrl = `https://rostineinsurance.com/for-partners?utm_source=${encodeURIComponent(agencyName.toLowerCase().replace(/[^a-z0-9]/g, '-'))}&utm_medium=referral`;

      const plain = buildPlainTextBody(params, referralUrl);
      const html = buildHtmlBody(params, referralUrl);

      const transporter = nodemailer.createTransport(smtpConfig);
      const info = await transporter.sendMail({
        from: 'shaddock@rostineinsurance.com',
        to: params.email_address || params.emailAddress,
        replyTo: 'shaddock@rostineinsurance.com',
        subject: buildSubject(agencyName),
        text: plain,
        html,
      });

      return NextResponse.json({ success: true, messageId: info.messageId });
    }

    return NextResponse.json({ success: true, message: 'Received' });
  } catch (e: any) {
    console.error('[Vapi Webhook] Error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Bad request' }, { status: 200 });
  }
}
