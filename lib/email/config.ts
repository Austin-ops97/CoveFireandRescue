import "server-only";

/**
 * Transactional email configuration (Resend).
 * Never log or expose RESEND_API_KEY.
 */

export type EmailSenderConfig = {
  configured: boolean;
  apiKeyPresent: boolean;
  from: string;
  fromAddress: string;
  replyTo: string | null;
  sendingDomain: string;
  safeRecipient: string | null;
  dryRun: boolean;
};

const DEFAULT_FROM = "Cove Fire & Rescue <noreply@covefireandrescue.org>";
const DEFAULT_SENDING_DOMAIN = "covefireandrescue.org";

function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();
  return fromHeader.trim().toLowerCase();
}

function extractDomain(emailAddress: string): string {
  const at = emailAddress.lastIndexOf("@");
  if (at === -1) return DEFAULT_SENDING_DOMAIN;
  return emailAddress.slice(at + 1).toLowerCase();
}

export function getEmailSenderConfig(): EmailSenderConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  const fromAddress = extractEmailAddress(from);
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || null;
  const safeRecipient = process.env.EMAIL_SAFE_RECIPIENT?.trim().toLowerCase() || null;
  const forceDryRun = process.env.EMAIL_DRY_RUN === "true";
  const nodeEnv = process.env.NODE_ENV;

  // Never send real mail in development unless an API key is present AND dry-run is off.
  // Production sends only when RESEND_API_KEY is configured and EMAIL_DRY_RUN is not true.
  const dryRun =
    forceDryRun ||
    !apiKey ||
    (nodeEnv !== "production" && process.env.EMAIL_ALLOW_NON_PRODUCTION !== "true");

  return {
    configured: Boolean(apiKey),
    apiKeyPresent: Boolean(apiKey),
    from,
    fromAddress,
    replyTo,
    sendingDomain: extractDomain(fromAddress) || DEFAULT_SENDING_DOMAIN,
    safeRecipient,
    dryRun,
  };
}

export function isTransactionalEmailConfigured(): boolean {
  return getEmailSenderConfig().configured;
}
