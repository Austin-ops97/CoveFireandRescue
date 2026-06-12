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

export function sanitizeB2Segment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function extractFileExtension(fileName: string): string {
  const match = fileName.match(/\.([a-zA-Z0-9]{1,10})$/);
  if (!match) return "";
  return `.${match[1].toLowerCase()}`;
}

export function sanitizeFileBaseName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return sanitizeB2Segment(withoutExtension) || "file";
}

function uniqueFileSuffix(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "-");
  const random = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${random}`;
}

/** Build a unique object key under a folder prefix for the file storage system. */
export function buildStorageFileKey(params: {
  backblazePrefix: string;
  originalFileName: string;
}): string {
  const prefix = params.backblazePrefix.replace(/\/$/, "").replace(/^\//, "");
  const extension = extractFileExtension(params.originalFileName);
  const baseName = sanitizeFileBaseName(params.originalFileName);
  const storedName = `${baseName}-${uniqueFileSuffix()}${extension}`;
  return prefix ? `${prefix}/${storedName}` : storedName;
}

export async function deleteB2File(params: {
  fileName: string;
  fileId: string;
}): Promise<void> {
  const auth = await authorizeB2();

  const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: params.fileName,
      fileId: params.fileId,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Backblaze delete failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`
    );
  }
}

export async function copyB2File(params: {
  sourceFileId: string;
  sourceFileName: string;
  destinationKey: string;
}): Promise<{ fileId: string; fileName: string }> {
  const config = getB2EnvConfig();
  const auth = await authorizeB2();
  const destinationKey = params.destinationKey.replace(/^\//, "");

  const response = await fetch(`${auth.apiUrl}/b2api/v2/b2_copy_file`, {
    method: "POST",
    headers: {
      Authorization: auth.authorizationToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileId: params.sourceFileId,
      bucketId: config.bucketId,
      fileName: destinationKey,
    }),
    cache: "no-store",
  });

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(
      `Backblaze copy failed (${response.status})${responseText ? `: ${responseText.slice(0, 240)}` : ""}`
    );
  }

  let data: { fileId?: string; fileName?: string };
  try {
    data = JSON.parse(responseText) as { fileId?: string; fileName?: string };
  } catch {
    throw new Error("Backblaze copy returned an invalid response.");
  }

  if (!data.fileId || !data.fileName) {
    throw new Error("Backblaze copy did not return file metadata.");
  }

  return { fileId: data.fileId, fileName: data.fileName };
}

export async function uploadBytesToB2(params: {
  bytes: Uint8Array;
  key: string;
  contentType: string;
}): Promise<{ fileId: string; fileName: string }> {
  const b2Key = params.key.replace(/^\//, "");
  const { uploadUrl, authorizationToken } = await getB2UploadUrl();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(b2Key),
      "Content-Type": params.contentType,
      "X-Bz-Content-Sha1": "do_not_verify",
    },
    body: Buffer.from(params.bytes),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Backblaze upload failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`
    );
  }

  const result = (await response.json()) as { fileId?: string; fileName?: string };
  if (!result.fileId || !result.fileName) {
    throw new Error("Backblaze did not return a file id.");
  }

  return { fileId: result.fileId, fileName: result.fileName };
}
