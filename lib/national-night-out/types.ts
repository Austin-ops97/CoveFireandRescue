export const NNO_STATUSES = ["pending", "approved", "denied"] as const;
export type NationalNightOutStatus = (typeof NNO_STATUSES)[number];

export const NNO_STATUS_LABELS: Record<NationalNightOutStatus, string> = {
  pending: "Pending",
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
