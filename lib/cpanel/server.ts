import "server-only";

const CPANEL_ENV_KEYS = [
  "CPANEL_API_TOKEN",
  "CPANEL_USERNAME",
  "CPANEL_HOST",
  "CPANEL_PORT",
  "CPANEL_EMAIL_DOMAIN",
] as const;

export type CpanelEnvConfig = {
  apiToken: string;
  username: string;
  host: string;
  port: number;
  emailDomain: string;
};

type CpanelUapiResponse = {
  status?: number;
  errors?: string[] | null;
  data?: unknown;
  metadata?: {
    reason?: string;
    result?: number;
  };
};

export class CpanelError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CpanelError";
    this.status = status;
    this.code = code;
  }
}

function normalizeCpanelHost(rawHost: string): string {
  const trimmed = rawHost.trim();
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed).hostname;
    }
  } catch {
    // Fall through to slash/path cleanup below.
  }

  return trimmed.replace(/\/.*$/, "").replace(/:\d+$/, "");
}

function getCpanelEnvConfig(): CpanelEnvConfig {
  const apiToken = process.env.CPANEL_API_TOKEN?.trim();
  const username = process.env.CPANEL_USERNAME?.trim();
  const hostRaw = process.env.CPANEL_HOST?.trim();
  const portRaw = process.env.CPANEL_PORT?.trim();
  const emailDomain = process.env.CPANEL_EMAIL_DOMAIN?.trim();

  const missing = CPANEL_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new CpanelError(
      503,
      "cpanel_not_configured",
      "Department email provisioning is not configured on this server."
    );
  }

  const host = normalizeCpanelHost(hostRaw!);
  if (!host) {
    throw new CpanelError(503, "cpanel_invalid_host", "Email server host is invalid.");
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new CpanelError(503, "cpanel_invalid_port", "Email server configuration is invalid.");
  }

  return {
    apiToken: apiToken!,
    username: username!,
    host,
    port,
    emailDomain: emailDomain!,
  };
}

export function isCpanelConfigured(): boolean {
  return CPANEL_ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function getCpanelEmailDomain(): string | null {
  return process.env.CPANEL_EMAIL_DOMAIN?.trim() || null;
}

function sanitizeCpanelError(errors: unknown): string {
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors.find((entry) => typeof entry === "string" && entry.trim());
    if (typeof first === "string") {
      const normalized = first.trim();
      if (/already exists|duplicate/i.test(normalized)) {
        return "An email account with this address already exists.";
      }
      if (/invalid|password/i.test(normalized)) {
        return "The email server rejected the mailbox settings. Check the username and password.";
      }
      return "The email server could not create the mailbox. Please try again or contact support.";
    }
  }

  return "The email server could not complete the request. Please try again later.";
}

async function cpanelUapiCall(
  module: string,
  func: string,
  params: Record<string, string | number>
): Promise<CpanelUapiResponse> {
  const config = getCpanelEnvConfig();
  const url = new URL(
    `/execute/${encodeURIComponent(module)}/${encodeURIComponent(func)}`,
    `https://${config.host}:${config.port}`
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `cpanel ${config.username}:${config.apiToken}`,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error("cPanel API request failed:", error);
    throw new CpanelError(
      502,
      "cpanel_unreachable",
      "Could not reach the email server. Please try again later."
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();

  if (response.status === 401 || response.status === 403) {
    console.error("cPanel API auth failed:", {
      status: response.status,
      module,
      func,
      contentType,
    });
    throw new CpanelError(
      502,
      "cpanel_auth_failed",
      "Email server authentication failed. Check the cPanel API token and username in Vercel, or regenerate the token in HostGator cPanel."
    );
  }

  let payload: CpanelUapiResponse;
  try {
    payload = JSON.parse(bodyText) as CpanelUapiResponse;
  } catch {
    const looksLikeHtml =
      /<html|<!doctype html|<title|cpanel login|security token/i.test(bodyText) ||
      contentType.includes("text/html");
    console.error("cPanel API returned invalid JSON:", {
      status: response.status,
      module,
      func,
      contentType,
      looksLikeHtml,
      bodyPreview: bodyText.slice(0, 200),
    });
    throw new CpanelError(
      502,
      "cpanel_invalid_response",
      looksLikeHtml
        ? "Email server returned a login/HTML page instead of an API response. Usually the HostGator cPanel API token, username, or host is wrong or expired — update CPANEL_* in Vercel after regenerating the token."
        : "Received an unexpected response from the email server."
    );
  }

  const succeeded = payload.status === 1 || payload.metadata?.result === 1;
  if (!response.ok || !succeeded) {
    console.error("cPanel API error:", {
      status: response.status,
      module,
      func,
      reason: payload.metadata?.reason,
      errors: payload.errors,
    });
    throw new CpanelError(502, "cpanel_operation_failed", sanitizeCpanelError(payload.errors));
  }

  return payload;
}

export async function cpanelAddEmailPop(
  emailUsername: string,
  password: string,
  quotaMb: number
): Promise<void> {
  const config = getCpanelEnvConfig();

  await cpanelUapiCall("Email", "add_pop", {
    email: emailUsername,
    password,
    domain: config.emailDomain,
    quota: quotaMb,
  });
}

export async function cpanelResetEmailPassword(
  emailUsername: string,
  password: string
): Promise<void> {
  const config = getCpanelEnvConfig();

  await cpanelUapiCall("Email", "passwd_pop", {
    email: emailUsername,
    domain: config.emailDomain,
    password,
  });
}

export async function cpanelSupportsUnlimitedQuota(): Promise<boolean> {
  if (!isCpanelConfigured()) return false;

  try {
    const response = await cpanelUapiCall("Email", "get_max_email_quota", {});
    const data = response.data;
    if (data && typeof data === "object" && "maximum" in data) {
      const maximum = Number((data as { maximum?: unknown }).maximum);
      return Number.isFinite(maximum) && maximum === 0;
    }
  } catch (error) {
    console.warn("Could not determine unlimited email quota support:", error);
  }

  return true;
}

export async function cpanelEmailAccountExists(emailUsername: string): Promise<boolean> {
  const config = getCpanelEnvConfig();

  try {
    const response = await cpanelUapiCall("Email", "list_pops", {
      domain: config.emailDomain,
    });
    const data = response.data;
    if (!Array.isArray(data)) return false;

    const target = `${emailUsername}@${config.emailDomain}`.toLowerCase();
    return data.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as { email?: unknown; login?: unknown };
      const email =
        typeof record.email === "string"
          ? record.email.toLowerCase()
          : typeof record.login === "string"
            ? record.login.toLowerCase()
            : "";
      return email === target || email === emailUsername.toLowerCase();
    });
  } catch (error) {
    console.warn("Could not verify email account existence in cPanel:", error);
    return false;
  }
}

export function buildDepartmentEmailAddress(emailUsername: string): string {
  const config = getCpanelEnvConfig();
  return `${emailUsername}@${config.emailDomain}`;
}
