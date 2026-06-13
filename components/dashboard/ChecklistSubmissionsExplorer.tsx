"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  EmptyState,
  SkeletonCardList,
  StatusBadge,
} from "@/components/ui";
import { inputBase } from "@/lib/ui/classes";
import { ReviewDashboardWidgets } from "@/components/dashboard/checklist/ReviewDashboardWidgets";
import { FleetUnitReference } from "@/components/dashboard/checklist/FleetUnitReference";
import { PhotoGallery } from "@/components/dashboard/checklist/PhotoGallery";
import { SubmissionDetailModal } from "@/components/dashboard/checklist/SubmissionDetailModal";
import { DeleteSubmissionModal } from "@/components/dashboard/checklist/DeleteSubmissionModal";
import { SubmissionReviewStatus } from "@/components/dashboard/checklist/SubmissionReviewStatus";
import { AcknowledgeReviewForm } from "@/components/dashboard/checklist/AcknowledgeReviewForm";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchActiveChecklistTemplates,
  fetchAdminChecklistTemplates,
  fetchChecklistSubmissions,
  deleteChecklistSubmission,
  restoreChecklistSubmission,
  acknowledgeChecklistReview,
} from "@/lib/checklist/client";
import {
  getQuickFilterDates,
  loadExplorerPreferences,
  saveExplorerPreferences,
  type ExplorerPreferences,
} from "@/lib/checklist/explorer-preferences";
import {
  CHECKLIST_SCOPES,
  getChecklistScopeLabel,
  submissionNeedsReview,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
  type ChecklistTemplateScope,
  type SubmissionReviewFilter,
} from "@/lib/checklist/types";
import { fetchAdminFleet } from "@/lib/fleet/client";
import type { FleetUnitRecord } from "@/lib/fleet/types";
import { resolveStoredFiles } from "@/lib/storage/client";
import type { StoredFileRecord } from "@/lib/storage/types";

type ExplorerMode = "history" | "review";

const inputClassName = inputBase;

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

function sortSubmissions(
  submissions: ChecklistSubmissionRecord[],
  order: "newest" | "oldest"
): ChecklistSubmissionRecord[] {
  const sorted = [...submissions].sort((a, b) => {
    const aMs = typeof a.submittedAt === "string" ? Date.parse(a.submittedAt) : 0;
    const bMs = typeof b.submittedAt === "string" ? Date.parse(b.submittedAt) : 0;
    return bMs - aMs;
  });
  return order === "oldest" ? sorted.reverse() : sorted;
}

export function ChecklistSubmissionsExplorer({ mode }: { mode: ExplorerMode }) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const isReview = mode === "review";

  const [templates, setTemplates] = useState<ChecklistTemplateRecord[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmissionRecord[]>([]);
  const [resolvedPhotos, setResolvedPhotos] = useState<Record<string, StoredFileRecord>>({});
  const [fleetUnitsById, setFleetUnitsById] = useState<Map<string, FleetUnitRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmissionRecord | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ChecklistSubmissionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [templateId, setTemplateId] = useState("");
  const [scope, setScope] = useState<ChecklistTemplateScope | "">("");
  const [relatedFleetUnitId, setRelatedFleetUnitId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState<SubmissionReviewFilter>(
    isReview ? "needs_review" : "all"
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedAcknowledgeId, setExpandedAcknowledgeId] = useState<string | null>(null);

  useEffect(() => {
    const prefs = loadExplorerPreferences(mode);
    setTemplateId(prefs.templateId);
    setScope((prefs.scope as ChecklistTemplateScope | "") || "");
    setRelatedFleetUnitId(prefs.relatedFleetUnitId);
    setSubmittedBy(prefs.submittedBy);
    setFromDate(prefs.fromDate);
    setToDate(prefs.toDate);
    setSearch(prefs.search);
    setReviewFilter(
      prefs.reviewFilter ?? (isReview ? "needs_review" : "all")
    );
    setSortOrder(prefs.sortOrder);
    setPrefsLoaded(true);
  }, [mode, isReview]);

  useEffect(() => {
    if (!prefsLoaded) return;

    const prefs: ExplorerPreferences = {
      templateId,
      scope,
      relatedFleetUnitId,
      submittedBy,
      fromDate,
      toDate,
      search,
      attentionOnly: reviewFilter === "needs_review",
      reviewFilter,
      sortOrder,
    };
    saveExplorerPreferences(mode, prefs);
  }, [
    prefsLoaded,
    mode,
    templateId,
    scope,
    relatedFleetUnitId,
    submittedBy,
    fromDate,
    toDate,
    search,
    reviewFilter,
    sortOrder,
  ]);

  const templateMap = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates]
  );

  const inspectorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const submission of submissions) {
      if (!submission.submittedBy) continue;
      map.set(
        submission.submittedBy,
        submission.submittedByName ?? submission.submittedBy
      );
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [submissions]);

  const fleetOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const submission of submissions) {
      if (!submission.relatedFleetUnitId || !submission.relatedFleetUnitName) continue;
      map.set(submission.relatedFleetUnitId, submission.relatedFleetUnitName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [submissions]);

  const displayedSubmissions = useMemo(
    () => sortSubmissions(submissions, sortOrder),
    [submissions, sortOrder]
  );

  const loadSubmissions = useCallback(async () => {
    if (!prefsLoaded) return;

    setLoading(true);
    setLoadError(null);

    try {
      const [templateItems, submissionItems, fleetItems] = await Promise.all([
        (isAdmin ? fetchAdminChecklistTemplates() : fetchActiveChecklistTemplates()).catch(
          () => [] as ChecklistTemplateRecord[]
        ),
        fetchChecklistSubmissions({
          templateId: templateId || undefined,
          scope: scope || undefined,
          relatedFleetUnitId: relatedFleetUnitId || undefined,
          submittedBy: isAdmin ? submittedBy || undefined : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          search: search || undefined,
          reviewFilter: reviewFilter !== "all" ? reviewFilter : undefined,
        }),
        isAdmin
          ? fetchAdminFleet().catch(() => [] as FleetUnitRecord[])
          : Promise.resolve([] as FleetUnitRecord[]),
      ]);

      setTemplates(templateItems);
      setSubmissions(submissionItems);
      setFleetUnitsById(new Map(fleetItems.map((unit) => [unit.id, unit])));

      const photoIds = submissionItems.flatMap((item) => [
        ...item.photoFileIds,
        ...item.answers.flatMap((answer) => answer.photoFileIds ?? []),
      ]);

      if (photoIds.length > 0) {
        try {
          const files = await resolveStoredFiles(photoIds);
          setResolvedPhotos(files);
        } catch {
          setResolvedPhotos({});
        }
      } else {
        setResolvedPhotos({});
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [
    prefsLoaded,
    templateId,
    scope,
    relatedFleetUnitId,
    submittedBy,
    fromDate,
    toDate,
    search,
    reviewFilter,
    isAdmin,
  ]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  function applyQuickFilter(preset: "today" | "last7" | "last30" | "thisMonth") {
    const dates = getQuickFilterDates(preset);
    setFromDate(dates.fromDate);
    setToDate(dates.toDate);
  }

  async function handleDeleteSubmission() {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteChecklistSubmission(deleteTarget.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selectedSubmission?.id === deleteTarget.id) {
        setSelectedSubmission(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete submission."
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleSubmissionUpdated(updated: ChecklistSubmissionRecord) {
    setSubmissions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedSubmission(updated);
    if (reviewFilter === "needs_review" && updated.reviewStatus === "acknowledged") {
      setSubmissions((prev) => prev.filter((item) => item.id !== updated.id));
    }
    setExpandedAcknowledgeId(null);
  }

  async function handleRestoreSubmission(submission: ChecklistSubmissionRecord) {
    try {
      const restored = await restoreChecklistSubmission(submission.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      if (selectedSubmission?.id === submission.id) {
        setSelectedSubmission(restored);
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to restore submission.");
    }
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <p className="text-sm">
        <Link href="/dashboard" className="font-medium text-brand-red hover:underline">
          ← Back to Dashboard
        </Link>
        {" · "}
        <Link href="/dashboard/rounds" className="font-medium text-brand-red hover:underline">
          Submit checklist
        </Link>
        {isAdmin && (
          <>
            {" · "}
            <Link
              href="/dashboard/rounds/review"
              className="font-medium text-brand-red hover:underline"
            >
              Review
            </Link>
            {" · "}
            <Link
              href="/dashboard/checklist-templates"
              className="font-medium text-brand-red hover:underline"
            >
              Templates
            </Link>
            {" · "}
            <Link
              href="/dashboard/rounds/notifications"
              className="font-medium text-brand-red hover:underline"
            >
              Notifications
            </Link>
            {" · "}
            <Link
              href="/dashboard/rounds/trash"
              className="font-medium text-brand-red hover:underline"
            >
              Trash
            </Link>
            {" · "}
            <Link
              href="/dashboard/rounds/audit"
              className="font-medium text-brand-red hover:underline"
            >
              Audit log
            </Link>
          </>
        )}
      </p>

      {isReview && !loading && !loadError && (
        <ReviewDashboardWidgets
          submissions={displayedSubmissions}
          templateMap={templateMap}
          onSelectSubmission={setSelectedSubmission}
        />
      )}

      <Card>
        <h2 className="text-lg font-bold text-brand-charcoal">
          {isReview ? "Filter submissions for review" : "Filter history"}
        </h2>

        {!isReview && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickFilter("today")}>
              Today
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickFilter("last7")}>
              Last 7 Days
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyQuickFilter("last30")}>
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter("thisMonth")}
            >
              This Month
            </Button>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">Sort</label>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "newest" | "oldest")
              }
              className={inputClassName}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">Template</label>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className={inputClassName}
            >
              <option value="">All templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">Scope</label>
            <select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as ChecklistTemplateScope | "")
              }
              className={inputClassName}
            >
              <option value="">All scopes</option>
              {CHECKLIST_SCOPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">Fleet unit</label>
            <select
              value={relatedFleetUnitId}
              onChange={(event) => setRelatedFleetUnitId(event.target.value)}
              className={inputClassName}
            >
              <option value="">All fleet units</option>
              {fleetOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal">
                Submitted by
              </label>
              <select
                value={submittedBy}
                onChange={(event) => setSubmittedBy(event.target.value)}
                className={inputClassName}
              >
                <option value="">All inspectors</option>
                {inspectorOptions.map(([uid, name]) => (
                  <option key={uid} value={uid}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={isAdmin ? "sm:col-span-2" : "sm:col-span-2"}>
            <label className="block text-sm font-semibold text-brand-charcoal">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Template, vehicle, inspector, notes…"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal">Review status</label>
            <select
              value={reviewFilter}
              onChange={(event) =>
                setReviewFilter(event.target.value as SubmissionReviewFilter)
              }
              className={inputClassName}
            >
              <option value="all">All</option>
              <option value="needs_review">Needs Review</option>
              <option value="reviewed">Reviewed</option>
              {isAdmin && <option value="deleted">Deleted / Trash</option>}
            </select>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadSubmissions()}>
          Apply filters
        </Button>
      </Card>

      {deleteError && (
        <AlertBanner variant="error" title="Delete failed">
          {deleteError}
        </AlertBanner>
      )}

      {loading && <SkeletonCardList count={4} />}

      {loadError && (
        <AlertBanner variant="error" title="Could not load submissions">
          {loadError}
        </AlertBanner>
      )}

      {!loading && !loadError && submissions.length === 0 && (
        <EmptyState
          title="No submissions found"
          description="No inspections match the current filters. Try adjusting the date range or template."
        />
      )}

      {!loading &&
        !loadError &&
        displayedSubmissions.map((submission) => {
          const template = templateMap.get(submission.templateId) ?? null;
          const needsReview = submissionNeedsReview(submission, template);
          const isDeletedView = reviewFilter === "deleted";
          const submissionPhotoIds = [
            ...submission.photoFileIds,
            ...submission.answers.flatMap((answer) => answer.photoFileIds ?? []),
          ];

          return (
            <Card
              key={submission.id}
              className={
                needsReview
                  ? "border-l-4 border-l-brand-red"
                  : isDeletedView
                    ? "border-l-4 border-l-gray-400 opacity-90"
                    : "border-l-4 border-l-green-600"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SubmissionReviewStatus submission={submission} template={template} />
                    <StatusBadge
                      label={getChecklistScopeLabel(submission.scope)}
                      variant="neutral"
                    />
                    {isDeletedView && <StatusBadge label="Deleted" variant="neutral" />}
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-brand-charcoal">
                    {submission.templateName}
                  </h3>
                  <p className="mt-1 text-sm text-brand-gray">
                    {formatTimestamp(submission.submittedAt)}
                    {submission.submittedByName ? ` · ${submission.submittedByName}` : ""}
                  </p>
                  {(submission.relatedFleetUnitId || submission.relatedFleetUnitName) && (
                    <div className="mt-1.5">
                      <FleetUnitReference
                        fleetUnitId={submission.relatedFleetUnitId}
                        fleetUnitName={submission.relatedFleetUnitName}
                        fleetUnitsById={fleetUnitsById}
                        isAdmin={isAdmin}
                      />
                    </div>
                  )}
                  {submissionPhotoIds.length > 0 && (
                    <div className="mt-3 max-w-md">
                      <PhotoGallery
                        fileIds={submissionPhotoIds.slice(0, 4)}
                        resolvedPhotos={resolvedPhotos}
                        altPrefix={submission.templateName}
                        thumbnailClassName="aspect-video h-20 w-full rounded-md object-cover"
                      />
                    </div>
                  )}
                  {isAdmin && needsReview && expandedAcknowledgeId === submission.id && (
                    <div className="mt-3 max-w-lg">
                      <AcknowledgeReviewForm
                        compact
                        onSubmit={async (reviewNote) => {
                          const updated = await acknowledgeChecklistReview(
                            submission.id,
                            reviewNote
                          );
                          handleSubmissionUpdated(updated);
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    View details
                  </Button>
                  {isAdmin && needsReview && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setExpandedAcknowledgeId((current) =>
                          current === submission.id ? null : submission.id
                        )
                      }
                    >
                      Acknowledge Review
                    </Button>
                  )}
                  {isAdmin && isDeletedView && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRestoreSubmission(submission)}
                    >
                      Restore
                    </Button>
                  )}
                  {isAdmin && !isDeletedView && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteTarget(submission)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          template={templateMap.get(selectedSubmission.templateId) ?? null}
          resolvedPhotos={resolvedPhotos}
          fleetUnitsById={fleetUnitsById}
          isAdmin={isAdmin}
          onClose={() => setSelectedSubmission(null)}
          onSubmissionUpdated={handleSubmissionUpdated}
        />
      )}

      {deleteTarget && (
        <DeleteSubmissionModal
          onConfirm={() => void handleDeleteSubmission()}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
