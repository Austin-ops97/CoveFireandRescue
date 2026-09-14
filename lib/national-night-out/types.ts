export const NNO_STATUSES = ["submitted", "under_review", "approved", "denied"] as const;
export type NationalNightOutStatus = (typeof NNO_STATUSES)[number];

/** Legacy status stored before the Submitted / Under Review rename. */
export const NNO_LEGACY_PENDING_STATUS = "pending" as const;

export const NNO_STATUS_LABELS: Record<NationalNightOutStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
};

export type NationalNightOutRequestRecord = {
  id: string;
  requestId: string;
  requesterName: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
  city: string;
  zipCode: string;
  preferredTime: string;
  estimatedAttendance: string;
  accessInstructions: string;
  comments: string;
  disclaimerAccepted: boolean;
  status: NationalNightOutStatus;
  /** Officer-facing notes; may be included in denial emails when present. */
  adminNotes: string;
  lastNotifiedStatus: NationalNightOutStatus | null;
  lastNotifiedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/** Public-safe subset returned by the request-status lookup endpoint. */
export type NationalNightOutPublicStatus = {
  requestId: string;
  status: NationalNightOutStatus;
  statusLabel: string;
  eventType: string;
  submittedAt: string | null;
  requestedEventDate: string;
  preferredTime: string;
  lastUpdatedAt: string | null;
  neighborhood: string;
};

export type NationalNightOutFormPayload = {
  requesterName: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
  city: string;
  zipCode: string;
  preferredTime: string;
  estimatedAttendance: string;
  accessInstructions?: string;
  comments?: string;
  disclaimerAccepted: boolean;
  /** Honeypot — must remain empty. */
  website?: string;
};

export type NationalNightOutSettings = {
  enabled: boolean;
  updatedAt?: unknown;
  updatedBy?: string | null;
};

export const NATIONAL_NIGHT_OUT_SETTINGS_DOC_ID = "nationalNightOut";

export const NATIONAL_NIGHT_OUT_DISCLAIMER =
  "Submitting a National Night Out request does not guarantee that the department will be able to attend. Visits are subject to emergency response needs, available time, apparatus availability, and available department personnel.";

export const NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL = "October 6";

export const NATIONAL_NIGHT_OUT_EVENT_TYPE = "National Night Out Visit Request";
