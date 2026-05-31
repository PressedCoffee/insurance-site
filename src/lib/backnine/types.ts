// ---------------------------------------------------------------------------
// BackNine Types — shared interfaces for webhook payloads and state
// ---------------------------------------------------------------------------

export interface EAppPayload {
  id: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  is_completed?: boolean;
  step?: number;
  named_step?: string;
  step_display_name?: string;
  premium?: number;
  benefit_amount?: number;
  pay_duration?: number;
  mode?: number;
  edited_status?: string;
  lead_status?: string | null;
  follow_up_at?: string | null;
  completed_at?: string | null;
  refer?: boolean;
  product?: {
    id: number;
    name: string;
    category?: string;
    carrier?: { id: number; name: string };
  };
  insured?: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    phone_mobile?: string | null;
    email?: string | null;
  };
  // BackNine stores contact data in parties[], not insured
  // The webhook payload includes parties with email/phone
  parties?: Array<{
    id?: number;
    name?: string;
    email?: string | null;
    primary_phone?: string | null;
    type?: string;
  }>;
  agent?: {
    id: number;
    name: string;
  };
  apply_link?: string;
  [key: string]: unknown;
}

export interface CasePayload {
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

// Canonical eApp state stored in KV
export interface EAppState {
  id: number;
  status: "created" | "in_progress" | "abandoned" | "completed";
  step: number;
  named_step: string | null;
  step_display_name: string | null;
  premium: number | null;
  benefit_amount: number | null;
  product_name: string | null;
  carrier_name: string | null;
  insured_name: string | null;
  insured_email: string | null;
  insured_phone: string | null;
  apply_link: string | null;
  lead_status: string | null;
  is_completed: boolean;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  first_seen_at: string;   // ISO timestamp when we first received this eApp
  last_event_at: string;   // ISO timestamp of last webhook event
  last_step_at: string | null; // ISO timestamp of last step change
  event_count: number;
}

// Canonical Case state stored in KV
export interface CaseState {
  id: number;
  status: string;
  policy_number: string | null;
  product_name: string | null;
  carrier_name: string | null;
  insured_name: string | null;
  premium: number | null;
  face_amount: number | null;
  first_seen_at: string;
  last_event_at: string;
  event_count: number;
}

// Event log entry
export interface EventLogEntry {
  timestamp: string;
  source: "eapp" | "case";
  event: string;
  id: number;
  payload_hash: string;
  details: Record<string, unknown>;
}

// Abandonment config
export const ABANDONMENT_THRESHOLD_HOURS = 4;
export const ABANDONMENT_STEP_THRESHOLD = 5; // steps 1-5 are early; above 5 means meaningful progress