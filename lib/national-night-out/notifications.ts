import { escapeHtml, sanitizeHeaderValue } from "../email/sanitize";
import {
  NNO_EVENT_TYPE_LABEL,
  NNO_STATUS_LABELS,
  type NationalNightOutStatus,
} from "./types";

export type StatusNotificationDecision = {
  notify: boolean;
  reason: "status_changed" | "note_changed" | "retry_unsent" | "already_notified";
};

export function shouldNotifyStatusChange(input: {
  previousStatus: NationalNightOutStatus | null;
  nextStatus: NationalNightOutStatus;
  lastNotifiedStatus: NationalNightOutStatus | null;
  previousNote?: string;
  nextNote?: string;
}): StatusNotificationDecision {
  const previousNote = (input.previousNote ?? "").trim();
  const nextNote = (input.nextNote ?? "").trim();
  const statusUnchanged = input.previousStatus === input.nextStatus;
  const noteUnchanged = previousNote === nextNote;

  if (statusUnchanged && noteUnchanged && input.lastNotifiedStatus === input.nextStatus) {
    return { notify: false, reason: "already_notified" };
  }

  if (!statusUnchanged) {
    return { notify: true, reason: "status_changed" };
  }

  if (!noteUnchanged) {
    return { notify: true, reason: "note_changed" };
  }

  return { notify: true, reason: "retry_unsent" };
}

export type NightOutEmailFacts = {
  requestId: string;
  requesterName: string;
  neighborhood: string;
  preferredTime: string;
  status: NationalNightOutStatus;
  statusNote: string;
  eventDateLabel: string;
  departmentName: string;
  publicPhone: string;
  publicEmail: string;
  statusCheckUrl: string | null;
};

export type NightOutStatusEmail = {
  subject: string;
  text: string;
  html: string;
};

function statusParagraph(status: NationalNightOutStatus): string {
  switch (status) {
    case "pending":
      return "We received your National Night Out visit request. Submitting a request does not guarantee that the department will be able to attend.";
    case "under_review":
      return "Your National Night Out visit request is under review. This does not guarantee a department visit. Visits depend on emergency response needs, apparatus, and available personnel.";
    case "approved":
      return "Your National Night Out visit request has been approved. The department plans to attend, subject to emergency calls and personnel available that evening.";
    case "denied":
      return "Your National Night Out visit request was not approved. The department will not be able to attend this event.";
  }
}

function displayRequestId(value: string): string {
  const cleaned = sanitizeHeaderValue(value).toUpperCase();
  const match = cleaned.match(/NNO-[A-Z0-9]+/);
  return match ? match[0].slice(0, 20) : "request";
}

export function buildNightOutStatusEmail(facts: NightOutEmailFacts): NightOutStatusEmail {
  const requestId = displayRequestId(facts.requestId);
  const statusLabel = NNO_STATUS_LABELS[facts.status];
  const subject = sanitizeHeaderValue(
    `${facts.departmentName} — National Night Out request ${requestId} is ${statusLabel}`
  );
  const note = facts.statusNote.trim();
  const noteLabel = facts.status === "denied" ? "Reason" : "Note from the department";
  const lines = [
    facts.departmentName,
    "",
    `Hello ${facts.requesterName.trim() || "there"},`,
    "",
    statusParagraph(facts.status),
    "",
    `Request ID: ${requestId}`,
    `Request status: ${statusLabel}`,
    `Event: ${NNO_EVENT_TYPE_LABEL}`,
    `Requested event date: ${facts.eventDateLabel}`,
    facts.neighborhood.trim() ? `Neighborhood: ${facts.neighborhood.trim()}` : null,
    facts.preferredTime.trim() ? `Preferred visit time: ${facts.preferredTime.trim()}` : null,
    note ? `${noteLabel}: ${note}` : null,
    "",
    `Questions: call ${facts.publicPhone} or email ${facts.publicEmail}.`,
    facts.statusCheckUrl
      ? `Check this request later at ${facts.statusCheckUrl} using your Request ID and the email address on the request.`
      : "You can check this request on the Cove Fire & Rescue website with your Request ID and the email address on the request.",
    "",
    facts.departmentName,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");
  const html = [
    `<p><strong>${escapeHtml(facts.departmentName)}</strong></p>`,
    `<p>Hello ${escapeHtml(facts.requesterName.trim() || "there")},</p>`,
    `<p>${escapeHtml(statusParagraph(facts.status))}</p>`,
    "<ul>",
    `<li>Request ID: ${escapeHtml(requestId)}</li>`,
    `<li>Request status: ${escapeHtml(statusLabel)}</li>`,
    `<li>Event: ${escapeHtml(NNO_EVENT_TYPE_LABEL)}</li>`,
    `<li>Requested event date: ${escapeHtml(facts.eventDateLabel)}</li>`,
    facts.neighborhood.trim()
      ? `<li>Neighborhood: ${escapeHtml(facts.neighborhood.trim())}</li>`
      : "",
    facts.preferredTime.trim()
      ? `<li>Preferred visit time: ${escapeHtml(facts.preferredTime.trim())}</li>`
      : "",
    note ? `<li>${escapeHtml(noteLabel)}: ${escapeHtml(note)}</li>` : "",
    "</ul>",
    `<p>Questions: call ${escapeHtml(facts.publicPhone)} or email ${escapeHtml(facts.publicEmail)}.</p>`,
    facts.statusCheckUrl
      ? `<p>Check this request later at <a href="${escapeHtml(facts.statusCheckUrl)}">${escapeHtml(facts.statusCheckUrl)}</a> using your Request ID and the email address on the request.</p>`
      : "<p>You can check this request on the Cove Fire &amp; Rescue website with your Request ID and the email address on the request.</p>",
  ]
    .filter(Boolean)
    .join("");

  return { subject, text, html };
}
