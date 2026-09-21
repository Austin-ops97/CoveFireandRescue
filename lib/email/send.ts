import "server-only";

import nodemailer from "nodemailer";
import { readTransactionalEmailConfig } from "./config";
import { resolveMailIdentity } from "./identity";
import { normalizeEmailAddress, sanitizeHeaderValue } from "./sanitize";

export type TransactionalEmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type TransactionalEmailResult =
  | { outcome: "sent" }
  | { outcome: "logged" }
  | { outcome: "unconfigured"; message: string }
  | { outcome: "failed"; message: string };

function safeErrorMessage(error: unknown, secret: string | null): string {
  const raw = error instanceof Error ? error.message : "Email could not be sent.";
  const redacted = secret && secret.length > 3 ? raw.split(secret).join("[redacted]") : raw;
  return redacted.replace(/[\r\n]+/g, " ").slice(0, 300);
}

/**
 * Sends one transactional message through the department cPanel SMTP mailbox.
 * Outside production, or when EMAIL_DELIVERY_MODE=log, the message is recorded
 * and not handed to the mail server.
 */
export async function sendTransactionalEmail(
  message: TransactionalEmailMessage
): Promise<TransactionalEmailResult> {
  const config = readTransactionalEmailConfig();
  const identity = resolveMailIdentity({
    sendingDomain: config.sendingDomain,
    smtpUser: config.smtpUser,
    fromAddress: config.fromAddress,
    replyTo: config.replyTo,
    fallbackReplyTo: config.fallbackReplyTo,
  });

  if (!identity.ok) {
    return { outcome: "unconfigured", message: identity.message };
  }

  const to = normalizeEmailAddress(message.to);
  if (!to) {
    return { outcome: "failed", message: "Recipient email address is not valid." };
  }

  const subject = sanitizeHeaderValue(message.subject).slice(0, 200);
  if (!subject) {
    return { outcome: "failed", message: "Email subject is empty." };
  }

  if (config.deliveryMode !== "send") {
    console.info(
      JSON.stringify({
        source: "transactional-email",
        outcome: "logged",
        toDomain: to.slice(to.lastIndexOf("@") + 1),
        from: identity.identity.fromAddress,
        replyTo: identity.identity.replyTo,
        subject,
      })
    );
    return { outcome: "logged" };
  }

  if (!config.smtpHost || !config.smtpPassword || !config.smtpUser) {
    return {
      outcome: "unconfigured",
      message: "Outgoing email is not configured on this server.",
    };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: identity.identity.envelopeFrom,
        pass: config.smtpPassword,
      },
    });

    await transport.sendMail({
      from: {
        name: identity.identity.fromName,
        address: identity.identity.fromAddress,
      },
      to,
      replyTo: identity.identity.replyTo ?? undefined,
      envelope: {
        from: identity.identity.envelopeFrom,
        to,
      },
      subject,
      text: message.text,
      html: message.html,
    });

    return { outcome: "sent" };
  } catch (error) {
    console.error("Transactional email failed:", safeErrorMessage(error, config.smtpPassword));
    return { outcome: "failed", message: "The status email could not be sent." };
  }
}
