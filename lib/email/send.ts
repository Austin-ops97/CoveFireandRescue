import "server-only";

import { Resend } from "resend";
import { getEmailSenderConfig } from "./config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  /** Optional tags for Resend analytics — never include PII. */
  tags?: { name: string; value: string }[];
};

export type SendEmailResult = {
  ok: boolean;
  skipped: boolean;
  dryRun: boolean;
  id?: string;
  error?: string;
  /** Final recipient list after safe-recipient rewrite (for logging only). */
  deliveredTo?: string[];
};

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0 && value.includes("@"));
}

/**
 * Sends transactional email via Resend.
 * In dry-run / missing-key mode, logs and returns without contacting Resend.
 * Never throws for mail failures — callers decide whether to surface errors.
 */
export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  const config = getEmailSenderConfig();
  let recipients = normalizeRecipients(input.to);

  if (recipients.length === 0) {
    return { ok: false, skipped: true, dryRun: config.dryRun, error: "No recipients." };
  }

  if (config.safeRecipient) {
    recipients = [config.safeRecipient];
  }

  const replyTo = input.replyTo ?? config.replyTo ?? undefined;

  if (config.dryRun || !config.apiKeyPresent) {
    console.info("[email] dry-run / not sent", {
      to: recipients,
      subject: input.subject,
      from: config.from,
      replyTo: replyTo ?? null,
      dryRun: true,
      apiKeyPresent: config.apiKeyPresent,
    });
    return {
      ok: true,
      skipped: true,
      dryRun: true,
      deliveredTo: recipients,
    };
  }

  try {
    const resend = new Resend(config.apiKeyPresent ? process.env.RESEND_API_KEY!.trim() : "");
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { replyTo } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error.message);
      return {
        ok: false,
        skipped: false,
        dryRun: false,
        error: error.message,
        deliveredTo: recipients,
      };
    }

    return {
      ok: true,
      skipped: false,
      dryRun: false,
      id: data?.id,
      deliveredTo: recipients,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[email] send failure:", message);
    return {
      ok: false,
      skipped: false,
      dryRun: false,
      error: message,
      deliveredTo: recipients,
    };
  }
}
