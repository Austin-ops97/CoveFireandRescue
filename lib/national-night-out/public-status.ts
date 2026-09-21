import { timingSafeEqual } from "node:crypto";
import {
  NNO_EVENT_TYPE_LABEL,
  NNO_STATUS_LABELS,
  NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
  STATUS_LOOKUP_NOT_FOUND_MESSAGE,
  type NationalNightOutPublicStatus,
  type NationalNightOutStatus,
} from "./types";
import { normalizeNightOutRequestId } from "./validation";

const PUBLIC_STATUS_KEYS = [
  "requestId",
  "status",
  "statusLabel",
  "eventType",
  "submittedAt",
  "requestedEventDate",
  "lastUpdated",
] as const;

export function emailsMatch(left: string, right: string): boolean {
  const a = Buffer.from(left.trim().toLowerCase());
  const b = Buffer.from(right.trim().toLowerCase());
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export type StatusLookupRecord = {
  requestId: string;
  email: string;
  status: NationalNightOutStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  statusNote?: string;
  phone?: string;
  address?: string;
  comments?: string;
  id?: string;
};

export function resolvePublicStatusLookup(input: {
  record: StatusLookupRecord | null;
  requestId: string;
  email: string;
  eventDateLabel?: string;
}):
  | { ok: true; status: NationalNightOutPublicStatus }
  | { ok: false; message: typeof STATUS_LOOKUP_NOT_FOUND_MESSAGE } {
  const failure = {
    ok: false as const,
    message: STATUS_LOOKUP_NOT_FOUND_MESSAGE,
  };
  const requestId = normalizeNightOutRequestId(input.requestId);
  const email = input.email.trim().toLowerCase();

  if (!input.record) {
    emailsMatch(email, "missing-request@invalid.example");
    return failure;
  }

  const idMatches = emailsMatch(
    normalizeNightOutRequestId(input.record.requestId),
    requestId
  );
  const emailMatches = emailsMatch(input.record.email, email);

  if (!idMatches || !emailMatches) {
    return failure;
  }

  const status: NationalNightOutPublicStatus = {
    requestId: input.record.requestId,
    status: input.record.status,
    statusLabel: NNO_STATUS_LABELS[input.record.status],
    eventType: NNO_EVENT_TYPE_LABEL,
    submittedAt: input.record.createdAt ?? null,
    requestedEventDate: input.eventDateLabel ?? NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
    lastUpdated: input.record.updatedAt ?? input.record.createdAt ?? null,
  };

  const keys = Object.keys(status);
  if (keys.length !== PUBLIC_STATUS_KEYS.length || keys.some((key) => !PUBLIC_STATUS_KEYS.includes(key as (typeof PUBLIC_STATUS_KEYS)[number]))) {
    return failure;
  }

  return { ok: true, status };
}
