import "server-only";

import { getEmailSenderConfig } from "@/lib/email/config";
import { sendTransactionalEmail, type SendEmailResult } from "@/lib/email/send";
import { buildNationalNightOutStatusEmail } from "@/lib/national-night-out/notifications";
import type {
  NationalNightOutRequestRecord,
  NationalNightOutStatus,
} from "@/lib/national-night-out/types";

export { buildNationalNightOutStatusEmail } from "@/lib/national-night-out/notifications";

export async function sendNationalNightOutStatusEmail(params: {
  request: NationalNightOutRequestRecord;
  status: NationalNightOutStatus;
  statusPageUrl?: string | null;
}): Promise<SendEmailResult> {
  const config = getEmailSenderConfig();
  const content = buildNationalNightOutStatusEmail(params);

  return sendTransactionalEmail({
    to: params.request.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    replyTo: config.replyTo,
    tags: [
      { name: "category", value: "nno_status" },
      { name: "status", value: params.status },
    ],
  });
}
