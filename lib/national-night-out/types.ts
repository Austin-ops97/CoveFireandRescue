export const NNO_STATUSES = ["pending", "under_review", "approved", "denied"] as const;
export type NationalNightOutStatus = (typeof NNO_STATUSES)[number];

/**
 * `pending` is the stored value for a newly submitted request. Existing
 * documents keep that value; the requester-facing label is Submitted.
 */
export const NNO_STATUS_LABELS: Record<NationalNightOutStatus, string> = {
  pending: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
};

export const NNO_EVENT_TYPE_LABEL = "National Night Out visit";

export const STATUS_LOOKUP_NOT_FOUND_MESSAGE =
  "We couldn't find a request matching that Request ID and email address." as const;

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
  /** Officer note emailed to the requester. Not shown on the public status page. */
  statusNote: string;
  lastNotifiedStatus: NationalNightOutStatus | null;
  lastNotifiedAt?: unknown;
  lastNotificationError: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
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

export type NationalNightOutPublicStatus = {
  requestId: string;
  status: NationalNightOutStatus;
  statusLabel: string;
  eventType: string;
  submittedAt: unknown;
  requestedEventDate: string;
  lastUpdated: unknown;
};

export type NationalNightOutNotificationResult = {
  outcome: "sent" | "logged" | "skipped" | "unconfigured" | "failed";
  reason?: string;
  message?: string;
};
