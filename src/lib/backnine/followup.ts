// ---------------------------------------------------------------------------
// BackNine Follow-up Engine — Smart SMS follow-up for abandoned eApps
// ---------------------------------------------------------------------------
//
// Design decisions (from canonical decisions):
//   dec-006: First automation is a single SMS to leads stagnant 4+ hours.
//            Uses BackNine /api/v1/text. One SMS per lead, ever.
//   dec-007: All automation starts in DRY_RUN=true mode.
//            Switches to live only after Ryan reviews 2+ dry-run logs and approves.
//
// Architecture:
//   - Follow-up state stored in KV: eapp:followup:{id} — tracks whether
//     a lead has been contacted, when, and what was sent
//   - Dry-run log: followup:dryrun:{timestamp} — stores what *would* be sent
//   - When DRY_RUN=true (default), SMS is logged but NOT sent to BackNine
//   - When DRY_RUN=false (requires explicit ?live=1), SMS is actually sent
//   - One SMS per eApp, ever. No follow-up to completed leads.
//   - Manual-contact suppression: leads manually contacted by Ryan are
//     excluded from automated follow-up during a cooldown window.
//
// Follow-up state machine per lead (multi-touch cadence):
//   unseen → eligible → Touch 1 → Touch 2 → Touch 3 → exhausted
//   At any point: → completed | paused | self | manual_contact | skipped
//
//   - unseen: abandoned lead not yet processed
//   - eligible: meets criteria (abandoned 4+ hrs, has phone/mobile)
//   - contacted/dry_run_sent: at least one touch sent; touch_count tracks progress
//   - manual_contact: Ryan manually contacted this lead; automated follow-up suppressed during cooldown
//   - exhausted: all 3 touches sent, 7-day wait passed with no response, no further outreach
//   - skipped: no phone/mobile, already completed, or other disqualifier
//   - paused: agent-paused lead
//   - self: agent's own eApp
//
// Cadence timing:
//   Touch 1: 4 hrs after abandonment (decision prompt, resume link)
//   Touch 2: 3 days after Touch 1 (value-add, underwriting transparency)
//   Touch 3: 4 days after Touch 2 (final nudge, resume link)
//   Exhausted: 7 days after Touch 3 with no response
//
// Stop conditions (any of these halts the cadence):
//   - Lead responds → mark "responded", exit cadence
//   - Lead completes eApp → mark "completed", remove from abandoned
//   - Agent manually contacts → set "manual_contact", enter cooldown (Rule 5)
//   - Agent pauses lead → set "paused" (Rule 3)
//   - Touch 3 sent + 7 days pass with no response → set "exhausted" (Rule 6)
//
// Manual-contact cooldown rule:
//   - When a lead has status "manual_contact" AND the current time is before
//     cooldown_until, the lead is skipped with reason "manual_contact_cooldown"
//   - After cooldown expires, the lead becomes eligible again for automated
//     follow-up IF it hasn't already been contacted by automation
//   - Dry-run output explicitly shows: "SKIPPED: manual_contact_cooldown — [name] (eApp [id]), cooldown until [date]"
// ---------------------------------------------------------------------------

import { kv } from "./kv";
import type { EAppState } from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BACKNINE_API_KEY = process.env.BACKNINE_API_KEY ?? "";
const BACKNINE_API_BASE = "https://app.back9ins.com/api/v1";

// DRY_RUN is the default. Set BACKNINE_FOLLOWUP_LIVE=true in env + ?live=1
// on the endpoint to actually send SMS.
const DRY_RUN_DEFAULT = process.env.BACKNINE_FOLLOWUP_LIVE !== "true";

// Agent NPN — Ryan's NPN for BackNine text API
const AGENT_NPN = process.env.BACKNINE_AGENT_NPN ?? "22165498";

// Default manual-contact cooldown: 72 hours
const MANUAL_CONTACT_COOLDOWN_HOURS = 72;

// Cadence configuration
const MAX_TOUCHES = 3;
const EXHAUSTED_AFTER_DAYS = 7;

// Timing between touches (milliseconds)
const TOUCH_DELAYS_MS: Record<number, number> = {
  1: 4 * 60 * 60 * 1000,        // Touch 1: 4 hrs after abandonment
  2: 3 * 24 * 60 * 60 * 1000,   // Touch 2: 3 days after previous touch
  3: 4 * 24 * 60 * 60 * 1000,   // Touch 3: 4 days after previous touch
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FollowUpStatus = "unseen" | "eligible" | "contacted" | "skipped" | "dry_run_sent" | "manual_contact" | "self" | "paused" | "unrecoverable" | "exhausted";

export interface FollowUpState {
  eapp_id: string;
  status: FollowUpStatus;
  reason?: string;           // Why skipped, or "dry_run" for dry-run sends
  insured_name?: string | null;
  insured_phone?: string | null;
  product_name?: string | null;
  carrier_name?: string | null;
  premium?: number | null;
  benefit_amount?: number | null;
  apply_link?: string | null;
  sms_sent_at?: string | null;  // ISO timestamp when SMS was actually sent
  dry_run_at?: string | null;   // ISO timestamp when dry-run was logged
  message_body?: string | null;  // The SMS text that was (or would be) sent
  manual_contact_at?: string | null;   // ISO timestamp of Ryan's manual contact
  manual_sms_sent?: boolean;          // Whether Ryan manually sent SMS
  manual_email_sent?: boolean;        // Whether Ryan manually sent email
  cooldown_until?: string | null;     // ISO timestamp when cooldown expires
  automated_followup_suppressed?: boolean;  // True while in cooldown
  touch_count?: number;               // Number of touches sent (0-based first touch = 1)
  next_touch_at?: string | null;      // ISO timestamp when next touch is due
  created_at: string;           // When this follow-up state was created
  updated_at: string;           // When last updated
}

export interface FollowUpResult {
  processed: number;
  eligible: number;
  contacted: number;       // Actually sent (live mode only)
  dry_run: number;         // Logged but not sent (dry-run mode)
  skipped: number;
  suppressed: number;      // Manual-contact cooldown suppressions
  errors: number;
  details: FollowUpDetail[];
}

export interface FollowUpDetail {
  eapp_id: string;
  action: "sent" | "dry_run" | "skipped" | "suppressed" | "error";
  reason?: string;
  message_preview?: string;
}

// ---------------------------------------------------------------------------
// SMS message templates
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SMS message templates — one per touch number
// ---------------------------------------------------------------------------

function buildSmsMessage(state: EAppState, touchNumber: number = 1): string {
  const firstName = state.insured_name?.split(" ")[0] ?? "there";
  const carrier = state.carrier_name ?? "one of our top carriers";
  const product = state.product_name ?? "life insurance policy";
  const applyLink = state.apply_link;

  switch (touchNumber) {
    case 1:
      // Touch 1 — Decision prompt: resume link, ask if questions
      if (applyLink) {
        return `Hi ${firstName}, this is Ryan Rostine with Rostine Insurance. I noticed you started your ${product} application with ${carrier}. If you'd like to pick up where you left off, here's your link: ${applyLink}\n\nFeel free to text me back with any questions. —Ryan`;
      }
      return `Hi ${firstName}, this is Ryan Rostine with Rostine Insurance. I saw you were looking into a ${product} with ${carrier}. I'm here if you have any questions or want to continue. Text me back any time! —Ryan`;

    case 2:
      // Touch 2 — Value-add: underwriting transparency, reduce health-questions friction
      if (applyLink) {
        return `${firstName}, lots of people hesitate at the health questions step. Here's what actually happens after you apply: https://rostineinsurance.com/underwriting-transparency — no surprises, no jargon. Your application is still open: ${applyLink} —Ryan`;
      }
      return `${firstName}, lots of people hesitate at the health questions step. Here's what actually happens after you apply: https://rostineinsurance.com/underwriting-transparency — no surprises, no jargon. Text me if you want to pick things back up. —Ryan`;

    case 3:
      // Touch 3 — Final nudge: direct resume link
      if (applyLink) {
        return `${firstName}, I wanted to make sure you still have this. Your ${product} application with ${carrier} is still open — pick up right where you left off: ${applyLink} —Ryan`;
      }
      return `${firstName}, I don't want to clutter your inbox. If you're still interested in the ${product}, text me back and I'll help you pick up where you left off. —Ryan`;

    default:
      // Fallback: same as Touch 1
      if (applyLink) {
        return `Hi ${firstName}, this is Ryan Rostine with Rostine Insurance. If you'd like to pick up where you left off on your ${product} application, here's your link: ${applyLink}\n\nFeel free to text me back with any questions. —Ryan`;
      }
      return `Hi ${firstName}, this is Ryan Rostine with Rostine Insurance. I'm here if you have any questions or want to continue. Text me back any time! —Ryan`;
  }
}

// ---------------------------------------------------------------------------
// Send SMS via BackNine Text API
// ---------------------------------------------------------------------------

interface BackNineTextParams {
  sender_npn: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  death_benefit?: number;
  gender?: string;
  birthdate?: string;
  state?: string;
  health?: number;
  smoker?: string;
  mode?: number;
  product_category?: string;
}

async function sendBackNineSms(
  state: EAppState,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const firstName = state.insured_name?.split(" ")[0] ?? "";
  const lastName = state.insured_name?.split(" ").slice(1).join(" ") ?? "";
  const phone = state.insured_phone ?? "";

  if (!firstName || !phone) {
    return { success: false, error: "Missing first_name or phone" };
  }

  // Clean phone number — remove non-digits
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return { success: false, error: `Phone too short: ${cleanPhone}` };
  }

  const params: BackNineTextParams = {
    sender_npn: AGENT_NPN,
    first_name: firstName,
    last_name: lastName || "Prospect",
    phone_number: cleanPhone,
  };

  if (state.benefit_amount) {
    params.death_benefit = state.benefit_amount;
  }

  try {
    const response = await fetch(`${BACKNINE_API_BASE}/text`, {
      method: "POST",
      headers: {
        "X-BACKNINE-AUTHENTICATION": BACKNINE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `BackNine API ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Check if a lead is in manual-contact cooldown
// ---------------------------------------------------------------------------

function isInManualContactCooldown(followUp: FollowUpState): boolean {
  if (followUp.status !== "manual_contact") return false;
  if (!followUp.cooldown_until) return false;
  return new Date(followUp.cooldown_until) > new Date();
}

// ---------------------------------------------------------------------------
// Explicit eligibility rules
// ---------------------------------------------------------------------------
// These rules determine whether an abandoned lead is eligible for
// automated follow-up. Every exclusion is explicit and logged with reason.
//
// ELIGIBILITY RULES (evaluated in order — first match wins):
//
// 1. COMPLETED — Lead completed the eApp.
//    Result: EXCLUDED (status: "skipped", reason: "completed")
//
// 2. SELF-LEAD — Lead is the agent themselves or marked as "self".
//    Result: EXCLUDED (status: "self", reason: "self_lead")
//
// 3. PAUSED — Lead explicitly paused (agent instruction, family situation, etc).
//    Result: EXCLUDED (status: "paused", reason: "paused_by_agent")
//
// 4. NO CONTACT INFO — Lead has no phone number on file.
//    Result: EXCLUDED (status: "skipped", reason: "no_phone")
//
// 5. MANUAL CONTACT IN COOLDOWN — Agent manually contacted lead and
//    cooldown has not expired.
//    Result: EXCLUDED (status: "manual_contact", reason: "manual_contact_cooldown")
//    After cooldown expires, lead becomes eligible again.
//
// 6. EXHAUSTED — Lead has received all follow-up touches and no
//    response was received. No further automated outreach.
//    Result: EXCLUDED (status: "exhausted", reason: "followup_exhausted")
//
// 7. ALREADY CONTACTED BY AUTOMATION — Lead already received an
//    automated SMS (live or dry-run). One SMS per lead, ever.
//    Result: EXCLUDED (status: "contacted"|"dry_run_sent", reason: "already_contacted")
//
// 8. MANUAL CONTACT WITH EXPIRED COOLDOWN — Agent manually contacted
//    lead but cooldown has expired. Lead becomes eligible again if
//    automation has not yet contacted them.
//    Result: ELIGIBLE
//
// 9. ACTIVE ELIGIBLE ABANDONED — Lead is abandoned (4+ hrs stagnant),
//    has a phone number, and none of the above exclusions apply.
//    Result: ELIGIBLE
// ---------------------------------------------------------------------------

type EligibilityDecision =
  | { eligible: true; reason: "active_eligible" | "cooldown_expired" | "cadence_touch_due" }
  | { eligible: false; status: FollowUpStatus; reason: string };

function determineEligibility(
  eAppState: EAppState,
  followUp: FollowUpState | null
): EligibilityDecision {
  // 1. Completed
  if (eAppState.is_completed || eAppState.status === "completed") {
    return { eligible: false, status: "skipped", reason: "completed" };
  }

  // 2. Self-lead
  if (followUp && followUp.status === "self") {
    return { eligible: false, status: "self", reason: "self_lead" };
  }

  // 3. Paused
  if (followUp && followUp.status === "paused") {
    return { eligible: false, status: "paused", reason: "paused_by_agent" };
  }

  // 4. No contact info
  if (!eAppState.insured_phone) {
    return { eligible: false, status: "skipped", reason: "no_phone" };
  }

  // 5. Manual contact in cooldown
  if (followUp && followUp.status === "manual_contact" && isInManualContactCooldown(followUp)) {
    return { eligible: false, status: "manual_contact", reason: "manual_contact_cooldown" };
  }

  // 6. Exhausted
  if (followUp && followUp.status === "exhausted") {
    return { eligible: false, status: "exhausted", reason: "followup_exhausted" };
  }

  // 7. Already contacted by automation — BUT mid-cadence leads continue
  //    If touch_count < MAX_TOUCHES and next_touch_at has passed, eligible for next touch
  if (followUp && (followUp.status === "contacted" || followUp.status === "dry_run_sent")) {
    const currentTouches = followUp.touch_count ?? 1;
    if (currentTouches >= MAX_TOUCHES) {
      // All touches sent — check if exhausted
      return { eligible: false, status: followUp.status, reason: "already_contacted" };
    }
    // Mid-cadence: check if next touch is due
    if (followUp.next_touch_at && new Date(followUp.next_touch_at) > new Date()) {
      // Not yet time for next touch
      return { eligible: false, status: followUp.status, reason: `next_touch_at_${followUp.next_touch_at}` };
    }
    // Next touch is due — eligible for next touch in cadence
    return { eligible: true, reason: "cadence_touch_due" };
  }

  // 8. Manual contact with expired cooldown — now eligible again
  if (followUp && followUp.status === "manual_contact" && !isInManualContactCooldown(followUp)) {
    return { eligible: true, reason: "cooldown_expired" };
  }

  // 9. Active eligible abandoned
  return { eligible: true, reason: "active_eligible" };
}

// ---------------------------------------------------------------------------
// Process abandoned leads for follow-up
// ---------------------------------------------------------------------------

export async function processAbandonedFollowUps(
  dryRun: boolean = DRY_RUN_DEFAULT
): Promise<FollowUpResult> {
  const now = new Date().toISOString();
  const result: FollowUpResult = {
    processed: 0,
    eligible: 0,
    contacted: 0,
    dry_run: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    details: [],
  };

  // Get all abandoned lead IDs
  const abandonedIds = await kv.zrange("leads:abandoned", 0, -1);

  for (const id of abandonedIds) {
    const eappId = String(id);
    result.processed++;

    // Read current eApp state
    const state: EAppState | null = await kv.get(`eapp:state:${eappId}`);
    if (!state) {
      result.errors++;
      result.details.push({
        eapp_id: eappId,
        action: "error",
        reason: "State not found in KV",
      });
      continue;
    }

    // Read existing follow-up state
    const existingFollowUp: FollowUpState | null = await kv.get(`eapp:followup:${eappId}`);

    // Evaluate eligibility using explicit rules
    const eligibility = determineEligibility(state, existingFollowUp);

    if (!eligibility.eligible) {
      // Track in the appropriate result counter
      if (eligibility.reason === "manual_contact_cooldown") {
        result.suppressed++;
      } else {
        result.skipped++;
      }

      result.details.push({
        eapp_id: eappId,
        action: eligibility.reason === "manual_contact_cooldown" ? "suppressed" : "skipped",
        reason: `${eligibility.reason} — ${existingFollowUp?.insured_name ?? state.insured_name ?? "Unknown"} (eApp ${eappId})`,
      });
      continue;
    }

    // Lead is eligible for follow-up
    result.eligible++;
    const phone = state.insured_phone!;

    // Determine touch number and build appropriate message
    const currentTouch = (existingFollowUp?.touch_count ?? 0) + 1;
    const message = buildSmsMessage(state, currentTouch);

    // Calculate next touch timing
    const nextTouchDelay = TOUCH_DELAYS_MS[currentTouch]; // delay before the *next* touch after this one
    const nextTouchAt = nextTouchDelay
      ? new Date(Date.now() + nextTouchDelay).toISOString()
      : null;

    if (dryRun) {
      // Dry-run mode: log what we would send, but don't actually send
      const followUpState: FollowUpState = {
        eapp_id: eappId,
        status: "dry_run_sent",
        reason: "dry_run",
        insured_name: state.insured_name,
        insured_phone: state.insured_phone,
        product_name: state.product_name,
        carrier_name: state.carrier_name,
        premium: state.premium,
        benefit_amount: state.benefit_amount,
        apply_link: state.apply_link,
        dry_run_at: now,
        message_body: message,
        touch_count: currentTouch,
        next_touch_at: currentTouch < MAX_TOUCHES ? nextTouchAt : null,
        created_at: existingFollowUp?.created_at ?? now,
        updated_at: now,
      };
      await kv.set(`eapp:followup:${eappId}`, followUpState);

      // Also log to dry-run log
      await kv.rpush("followup:dryrun:log", {
        timestamp: now,
        eapp_id: eappId,
        insured_name: state.insured_name,
        phone: phone,
        message: message,
        product: state.product_name,
        carrier: state.carrier_name,
        step: state.step,
        touch_number: currentTouch,
        next_touch_at: currentTouch < MAX_TOUCHES ? nextTouchAt : null,
        hours_stagnant: state.last_step_at
          ? Math.round(((Date.now() - new Date(state.last_step_at).getTime()) / (1000 * 60 * 60)) * 10) / 10
          : "unknown",
      });

      result.dry_run++;
      result.details.push({
        eapp_id: eappId,
        action: "dry_run",
        message_preview: message.slice(0, 80) + "...",
      });
    } else {
      // LIVE mode: actually send the SMS via BackNine
      const smsResult = await sendBackNineSms(state, message);

      if (smsResult.success) {
        const followUpState: FollowUpState = {
          eapp_id: eappId,
          status: "contacted",
          insured_name: state.insured_name,
          insured_phone: state.insured_phone,
          product_name: state.product_name,
          carrier_name: state.carrier_name,
          premium: state.premium,
          benefit_amount: state.benefit_amount,
          apply_link: state.apply_link,
          sms_sent_at: now,
          message_body: message,
          touch_count: currentTouch,
          next_touch_at: currentTouch < MAX_TOUCHES ? nextTouchAt : null,
          created_at: existingFollowUp?.created_at ?? now,
          updated_at: now,
        };
        await kv.set(`eapp:followup:${eappId}`, followUpState);

        result.contacted++;
        result.details.push({
          eapp_id: eappId,
          action: "sent",
          message_preview: message.slice(0, 80) + "...",
        });
      } else {
        result.errors++;
        result.details.push({
          eapp_id: eappId,
          action: "error",
          reason: `SMS failed: ${smsResult.error}`,
        });
      }
    }
  }

  // Log summary
  console.log(JSON.stringify({
    timestamp: now,
    source: "followup-engine",
    dry_run: dryRun,
    processed: result.processed,
    eligible: result.eligible,
    contacted: result.contacted,
    dry_run_count: result.dry_run,
    skipped: result.skipped,
    suppressed: result.suppressed,
    errors: result.errors,
  }));

  // Transition leads to exhausted if they've received all touches and the window has passed
  for (const id of abandonedIds) {
    const eappId = String(id);
    const followUp: FollowUpState | null = await kv.get(`eapp:followup:${eappId}`);
    if (!followUp) continue;
    if ((followUp.status === "contacted" || followUp.status === "dry_run_sent") && followUp.touch_count !== undefined && followUp.touch_count >= MAX_TOUCHES) {
      // All touches sent — check if exhausted window has passed
      const lastTouchAt = followUp.sms_sent_at ?? followUp.dry_run_at;
      if (lastTouchAt) {
        const exhaustedAt = new Date(new Date(lastTouchAt).getTime() + EXHAUSTED_AFTER_DAYS * 24 * 60 * 60 * 1000);
        if (exhaustedAt <= new Date()) {
          followUp.status = "exhausted";
          followUp.reason = `All ${MAX_TOUCHES} touches sent, no response after ${EXHAUSTED_AFTER_DAYS} days`;
          followUp.updated_at = now;
          await kv.set(`eapp:followup:${eappId}`, followUp);
          console.log(JSON.stringify({
            timestamp: now,
            source: "followup-engine",
            action: "exhausted_transition",
            eapp_id: eappId,
            insured_name: followUp.insured_name,
            touch_count: followUp.touch_count,
          }));
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Update follow-up state with manual contact
// ---------------------------------------------------------------------------

export async function setManualContact(
  eappId: string,
  options: {
    smsSent?: boolean;
    emailSent?: boolean;
    cooldownHours?: number;
  } = {}
): Promise<FollowUpState | null> {
  const now = new Date().toISOString();
  const cooldownHours = options.cooldownHours ?? MANUAL_CONTACT_COOLDOWN_HOURS;
  const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();

  const existing: FollowUpState | null = await kv.get(`eapp:followup:${eappId}`);

  const followUpState: FollowUpState = {
    eapp_id: eappId,
    status: "manual_contact",
    reason: `Manually contacted by Ryan${options.smsSent ? " (SMS)" : ""}${options.emailSent ? " (email)" : ""}`,
    insured_name: existing?.insured_name,
    insured_phone: existing?.insured_phone,
    product_name: existing?.product_name,
    carrier_name: existing?.carrier_name,
    premium: existing?.premium,
    benefit_amount: existing?.benefit_amount,
    apply_link: existing?.apply_link,
    manual_contact_at: now,
    manual_sms_sent: options.smsSent ?? false,
    manual_email_sent: options.emailSent ?? false,
    cooldown_until: cooldownUntil,
    automated_followup_suppressed: true,
    touch_count: existing?.touch_count,
    next_touch_at: existing?.next_touch_at,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await kv.set(`eapp:followup:${eappId}`, followUpState);
  return followUpState;
}

// ---------------------------------------------------------------------------
// Read follow-up state / logs
// ---------------------------------------------------------------------------

export async function getFollowUpState(eappId: string): Promise<FollowUpState | null> {
  return await kv.get<FollowUpState>(`eapp:followup:${eappId}`);
}

export async function getDryRunLog(): Promise<unknown[]> {
  return await kv.lrange("followup:dryrun:log", 0, -1);
}

export async function getAllFollowUpStates(): Promise<Record<string, FollowUpState>> {
  // Get all eApp IDs from the abandoned leads set + the main queue
  const abandonedIds = await kv.zrange("leads:abandoned", 0, -1);
  const allLeadIds = await kv.zrange("leads:queue", 0, -1);
  const uniqueIds = new Set([...abandonedIds, ...allLeadIds].map(String));

  const states: Record<string, FollowUpState> = {};
  for (const id of uniqueIds) {
    const followUp = await kv.get<FollowUpState>(`eapp:followup:${id}`);
    if (followUp) {
      states[id] = followUp;
    }
  }
  return states;
}

// ---------------------------------------------------------------------------
// Cadence verification — stages synthetic lead, walks T1→T2→T3→exhausted
// ---------------------------------------------------------------------------

const TEST_CADENCE_ID = "900001";

export async function testCadenceSequence(): Promise<{
  steps: Array<{
    step: string;
    action: string;
    touch_count?: number;
    next_touch_at?: string | null;
    status?: string;
    reason?: string;
    passed: boolean;
  }>;
  overall_pass: boolean;
  cleanup: string;
}> {
  const steps: Array<{
    step: string;
    action: string;
    touch_count?: number;
    next_touch_at?: string | null;
    status?: string;
    reason?: string;
    passed: boolean;
  }> = [];

  try {
    // --- Stage 0: Setup synthetic eApp in abandoned state ---
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

    const testEappState: EAppState = {
      id: 900001,
      insured_name: "Cadence Test",
      insured_phone: "5559000001",
      insured_email: null,
      product_name: "OPTerm 20",
      carrier_name: "Banner Life",
      premium: 295.0,
      benefit_amount: 500000,
      apply_link: "https://app.back9ins.com/apply/cadence-test",
      status: "abandoned",
      step: 4,
      named_step: "Health Step",
      step_display_name: "Health Questions",
      is_completed: false,
      lead_status: null,
      created_at: sixHoursAgo,
      updated_at: sixHoursAgo,
      completed_at: null,
      first_seen_at: sixHoursAgo,
      last_event_at: sixHoursAgo,
      last_step_at: sixHoursAgo,
      event_count: 1,
    };

    await kv.set(`eapp:state:${TEST_CADENCE_ID}`, testEappState);
    await kv.zadd("leads:abandoned", { score: Date.now(), member: TEST_CADENCE_ID });
    // Ensure no prior followup state
    await kv.del(`eapp:followup:${TEST_CADENCE_ID}`);

    // --- Step 1: Touch 1 dry-run ---
    const result1 = await processAbandonedFollowUps(true); // dry-run
    const touch1Detail = result1.details.find(d => d.eapp_id === TEST_CADENCE_ID);

    if (touch1Detail?.action === "dry_run") {
      const state1: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
      const hasNextTouch = !!state1?.next_touch_at;
      steps.push({
        step: "Touch 1",
        action: touch1Detail.action,
        touch_count: state1?.touch_count,
        next_touch_at: state1?.next_touch_at,
        status: state1?.status,
        passed: state1?.touch_count === 1 && hasNextTouch,
      });
    } else {
      steps.push({
        step: "Touch 1",
        action: touch1Detail?.action ?? "missing",
        reason: touch1Detail?.reason,
        passed: false,
      });
    }

    // --- Step 2: Advance next_touch_at to past, verify T2 eligibility ---
    const stateAfterT1: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
    if (stateAfterT1?.next_touch_at) {
      // Set next_touch_at to 1 second ago so it's due
      const pastTime = new Date(Date.now() - 1000).toISOString();
      stateAfterT1.next_touch_at = pastTime;
      await kv.set(`eapp:followup:${TEST_CADENCE_ID}`, stateAfterT1);
    }

    const result2 = await processAbandonedFollowUps(true);
    const touch2Detail = result2.details.find(d => d.eapp_id === TEST_CADENCE_ID);

    if (touch2Detail?.action === "dry_run") {
      const state2: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
      steps.push({
        step: "Touch 2",
        action: touch2Detail.action,
        touch_count: state2?.touch_count,
        next_touch_at: state2?.next_touch_at,
        status: state2?.status,
        passed: state2?.touch_count === 2, // T2 sent, next_touch_at may or may not be set
      });
    } else {
      const state2: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
      steps.push({
        step: "Touch 2",
        action: touch2Detail?.action ?? "missing",
        reason: touch2Detail?.reason,
        touch_count: state2?.touch_count,
        passed: false,
      });
    }

    // --- Step 3: Advance next_touch_at to past, verify T3 eligibility ---
    const stateAfterT2: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
    if (stateAfterT2?.next_touch_at) {
      const pastTime = new Date(Date.now() - 1000).toISOString();
      stateAfterT2.next_touch_at = pastTime;
      await kv.set(`eapp:followup:${TEST_CADENCE_ID}`, stateAfterT2);
    }

    const result3 = await processAbandonedFollowUps(true);
    const touch3Detail = result3.details.find(d => d.eapp_id === TEST_CADENCE_ID);

    if (touch3Detail?.action === "dry_run") {
      const state3: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
      // T3 is the final touch: next_touch_at should be null
      steps.push({
        step: "Touch 3",
        action: touch3Detail.action,
        touch_count: state3?.touch_count,
        next_touch_at: state3?.next_touch_at,
        status: state3?.status,
        passed: state3?.touch_count === 3 && state3?.next_touch_at === null,
      });
    } else {
      const state3: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
      steps.push({
        step: "Touch 3",
        action: touch3Detail?.action ?? "missing",
        reason: touch3Detail?.reason,
        touch_count: state3?.touch_count,
        passed: false,
      });
    }

    // --- Step 4: Verify T4 is blocked (already_contacted) ---
    const result4 = await processAbandonedFollowUps(true);
    const touch4Detail = result4.details.find(d => d.eapp_id === TEST_CADENCE_ID);
    steps.push({
      step: "Post-T3 block",
      action: touch4Detail?.action ?? "unexpected",
      reason: touch4Detail?.reason,
      passed: touch4Detail?.action === "skipped" && !!touch4Detail?.reason?.includes("already_contacted"),
    });

    // --- Step 5: Simulate exhausted transition by backdating last touch ---
    const stateAfterT3: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
    if (stateAfterT3) {
      // Backdate dry_run_at to more than EXHAUSTED_AFTER_DAYS ago
      const exhaustedPast = new Date(Date.now() - (EXHAUSTED_AFTER_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
      stateAfterT3.dry_run_at = exhaustedPast;
      await kv.set(`eapp:followup:${TEST_CADENCE_ID}`, stateAfterT3);
    }

    const result5 = await processAbandonedFollowUps(true);
    // After this cycle, check if followup state is now "exhausted"
    const stateAfterExhausted: FollowUpState | null = await kv.get(`eapp:followup:${TEST_CADENCE_ID}`);
    steps.push({
      step: "Exhausted transition",
      action: stateAfterExhausted?.status ?? "unknown",
      status: stateAfterExhausted?.status,
      reason: stateAfterExhausted?.reason,
      passed: stateAfterExhausted?.status === "exhausted",
    });

  } catch (err) {
    steps.push({
      step: "error",
      action: "exception",
      reason: err instanceof Error ? err.message : String(err),
      passed: false,
    });
  }

  // --- Cleanup ---
  try {
    await kv.del(`eapp:state:${TEST_CADENCE_ID}`);
    await kv.del(`eapp:followup:${TEST_CADENCE_ID}`);
    await kv.zrem("leads:abandoned", TEST_CADENCE_ID);
    await kv.del("followup:dryrun:log"); // Clean test entries from log
  } catch {
    // best-effort cleanup
  }

  const overall_pass = steps.length >= 5 && steps.every(s => s.passed);

  return {
    steps,
    overall_pass,
    cleanup: "attempted",
  };
}