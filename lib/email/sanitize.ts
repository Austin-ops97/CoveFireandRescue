const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Remove characters that can break or inject email headers. */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]/g, " ").replace(/\s+/g, " ").trim();
}

export function isPlausibleEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return false;
  if (/[\r\n\0]/.test(trimmed)) return false;
  return EMAIL_PATTERN.test(trimmed);
}

export function normalizeEmailAddress(value: string): string | null {
  const trimmed = sanitizeHeaderValue(value).toLowerCase();
  if (!isPlausibleEmailAddress(trimmed)) return null;
  return trimmed;
}

export function emailDomain(value: string): string | null {
  const normalized = normalizeEmailAddress(value);
  if (!normalized) return null;
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
