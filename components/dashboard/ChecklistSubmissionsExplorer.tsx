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
import { SubmissionDetailModal } from "@/components/dashboard/checklist/SubmissionDetailModal";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchActiveChecklistTemplates,
  fetchAdminChecklistTemplates,
  fetchChecklistSubmissions,
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
  submissionHasAttentionItems,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
  type ChecklistTemplateScope,
} from "@/lib/checklist/types";
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ChecklistSubmissionRecord | null>(
    null
  );
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [templateId, setTemplateId] = useState("");
  const [scope, setScope] = useState<ChecklistTemplateScope | "">("");
  const [relatedFleetUnitId, setRelatedFleetUnitId] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(isReview);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const prefs = loadExplorerPreferences(mode);
    setTemplateId(prefs.templateId);
    setScope((prefs.scope as ChecklistTemplateScope | "") || "");
    setRelatedFleetUnitId(prefs.relatedFleetUnitId);
    setSubmittedBy(prefs.submittedBy);
    setFromDate(prefs.fromDate);
    setToDate(prefs.toDate);
    setSearch(prefs.search);
    setAttentionOnly(isReview ? prefs.attentionOnly || true : prefs.attentionOnly);
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
      attentionOnly,
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
    attentionOnly,
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
      const [templateItems, submissionItems] = await Promise.all([
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
          attentionOnly: attentionOnly || undefined,
        }),
      ]);

      setTemplates(templateItems);
      setSubmissions(submissionItems);

      const photoIds = submissionItems.flatMap((item) => [
        ...item.photoFileIds,
        ...item.answers.flatMap((answer) => answer.photoFileIds ?? []),
      ]);

      if (photoIds.length > 0) {
        const files = await resolveStoredFiles(photoIds);
        setResolvedPhotos(files);
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
    attentionOnly,
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
          <div className={isAdmin ? "" : "sm:col-span-2"}>
            <label className="block text-sm font-semibold text-brand-charcoal">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Template, vehicle, inspector, notes…"
              className={inputClassName}
            />
          </div>
        </div>

        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(event) => setAttentionOnly(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
          />
          Show items needing attention only (fail / no)
        </label>

        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadSubmissions()}>
          Apply filters
        </Button>
      </Card>

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
          const hasAttention = submissionHasAttentionItems(submission, template);

          return (
            <Card
              key={submission.id}
              className={
                hasAttention ? "border-l-4 border-l-brand-red" : "border-l-4 border-l-green-600"
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
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
                    {formatTimestamp(submission.submittedAt)}
                    {submission.relatedFleetUnitName
                      ? ` · ${submission.relatedFleetUnitName}`
                      : ""}
                    {submission.submittedByName ? ` · ${submission.submittedByName}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  View details
                </Button>
              </div>
            </Card>
          );
        })}

      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          template={templateMap.get(selectedSubmission.templateId) ?? null}
          resolvedPhotos={resolvedPhotos}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
