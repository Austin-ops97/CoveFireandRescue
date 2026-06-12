import "server-only";

const B2_ENV_KEYS = [
  "B2_APPLICATION_KEY_ID",
  "B2_APPLICATION_KEY",
  "B2_BUCKET_ID",
  "B2_BUCKET_NAME",
  "B2_ENDPOINT",
  "B2_PUBLIC_BASE_URL",
] as const;

type B2Module = "announcements" | "fleet" | "rounds" | "leadership" | "documents";

type B2EnvConfig = {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string;
};

type B2AuthorizeResponse = {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl?: string;
};

type B2UploadUrlResponse = {
  uploadUrl: string;
  authorizationToken: string;
};

function getB2EnvConfig(): B2EnvConfig {
  const applicationKeyId = process.env.B2_APPLICATION_KEY_ID?.trim();
  const applicationKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucketId = process.env.B2_BUCKET_ID?.trim();
  const bucketName = process.env.B2_BUCKET_NAME?.trim();
  const endpoint = process.env.B2_ENDPOINT?.trim();
  const publicBaseUrl = process.env.B2_PUBLIC_BASE_URL?.trim();

  const missing = B2_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required Backblaze B2 environment variables: ${missing.join(", ")}`
    );
  }

  return {
    applicationKeyId: applicationKeyId!,
    applicationKey: applicationKey!,
    bucketId: bucketId!,
    bucketName: bucketName!,
    endpoint: endpoint!.replace(/\/$/, ""),
    publicBaseUrl: publicBaseUrl!.replace(/\/$/, ""),
  };
}

export function isB2Configured(): boolean {
  return B2_ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function assertB2Env(): void {
  getB2EnvConfig();
}

function basicAuthHeader(config: B2EnvConfig): string {
  const credentials = Buffer.from(
    `${config.applicationKeyId}:${config.applicationKey}`,
    "utf8"
  ).toString("base64");
  return `Basic ${credentials}`;
}

export async function authorizeB2(): Promise<{
  apiUrl: string;
  authorizationToken: string;
  downloadUrl?: string;
}> {
  const config = getB2EnvConfig();

  const response = await fetch(`${config.endpoint}/b2api/v2/b2_authorize_account`, {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(config),
    },
    cache: "no-store",
  });

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(
      `Backblaze B2 authorization failed (${response.status})${responseText ? `: ${responseText.slice(0, 240)}` : ""}`
    );
  }

  let data: B2AuthorizeResponse;
  try {
    data = JSON.parse(responseText) as B2AuthorizeResponse;
  } catch {
    throw new Error("Backblaze B2 authorization returned an invalid response.");
  }

  if (!data.apiUrl || !data.authorizationToken) {
    throw new Error("Backblaze B2 authorization returned an invalid response.");
  }

  return {
    apiUrl: data.apiUrl,
    authorizationToken: data.authorizationToken,
    downloadUrl: data.downloadUrl,
  };
}

export async function getB2UploadUrl(): Promise<{
  uploadUrl: string;
  authorizationToken: string;
}> {
  const config = getB2EnvConfig();
  const auth = await authorizeB2();

  const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bucketId: config.bucketId }),
    cache: "no-store",
  });

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(
      `Backblaze B2 upload URL request failed (${response.status})${responseText ? `: ${responseText.slice(0, 240)}` : ""}`
    );
  }

  let data: B2UploadUrlResponse;
  try {
    data = JSON.parse(responseText) as B2UploadUrlResponse;
  } catch {
    throw new Error("Backblaze B2 upload URL response was invalid.");
  }

  if (!data.uploadUrl || !data.authorizationToken) {
    throw new Error("Backblaze B2 upload URL response was invalid.");
  }

  return {
    uploadUrl: data.uploadUrl,
    authorizationToken: data.authorizationToken,
  };
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function extractExtension(fileName: string): string {
  const match = fileName.match(/\.([a-zA-Z0-9]{1,10})$/);
  if (!match) return "";
  return `.${match[1].toLowerCase()}`;
}

function sanitizeFileBase(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return sanitizeSegment(withoutExtension) || "file";
}

function todaySegment(): string {
  return new Date().toISOString().slice(0, 10);
}

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function buildB2FileKey(params: {
  module: B2Module;
  relatedId?: string | null;
  fileName: string;
}): string {
  const moduleSegment = sanitizeSegment(params.module);
  const relatedSegment = params.relatedId
    ? sanitizeSegment(params.relatedId)
    : "general";
  const extension = extractExtension(params.fileName);
  const baseName = sanitizeFileBase(params.fileName);
  const fileSegment = `${randomSegment()}-${baseName}${extension}`;

  return [moduleSegment, relatedSegment, todaySegment(), fileSegment].join("/");
}

export function getPublicB2Url(key: string): string {
  const config = getB2EnvConfig();
  const normalizedKey = key.replace(/^\//, "");
  return `${config.publicBaseUrl}/${normalizedKey}`;
}
