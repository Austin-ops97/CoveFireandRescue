"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { fetchAuditLogs } from "@/lib/audit/client";
import type { AuditAction, AuditLogEntry } from "@/lib/audit/types";

const ACTION_LABELS: Record<string, string> = {
  "checklist.submission.created": "Submission created",
  "checklist.submission.deleted": "Submission deleted",
  "checklist.submission.restored": "Submission restored",
  "checklist.submission.purged": "Submission permanently deleted",
  "checklist.notification.acknowledged": "Notification acknowledged",
};

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }
  return "—";
}

function formatAction(action: AuditAction): string {
  return ACTION_LABELS[action] ?? action;
}

export function ChecklistAuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchAuditLogs({
        targetType: "checklistSubmission",
        limit: 200,
      });
      setLogs(items);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load audit history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/dashboard" className="font-medium text-brand-red hover:underline">
          ← Back to Dashboard
        </Link>
        {" · "}
        <Link href="/dashboard/rounds/review" className="font-medium text-brand-red hover:underline">
          Review submissions
        </Link>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">Checklist Audit History</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Accountability log for submission and notification actions.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadLogs()}>
          Refresh
        </Button>
      </div>

      {loading && <SkeletonCardList count={4} />}

      {loadError && (
        <AlertBanner variant="error" title="Could not load audit history">
          {loadError}
        </AlertBanner>
      )}

      {!loading && !loadError && logs.length === 0 && (
        <EmptyState
          title="No audit entries"
          description="Checklist submission activity will be recorded here."
        />
      )}

      {!loading &&
        !loadError &&
        logs.map((log) => (
          <Card key={log.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-charcoal">
                  {formatAction(log.action)}
                </p>
                {log.message && (
                  <p className="mt-1 text-sm text-brand-gray">{log.message}</p>
                )}
                <p className="mt-2 text-xs text-brand-gray">
                  {formatTimestamp(log.createdAt)}
                  {log.actorRole ? ` · ${log.actorRole}` : ""}
                  {log.targetId ? ` · Submission ${log.targetId.slice(0, 8)}…` : ""}
                </p>
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}
