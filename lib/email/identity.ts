import { emailDomain, normalizeEmailAddress, sanitizeHeaderValue } from "./sanitize";

export const TRANSACTIONAL_FROM_NAME = "Cove Fire & Rescue";

export type MailIdentityInput = {
  sendingDomain: string | null;
  smtpUser: string | null;
  fromAddress: string | null;
  replyTo: string | null;
  fallbackReplyTo: string | null;
};

export type MailIdentity = {
  fromName: string;
  fromAddress: string;
  replyTo: string | null;
  envelopeFrom: string;
  sendingDomain: string;
};

export type MailIdentityResult =
  | { ok: true; identity: MailIdentity }
  | { ok: false; message: string };

function cleanDomain(value: string | null): string | null {
  if (!value) return null;
  const domain = sanitizeHeaderValue(value).toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!domain || domain.includes(" ") || !domain.includes(".")) return null;
  return domain;
}

/**
 * Header From and the SMTP envelope (return-path) must both be on the
 * authenticated cPanel sending domain. Reply-To may be a different monitored
 * mailbox; it is not used for SPF, DKIM, or DMARC alignment.
 */
export function resolveMailIdentity(input: MailIdentityInput): MailIdentityResult {
  const sendingDomain = cleanDomain(input.sendingDomain);
  if (!sendingDomain) {
    return {
      ok: false,
      message: "Transactional email is not configured with a sending domain.",
    };
  }

  const smtpUser = input.smtpUser ? normalizeEmailAddress(input.smtpUser) : null;
  if (!smtpUser) {
    return {
      ok: false,
      message: "Transactional email is not configured with an SMTP mailbox.",
    };
  }

  if (emailDomain(smtpUser) !== sendingDomain) {
    return {
      ok: false,
      message: "The SMTP mailbox must be on the authenticated sending domain.",
    };
  }

  const requestedFrom = input.fromAddress?.trim()
    ? normalizeEmailAddress(input.fromAddress)
    : smtpUser;

  if (!requestedFrom) {
    return { ok: false, message: "The From address is not a valid email address." };
  }

  if (emailDomain(requestedFrom) !== sendingDomain) {
    return {
      ok: false,
      message: "The From address must use the authenticated sending domain.",
    };
  }

  const replyCandidate = input.replyTo?.trim()
    ? input.replyTo
    : input.fallbackReplyTo?.trim()
      ? input.fallbackReplyTo
      : null;
  const replyTo = replyCandidate ? normalizeEmailAddress(replyCandidate) : null;

  if (replyCandidate && !replyTo) {
    return { ok: false, message: "The Reply-To address is not a valid email address." };
  }

  return {
    ok: true,
    identity: {
      fromName: TRANSACTIONAL_FROM_NAME,
      fromAddress: requestedFrom,
      replyTo,
      envelopeFrom: smtpUser,
      sendingDomain,
    },
  };
}
