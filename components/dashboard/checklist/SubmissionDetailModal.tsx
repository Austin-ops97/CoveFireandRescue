"use client";

import { Button } from "@/components/site/Button";
import { Modal } from "@/components/ui/Modal";
import { FleetUnitReference } from "@/components/dashboard/checklist/FleetUnitReference";
import { PhotoGallery } from "@/components/dashboard/checklist/PhotoGallery";
import {
  answerNeedsAttention,
  findTemplateField,
  getAttentionAnswers,
  submissionHasAttentionItems,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
} from "@/lib/checklist/types";
import type { FleetUnitRecord } from "@/lib/fleet/types";
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
  fleetUnitsById?: Map<string, FleetUnitRecord>;
  isAdmin?: boolean;
  onClose: () => void;
};

export function SubmissionDetailModal({
  submission,
  template,
  resolvedPhotos,
  fleetUnitsById,
  isAdmin = false,
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

  const descriptionParts = [
    formatTimestamp(submission.submittedAt),
    submission.submittedByName,
  ].filter(Boolean);

  return (
    <Modal
      title={submission.templateName}
      description={descriptionParts.join(" · ")}
      onClose={onClose}
      size="lg"
      footer={
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {(submission.relatedFleetUnitId || submission.relatedFleetUnitName) && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
            Fleet unit
          </p>
          <div className="mt-1">
            <FleetUnitReference
              fleetUnitId={submission.relatedFleetUnitId}
              fleetUnitName={submission.relatedFleetUnitName}
              fleetUnitsById={fleetUnitsById}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

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

                  const needsHighlight =
                    fieldMatch !== null &&
                    answerNeedsAttention(fieldMatch.field, answer.value);

                  return (
                    <li
                      key={answer.fieldId}
                      className={`rounded-lg border px-3 py-2 ${
                        needsHighlight
                          ? "border-red-200/80 bg-red-50/60"
                          : "border-gray-100 bg-brand-gray-light/40"
                      }`}
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-medium text-brand-charcoal">{label}</span>
                        <span
                          className={
                            needsHighlight ? "font-semibold text-red-800" : "text-brand-gray"
                          }
                        >
                          {formatAnswerValue(answer.value)}
                        </span>
                      </div>
                      {(answer.photoFileIds ?? []).length > 0 && (
                        <div className="mt-2">
                          <PhotoGallery
                            fileIds={answer.photoFileIds ?? []}
                            resolvedPhotos={resolvedPhotos}
                            altPrefix={label}
                          />
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
          <div className="mt-2">
            <PhotoGallery
              fileIds={allPhotoIds}
              resolvedPhotos={resolvedPhotos}
              altPrefix="Checklist attachment"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
