import "server-only";

import { siteConfig } from "@/lib/config/site";

export type EmailDeliveryMode = "log" | "send";

export type TransactionalEmailConfig = {
  sendingDomain: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPassword: string | null;
  fromAddress: string | null;
  replyTo: string | null;
  fallbackReplyTo: string;
  deliveryMode: EmailDeliveryMode;
};

function readTrimmed(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readPort(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveEmailDeliveryMode(): EmailDeliveryMode {
  const explicit = readTrimmed("EMAIL_DELIVERY_MODE")?.toLowerCase();
  if (explicit === "log" || explicit === "send") return explicit;
  if (process.env.NODE_ENV === "production") return "send";
  return "log";
}

export function readTransactionalEmailConfig(): TransactionalEmailConfig {
  const sendingDomain = readTrimmed("CPANEL_EMAIL_DOMAIN")?.toLowerCase() ?? null;
  const smtpHostOverride = readTrimmed("CPANEL_MAIL_HOST");

  return {
    sendingDomain,
    smtpHost: smtpHostOverride ?? (sendingDomain ? `mail.${sendingDomain}` : null),
    smtpPort: readPort(readTrimmed("CPANEL_MAIL_SMTP_PORT"), 465),
    smtpUser: readTrimmed("EMAIL_SMTP_USER"),
    smtpPassword: readTrimmed("EMAIL_SMTP_PASSWORD"),
    fromAddress: readTrimmed("EMAIL_FROM"),
    replyTo: readTrimmed("EMAIL_REPLY_TO"),
    fallbackReplyTo: siteConfig.contact.publicEmail,
    deliveryMode: resolveEmailDeliveryMode(),
  };
}

/** True when the server has the mailbox credentials required to send. Does not reveal values. */
export function isTransactionalEmailConfigured(): boolean {
  const config = readTransactionalEmailConfig();
  return Boolean(
    config.sendingDomain &&
      config.smtpHost &&
      config.smtpUser &&
      config.smtpPassword
  );
}
