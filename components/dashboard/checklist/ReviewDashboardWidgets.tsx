"use client";

import { Card } from "@/components/site/Card";
import {
  getAttentionAnswers,
  submissionHasAttentionItems,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
} from "@/lib/checklist/types";

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

type ReviewDashboardWidgetsProps = {
  submissions: ChecklistSubmissionRecord[];
  templateMap: Map<string, ChecklistTemplateRecord>;
  onSelectSubmission: (submission: ChecklistSubmissionRecord) => void;
};

export function ReviewDashboardWidgets({
  submissions,
  templateMap,
  onSelectSubmission,
}: ReviewDashboardWidgetsProps) {
  const totalInspections = submissions.length;
  const withFailures = submissions.filter((submission) => {
    const template = templateMap.get(submission.templateId) ?? null;
    return submissionHasAttentionItems(submission, template);
  }).length;
  const withPhotos = submissions.filter(
    (submission) =>
      submission.photoFileIds.length > 0 ||
      submission.answers.some((answer) => (answer.photoFileIds ?? []).length > 0)
  ).length;

  const failureByUnit = new Map<string, Map<string, number>>();
  const failureByTemplate = new Map<string, Map<string, number>>();

  for (const submission of submissions) {
    const template = templateMap.get(submission.templateId) ?? null;
    const attentionItems = getAttentionAnswers(submission, template);
    if (attentionItems.length === 0) continue;

    const unitKey = submission.relatedFleetUnitName ?? "No fleet unit";
    const unitMap = failureByUnit.get(unitKey) ?? new Map<string, number>();
    const templateMapFailures =
      failureByTemplate.get(submission.templateName) ?? new Map<string, number>();

    for (const item of attentionItems) {
      const label = `${item.label} Failed`;
      unitMap.set(label, (unitMap.get(label) ?? 0) + 1);
      templateMapFailures.set(label, (templateMapFailures.get(label) ?? 0) + 1);
    }

    failureByUnit.set(unitKey, unitMap);
    failureByTemplate.set(submission.templateName, templateMapFailures);
  }

  const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
            Total inspections
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-charcoal">{totalInspections}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
            With failures
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-red">{withFailures}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
            With photos
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-charcoal">{withPhotos}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-bold text-brand-charcoal">Failure summary by fleet unit</h3>
          {failureByUnit.size === 0 ? (
            <p className="mt-2 text-sm text-brand-gray">No failures in the current filter set.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {[...failureByUnit.entries()].map(([unitName, failures]) => (
                <li key={unitName}>
                  <p className="text-sm font-semibold text-brand-charcoal">{unitName}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-brand-gray">
                    {[...failures.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => (
                        <li key={label}>
                          {label} ({count} time{count === 1 ? "" : "s"})
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-brand-charcoal">Failure summary by template</h3>
          {failureByTemplate.size === 0 ? (
            <p className="mt-2 text-sm text-brand-gray">No failures in the current filter set.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {[...failureByTemplate.entries()].map(([templateName, failures]) => (
                <li key={templateName}>
                  <p className="text-sm font-semibold text-brand-charcoal">{templateName}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-brand-gray">
                    {[...failures.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => (
                        <li key={label}>
                          {label} ({count} time{count === 1 ? "" : "s"})
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-bold text-brand-charcoal">Recent activity</h3>
        {recentSubmissions.length === 0 ? (
          <p className="mt-2 text-sm text-brand-gray">No recent submissions.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {recentSubmissions.map((submission) => (
              <li key={submission.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium text-brand-charcoal">{submission.templateName}</p>
                  <p className="text-xs text-brand-gray">
                    {formatTimestamp(submission.submittedAt)}
                    {submission.relatedFleetUnitName
                      ? ` · ${submission.relatedFleetUnitName}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectSubmission(submission)}
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
