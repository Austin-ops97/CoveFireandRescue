"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { Modal } from "@/components/ui/Modal";
import { AlertBanner, EmptyState, SkeletonCardList, StatusBadge } from "@/components/ui";
import {
  fetchChecklistSubmissions,
  purgeChecklistSubmission,
  restoreChecklistSubmission,
} from "@/lib/checklist/client";
import {
  getChecklistScopeLabel,
  submissionHasAttentionItems,
  type ChecklistSubmissionRecord,
} from "@/lib/checklist/types";

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

export function ChecklistSubmissionTrash() {
  const [submissions, setSubmissions] = useState<ChecklistSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<ChecklistSubmissionRecord | null>(null);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchChecklistSubmissions({ deletedOnly: true });
      setSubmissions(items);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load trash.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrash();
  }, [loadTrash]);

  async function handleRestore(submission: ChecklistSubmissionRecord) {
    setActionId(submission.id);
    setActionError(null);

    try {
      await restoreChecklistSubmission(submission.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to restore submission.");
    } finally {
      setActionId(null);
    }
  }

  async function handlePurge() {
    if (!purgeTarget) return;

    setActionId(purgeTarget.id);
    setActionError(null);

    try {
      await purgeChecklistSubmission(purgeTarget.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== purgeTarget.id));
      setPurgeTarget(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to permanently delete submission."
      );
    } finally {
      setActionId(null);
    }
  }

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
          <h2 className="text-lg font-bold text-brand-charcoal">Submission Trash</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Deleted submissions are kept here for recovery. Permanently deleted records cannot be
            restored.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadTrash()}>
          Refresh
        </Button>
      </div>

      {actionError && (
        <AlertBanner variant="error" title="Action failed">
          {actionError}
        </AlertBanner>
      )}

      {loading && <SkeletonCardList count={3} />}

      {loadError && (
        <AlertBanner variant="error" title="Could not load trash">
          {loadError}
        </AlertBanner>
      )}

      {!loading && !loadError && submissions.length === 0 && (
        <EmptyState
          title="Trash is empty"
          description="Deleted checklist submissions will appear here."
        />
      )}

      {!loading &&
        !loadError &&
        submissions.map((submission) => {
          const hasAttention = submissionHasAttentionItems(submission);
          const isBusy = actionId === submission.id;

          return (
            <Card key={submission.id} className="border-l-4 border-l-gray-400 opacity-90">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label="Deleted" variant="neutral" />
                    <StatusBadge
                      label={hasAttention ? "Needs attention" : "Clear"}
                      variant={hasAttention ? "attention" : "pass"}
                    />
                    <StatusBadge
                      label={getChecklistScopeLabel(submission.scope)}
                      variant="neutral"
                    />
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-brand-charcoal">
                    {submission.templateName}
                  </h3>
                  <p className="mt-1 text-sm text-brand-gray">
                    Submitted {formatTimestamp(submission.submittedAt)}
                    {submission.submittedByName ? ` · ${submission.submittedByName}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-brand-gray">
                    Deleted {formatTimestamp(submission.deletedAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleRestore(submission)}
                  >
                    {isBusy ? "Working…" : "Restore"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setPurgeTarget(submission)}
                  >
                    Permanently Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

      {purgeTarget && (
        <Modal
          title="Permanently Delete Submission"
          description="This action cannot be undone. The submission record will be removed from the database."
          onClose={() => setPurgeTarget(null)}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPurgeTarget(null)}
                disabled={actionId === purgeTarget.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={actionId === purgeTarget.id}
                className="bg-red-700 hover:bg-red-800 focus-visible:ring-red-700/40"
                onClick={() => void handlePurge()}
              >
                {actionId === purgeTarget.id ? "Deleting…" : "Permanently Delete"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-brand-gray">
            You are about to permanently delete{" "}
            <span className="font-semibold text-brand-charcoal">{purgeTarget.templateName}</span>.
          </p>
        </Modal>
      )}
    </div>
  );
}
