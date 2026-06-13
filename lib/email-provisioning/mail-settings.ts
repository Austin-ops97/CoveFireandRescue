export type MailClientSettings = {
  incomingServer: string;
  outgoingServer: string;
  imapPortSsl: number;
  pop3PortSsl: number;
  smtpPortSsl: number;
  authenticationRequired: boolean;
};

export function resolveMailHost(emailDomain: string, overrideHost?: string | null): string {
  const trimmed = overrideHost?.trim();
  if (trimmed) return trimmed;
  return `mail.${emailDomain}`;
}

export function buildMailClientSettings(
  emailDomain: string,
  options?: {
    mailHost?: string | null;
    imapPortSsl?: number;
    pop3PortSsl?: number;
    smtpPortSsl?: number;
  }
): MailClientSettings {
  return {
    incomingServer: resolveMailHost(emailDomain, options?.mailHost),
    outgoingServer: resolveMailHost(emailDomain, options?.mailHost),
    imapPortSsl: options?.imapPortSsl ?? 993,
    pop3PortSsl: options?.pop3PortSsl ?? 995,
    smtpPortSsl: options?.smtpPortSsl ?? 465,
    authenticationRequired: true,
  };
}

export function formatMailSetupText(
  emailAddress: string,
  settings: MailClientSettings,
  organizationName = "Cove Fire & Rescue"
): string {
  return [
    `${organizationName} — Email Setup (Secure SSL/TLS)`,
    "",
    `Email address: ${emailAddress}`,
    `Username: ${emailAddress}`,
    "Password: Use the password provided by your administrator",
    "",
    `Incoming server: ${settings.incomingServer}`,
    `IMAP port (SSL): ${settings.imapPortSsl}`,
    `POP3 port (SSL): ${settings.pop3PortSsl}`,
    "",
    `Outgoing server: ${settings.outgoingServer}`,
    `SMTP port (SSL): ${settings.smtpPortSsl}`,
    "",
    settings.authenticationRequired
      ? "IMAP, POP3, and SMTP require authentication."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatMailSetupQrPayload(
  emailAddress: string,
  settings: MailClientSettings
): string {
  return formatMailSetupText(emailAddress, settings);
}
