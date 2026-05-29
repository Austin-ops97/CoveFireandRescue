"use client";

import { Button } from "@/components/site/Button";
import { Modal } from "@/components/ui/Modal";
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

  const description = [
    formatTimestamp(submission.submittedAt),
    submission.relatedFleetUnitName,
    submission.submittedByName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal
      title={submission.templateName}
      description={description}
      onClose={onClose}
      size="lg"
      footer={
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {hasAttention && attentionItems.length > 0 && (
        <div className="rounded-lg border border-red-200/80 bg-red-50/80 p-4">
          <p className="text-sm font-semibold text-red-950">Items needing attention</p>
          <ul className="mt-2 space-y-1.5 text-sm text-red-900">
            {attentionItems.map((item) => (
              <li key={item.fieldId}>
                {item.label}: {formatAnswerValue(item.value)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
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
                    <li
                      key={answer.fieldId}
                      className="rounded-lg border border-gray-100 bg-brand-gray-light/40 px-3 py-2"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-medium text-brand-charcoal">{label}</span>
                        <span className="text-brand-gray">{formatAnswerValue(answer.value)}</span>
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
                                className="aspect-video w-full rounded-lg object-cover"
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
        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-brand-charcoal">Notes</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-gray">{submission.notes}</p>
        </div>
      )}

      {allPhotoIds.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-5">
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
                  className="aspect-video w-full rounded-lg object-cover"
                />
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
