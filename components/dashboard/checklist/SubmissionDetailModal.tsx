"use client";

import { Button } from "@/components/site/Button";
import {
  findTemplateField,
  getAttentionAnswers,
  submissionHasAttentionItems,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
} from "@/lib/checklist/types";
import type { StoredFileRecord } from "@/lib/storage/types";

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

function formatAnswerValue(value: string | boolean | number | string[] | null): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "pass") return "Pass";
  if (value === "fail") return "Fail";
  if (value === "na") return "N/A";
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return String(value);
}

type SubmissionDetailModalProps = {
  submission: ChecklistSubmissionRecord;
  template: ChecklistTemplateRecord | null;
  resolvedPhotos: Record<string, StoredFileRecord>;
  onClose: () => void;
};

export function SubmissionDetailModal({
  submission,
  template,
  resolvedPhotos,
  onClose,
}: SubmissionDetailModalProps) {
  const attentionItems = getAttentionAnswers(submission, template);
  const hasAttention = submissionHasAttentionItems(submission, template);

  const answersBySection = new Map<string, typeof submission.answers>();
  for (const answer of submission.answers) {
    const list = answersBySection.get(answer.sectionId) ?? [];
    list.push(answer);
    answersBySection.set(answer.sectionId, list);
  }

  const allPhotoIds = [
    ...submission.photoFileIds,
    ...submission.answers.flatMap((answer) => answer.photoFileIds ?? []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-xl border border-gray-200 bg-white p-6 shadow-lg sm:rounded-xl"
        onClick={(event) => event.stopPropagation()}
        role="document"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="submission-detail-title" className="text-lg font-bold text-brand-charcoal">
              {submission.templateName}
            </h2>
            <p className="mt-1 text-sm text-brand-gray">
              {formatTimestamp(submission.submittedAt)}
              {submission.relatedFleetUnitName
                ? ` · ${submission.relatedFleetUnitName}`
                : ""}
              {submission.submittedByName ? ` · ${submission.submittedByName}` : ""}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {hasAttention && attentionItems.length > 0 && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50/60 p-3">
            <p className="text-sm font-semibold text-red-900">Items needing attention</p>
            <ul className="mt-2 space-y-1 text-sm text-red-900">
              {attentionItems.map((item) => (
                <li key={item.fieldId}>
                  {item.label}: {formatAnswerValue(item.value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {(template?.sections ?? []).map((section) => {
            const sectionAnswers = answersBySection.get(section.id) ?? [];
            if (sectionAnswers.length === 0) return null;

            return (
              <div key={section.id}>
                <p className="text-sm font-semibold text-brand-charcoal">{section.title}</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {sectionAnswers.map((answer) => {
                    const fieldMatch = template ? findTemplateField(template, answer.fieldId) : null;
                    const label = fieldMatch?.field.label ?? answer.fieldId;

                    return (
                      <li key={answer.fieldId} className="rounded-md bg-brand-gray-light/30 px-2 py-1">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium text-brand-charcoal">{label}</span>
                          <span>{formatAnswerValue(answer.value)}</span>
                        </div>
                        {(answer.photoFileIds ?? []).length > 0 && (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {(answer.photoFileIds ?? []).map((fileId) => {
                              const file = resolvedPhotos[fileId];
                              if (!file?.publicUrl) return null;
                              return (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={fileId}
                                  src={file.publicUrl}
                                  alt={label}
                                  className="aspect-video w-full rounded-md object-cover"
                                />
                              );
                            })}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {submission.notes && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-brand-charcoal">Notes</p>
            <p className="mt-1 text-sm text-brand-gray">{submission.notes}</p>
          </div>
        )}

        {allPhotoIds.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-brand-charcoal">Photos</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {allPhotoIds.map((fileId) => {
                const file = resolvedPhotos[fileId];
                if (!file?.publicUrl) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={fileId}
                    src={file.publicUrl}
                    alt="Checklist attachment"
                    className="aspect-video w-full rounded-md object-cover"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
