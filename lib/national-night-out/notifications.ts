import { siteConfig } from "@/lib/config/site";
import {
  NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
  NATIONAL_NIGHT_OUT_EVENT_TYPE,
  NNO_STATUS_LABELS,
  type NationalNightOutPublicStatus,
  type NationalNightOutRequestRecord,
  type NationalNightOutStatus,
} from "@/lib/national-night-out/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSubmittedDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });
}

function statusSubject(status: NationalNightOutStatus, requestId: string): string {
  switch (status) {
    case "submitted":
      return `National Night Out request received (${requestId})`;
    case "under_review":
      return `National Night Out request under review (${requestId})`;
    case "approved":
      return `National Night Out request approved (${requestId})`;
    case "denied":
      return `National Night Out request update (${requestId})`;
    default:
      return `National Night Out request update (${requestId})`;
  }
}

function statusIntro(status: NationalNightOutStatus): { headline: string; body: string } {
  switch (status) {
    case "submitted":
      return {
        headline: "We received your request",
        body: "Thank you for submitting a National Night Out visit request. The department will review it and determine availability based on staffing and emergency response needs.",
      };
    case "under_review":
      return {
        headline: "Your request is under review",
        body: "An officer is reviewing your National Night Out visit request. No further action is required from you at this time.",
      };
    case "approved":
      return {
        headline: "Your request has been approved",
        body: "Cove Fire & Rescue has approved your National Night Out visit request, subject to emergency response needs on the event date. Please keep this email for your records.",
      };
    case "denied":
      return {
        headline: "Your request could not be approved",
        body: "After review, Cove Fire & Rescue is unable to fulfill this National Night Out visit request. You may contact the department for non-emergency questions.",
      };
  }
}

export function buildNationalNightOutStatusEmail(params: {
  request: NationalNightOutRequestRecord;
  status: NationalNightOutStatus;
  statusPageUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const { request, status, statusPageUrl } = params;
  const intro = statusIntro(status);
  const statusLabel = NNO_STATUS_LABELS[status];
  const contactPhone = siteConfig.contact.publicPhone;
  const contactEmail = siteConfig.contact.publicEmail;
  const denial =
    status === "denied" && request.adminNotes?.trim()
      ? request.adminNotes.trim()
      : null;

  const subject = statusSubject(status, request.requestId);

  const textLines = [
    "Cove Fire & Rescue",
    "",
    intro.headline,
    intro.body,
    "",
    `Request ID: ${request.requestId}`,
    `Request status: ${statusLabel}`,
    `Event: National Night Out (${NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL})`,
    `Neighborhood: ${request.neighborhood}`,
    `Event address: ${request.address}, ${request.city}, ${request.zipCode}`,
    `Preferred visit time: ${request.preferredTime}`,
    `Submitted: ${formatSubmittedDate(request.createdAt)}`,
  ];

  if (denial) {
    textLines.push("", `Notes from the department: ${denial}`);
  }

  textLines.push(
    "",
    `Questions? Call ${contactPhone} or email ${contactEmail}.`,
    "Submitting a request does not guarantee a department visit; visits remain subject to emergency response needs."
  );

  if (statusPageUrl) {
    textLines.push("", `Check your request status: ${statusPageUrl}`);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#0b1f4d;color:#ffffff;padding:20px 24px;">
            <div style="font-size:18px;font-weight:700;">Cove Fire &amp; Rescue</div>
            <div style="margin-top:4px;font-size:13px;opacity:0.9;">Chambers County, Texas</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h1 style="margin:0 0 8px;font-size:20px;color:#111827;">${escapeHtml(intro.headline)}</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#344054;">${escapeHtml(intro.body)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
              <tr><td style="padding:16px;">
                <p style="margin:0 0 8px;font-size:13px;"><strong>Request ID:</strong> ${escapeHtml(request.requestId)}</p>
                <p style="margin:0 0 8px;font-size:13px;"><strong>Request status:</strong> ${escapeHtml(statusLabel)}</p>
                <p style="margin:0 0 8px;font-size:13px;"><strong>Event:</strong> National Night Out (${escapeHtml(NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL)})</p>
                <p style="margin:0 0 8px;font-size:13px;"><strong>Neighborhood:</strong> ${escapeHtml(request.neighborhood)}</p>
                <p style="margin:0 0 8px;font-size:13px;"><strong>Event address:</strong> ${escapeHtml(`${request.address}, ${request.city}, ${request.zipCode}`)}</p>
                <p style="margin:0 0 8px;font-size:13px;"><strong>Preferred visit time:</strong> ${escapeHtml(request.preferredTime)}</p>
                <p style="margin:0;font-size:13px;"><strong>Submitted:</strong> ${escapeHtml(formatSubmittedDate(request.createdAt))}</p>
              </td></tr>
            </table>
            ${
              denial
                ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.55;color:#344054;"><strong>Notes from the department:</strong> ${escapeHtml(denial)}</p>`
                : ""
            }
            ${
              statusPageUrl
                ? `<p style="margin:16px 0 0;font-size:14px;"><a href="${escapeHtml(statusPageUrl)}" style="color:#193c8f;">Check your request status</a></p>`
                : ""
            }
            <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#667085;">
              Questions? Call ${escapeHtml(contactPhone)} or email
              <a href="mailto:${escapeHtml(contactEmail)}" style="color:#193c8f;">${escapeHtml(contactEmail)}</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text: textLines.join("\n") };
}

function serializeTimestampString(value: unknown): string | null {
  if (typeof value === "string") return value;
  return null;
}

export function toPublicNationalNightOutStatus(
  record: NationalNightOutRequestRecord
): NationalNightOutPublicStatus {
  return {
    requestId: record.requestId,
    status: record.status,
    statusLabel: NNO_STATUS_LABELS[record.status],
    eventType: NATIONAL_NIGHT_OUT_EVENT_TYPE,
    submittedAt: serializeTimestampString(record.createdAt),
    requestedEventDate: NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
    preferredTime: record.preferredTime,
    lastUpdatedAt: serializeTimestampString(record.updatedAt),
    neighborhood: record.neighborhood,
  };
}

/**
 * Timing-safe-ish equality for emails used in public status lookup.
 * Avoids leaking whether a Request ID exists when the email does not match.
 */
export function emailsMatchForStatusLookup(stored: string, provided: string): boolean {
  const a = stored.trim().toLowerCase();
  const b = provided.trim().toLowerCase();
  if (a.length !== b.length) {
    let mismatch = a.length ^ b.length;
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i += 1) {
      mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return mismatch === 0;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function shouldSendNationalNightOutStatusNotification(params: {
  previousStatus: NationalNightOutStatus;
  nextStatus: NationalNightOutStatus;
  lastNotifiedStatus: NationalNightOutStatus | null;
}): boolean {
  if (params.previousStatus === params.nextStatus) return false;
  if (params.lastNotifiedStatus === params.nextStatus) return false;
  return true;
}
