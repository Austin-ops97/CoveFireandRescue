"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type { AuditAction, AuditLogEntry } from "@/lib/audit/types";

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Request failed (${response.status})`;
}

export type AuditLogQuery = {
  targetType?: string;
  targetId?: string;
  action?: AuditAction;
  limit?: number;
};

export async function fetchAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (query.targetType) params.set("targetType", query.targetType);
  if (query.targetId) params.set("targetId", query.targetId);
  if (query.action) params.set("action", query.action);
  if (query.limit) params.set("limit", String(query.limit));

  const qs = params.toString();
  const response = await authenticatedFetch(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { logs?: AuditLogEntry[] };
  return Array.isArray(data.logs) ? data.logs : [];
}
