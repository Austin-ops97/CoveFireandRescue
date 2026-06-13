"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, SkeletonForm } from "@/components/ui";
import {
  ChecklistFieldInput,
  defaultAnswerForField,
} from "@/components/dashboard/checklist/ChecklistFieldInput";
import {
  MAX_SUBMISSION_PHOTOS,
  PhotoUploadControl,
  type PhotoUploadItem,
} from "@/components/dashboard/checklist/PhotoUploadControl";
import { useAuth } from "@/hooks/useAuth";
import { fetchActiveChecklistTemplates, submitChecklist } from "@/lib/checklist/client";
import {
  clearChecklistSubmissionDraft,
  loadChecklistSubmissionDraft,
  saveChecklistSubmissionDraft,
} from "@/lib/checklist/draft";
import { getChecklistScopeLabel, type ChecklistTemplateRecord } from "@/lib/checklist/types";
import {
  getFirstErrorSectionId,
  validateChecklistSubmissionClient,
} from "@/lib/checklist/validate-submission";
import { fetchPublicFleet } from "@/lib/fleet/client";
import type { FleetUnitRecord } from "@/lib/fleet/types";
import { uploadImageToB2 } from "@/lib/storage/client";

const inputClassName = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
const inputErrorClassName =
  "mt-1 w-full rounded-md border border-brand-red px-3 py-2 text-sm ring-1 ring-brand-red/30";

export function ChecklistSubmissionForm() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplateRecord[]>([]);
  const [fleet, setFleet] = useState<FleetUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [relatedFleetUnitId, setRelatedFleetUnitId] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, import("@/lib/checklist/types").FieldAnswerState>>({});
  const [generalPhotos, setGeneralPhotos] = useState<PhotoUploadItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fleetUnitError, setFleetUnitError] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const draftHydratedRef = useRef(false);
  const skipTemplateResetRef = useRef(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const selectedFleetUnit = useMemo(() => {
    if (!relatedFleetUnitId) return null;
    return fleet.find((unit) => unit.id === relatedFleetUnitId) ?? null;
  }, [fleet, relatedFleetUnitId]);

  const isArchivedFleetSelection = Boolean(
    relatedFleetUnitId && !selectedFleetUnit
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [templateItems, fleetItems] = await Promise.all([
        fetchActiveChecklistTemplates(),
        fetchPublicFleet(),
      ]);
      setTemplates(templateItems);
      setFleet(fleetItems);

      if (!draftHydratedRef.current) {
        const draft = loadChecklistSubmissionDraft();
        if (draft && templateItems.some((t) => t.id === draft.selectedTemplateId)) {
          skipTemplateResetRef.current = true;
          setSelectedTemplateId(draft.selectedTemplateId);
          setRelatedFleetUnitId(draft.relatedFleetUnitId);
          setNotes(draft.notes);
          setAnswers(draft.answers);
          setGeneralPhotos(
            draft.generalPhotoFileIds.map((fileId) => ({
              fileId,
              previewUrl: draft.generalPhotoPreviews[fileId] ?? "",
              status: "success" as const,
            }))
          );
          setDraftRestored(true);
          draftHydratedRef.current = true;
        } else if (templateItems.length > 0) {
          setSelectedTemplateId((current) => current || templateItems[0].id);
        }
      } else if (templateItems.length > 0) {
        setSelectedTemplateId((current) => current || templateItems[0].id);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load checklists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedTemplate) return;
    if (skipTemplateResetRef.current) {
      skipTemplateResetRef.current = false;
      return;
    }

    const nextAnswers: Record<string, import("@/lib/checklist/types").FieldAnswerState> = {};
    for (const section of selectedTemplate.sections) {
      for (const field of section.fields) {
        nextAnswers[field.id] = defaultAnswerForField(field);
      }
    }

    setAnswers(nextAnswers);
    setRelatedFleetUnitId("");
    setGeneralPhotos([]);
    setFieldErrors({});
    setFleetUnitError(null);
    setSubmitError(null);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplateId || loading) return;

    saveChecklistSubmissionDraft({
      selectedTemplateId,
      relatedFleetUnitId,
      notes,
      answers,
      generalPhotoFileIds: generalPhotos
        .filter((item) => item.status === "success")
        .map((item) => item.fileId),
      generalPhotoPreviews: generalPhotos.reduce<Record<string, string>>((acc, item) => {
        if (item.status === "success" && item.previewUrl) {
          acc[item.fileId] = item.previewUrl;
        }
        return acc;
      }, {}),
    });
  }, [selectedTemplateId, relatedFleetUnitId, notes, answers, generalPhotos, loading]);

  function scrollToSection(sectionId: string) {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleGeneralPhotoUpload(file: File) {
    if (!selectedTemplate) return;
    if (generalPhotos.length >= MAX_SUBMISSION_PHOTOS) return;

    const tempId = `pending-${crypto.randomUUID()}`;
    const objectUrl = URL.createObjectURL(file);

    setGeneralPhotos((prev) => [
      ...prev,
      { fileId: tempId, previewUrl: objectUrl, status: "uploading" },
    ]);

    try {
      const uploaded = await uploadImageToB2({
        file,
        module: "rounds",
        relatedId: selectedTemplate.id,
      });

      setGeneralPhotos((prev) =>
        prev.map((item) =>
          item.fileId === tempId
            ? { fileId: uploaded.id, previewUrl: uploaded.publicUrl, status: "success" }
            : item
        )
      );
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload photo.";
      setGeneralPhotos((prev) =>
        prev.map((item) =>
          item.fileId === tempId
            ? { ...item, status: "error", errorMessage: message }
            : item
        )
      );
    }
  }

  function removeGeneralPhoto(fileId: string) {
    setGeneralPhotos((prev) => prev.filter((item) => item.fileId !== fileId));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTemplate) return;

    setSubmitError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setFleetUnitError(null);

    const validation = validateChecklistSubmissionClient({
      template: selectedTemplate,
      relatedFleetUnitId,
      answers,
    });

    if (!validation.valid) {
      const errorsMap: Record<string, string> = {};
      for (const err of validation.errors) {
        errorsMap[err.fieldId] = err.message;
      }
      setFieldErrors(errorsMap);
      if (validation.fleetUnitError) {
        setFleetUnitError(validation.fleetUnitError);
      }
      const firstSectionId = getFirstErrorSectionId(validation.errors);
      if (firstSectionId) scrollToSection(firstSectionId);
      else if (validation.fleetUnitError) {
        document.getElementById("fleetUnit")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (isArchivedFleetSelection) {
      setFleetUnitError("This fleet unit is archived. Please select an active unit.");
      document.getElementById("fleetUnit")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const uploading = generalPhotos.some((item) => item.status === "uploading");
    if (uploading) {
      setSubmitError("Please wait for photo uploads to finish.");
      return;
    }

    const generalPhotoFileIds = generalPhotos
      .filter((item) => item.status === "success")
      .map((item) => item.fileId);

    setSubmitting(true);

    const submissionAnswers = selectedTemplate.sections.flatMap((section) =>
      section.fields.map((field) => {
        const answer = answers[field.id] ?? defaultAnswerForField(field);
        return {
          fieldId: field.id,
          sectionId: section.id,
          value: answer.value,
          photoFileIds:
            field.type === "photo" && answer.photoFileIds.length > 0
              ? answer.photoFileIds
              : undefined,
        };
      })
    );

    try {
      const submitPayload = {
        templateId: selectedTemplate.id,
        relatedFleetUnitId:
          selectedTemplate.scope === "fleet" ? relatedFleetUnitId || null : null,
        notes: notes.trim() || undefined,
        photoFileIds: generalPhotoFileIds,
        answers: submissionAnswers,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("[ChecklistSubmissionForm] submitting checklist:", submitPayload);
      }

      await submitChecklist(submitPayload);

      clearChecklistSubmissionDraft();
      setSuccessMessage("Inspection submitted successfully.");
      setDraftRestored(false);
      setNotes("");
      setRelatedFleetUnitId("");
      setGeneralPhotos([]);

      const nextAnswers: Record<string, import("@/lib/checklist/types").FieldAnswerState> = {};
      for (const section of selectedTemplate.sections) {
        for (const field of section.fields) {
          nextAnswers[field.id] = defaultAnswerForField(field);
        }
      }
      setAnswers(nextAnswers);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit checklist.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <SkeletonForm />;
  }

  if (loadError) {
    return (
      <AlertBanner variant="error" title="Could not load checklists" onRetry={() => void loadData()}>
        {loadError}
      </AlertBanner>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <h3 className="font-bold text-brand-charcoal">No checklist templates available</h3>
        <p className="mt-2 text-sm text-brand-gray">
          An administrator must create and activate reusable checklist templates before
          submissions can be recorded.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <p className="text-sm">
        <Link href="/dashboard" className="font-medium text-brand-red hover:underline">
          ← Back to Dashboard
        </Link>
        {" · "}
        <Link href="/dashboard/rounds/history" className="font-medium text-brand-red hover:underline">
          Checklist history
        </Link>
      </p>

      {draftRestored && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <p className="text-sm font-medium text-amber-900">
            Draft restored from previous session
          </p>
        </Card>
      )}

      {successMessage && (
        <Card className="border-l-4 border-l-green-600 bg-green-50/50">
          <p className="text-sm font-medium text-green-900">{successMessage}</p>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="template" className="block text-sm font-semibold text-brand-charcoal">
                Checklist Template
              </label>
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className={inputClassName}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({getChecklistScopeLabel(template.scope)})
                  </option>
                ))}
              </select>
              {selectedTemplate?.description ? (
                <p className="mt-1 text-xs text-brand-gray">{selectedTemplate.description}</p>
              ) : null}
            </div>

            {selectedTemplate?.scope === "fleet" && (
              <div>
                <label htmlFor="fleetUnit" className="block text-sm font-semibold text-brand-charcoal">
                  Fleet Unit <span className="text-brand-red">*</span>
                </label>
                <select
                  id="fleetUnit"
                  value={relatedFleetUnitId}
                  onChange={(event) => {
                    setRelatedFleetUnitId(event.target.value);
                    setFleetUnitError(null);
                  }}
                  className={fleetUnitError ? inputErrorClassName : inputClassName}
                  aria-invalid={Boolean(fleetUnitError)}
                >
                  <option value="">Select apparatus…</option>
                  {fleet.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                      {unit.unitNumber ? ` (#${unit.unitNumber})` : ""} — {unit.type}
                    </option>
                  ))}
                </select>
                {fleetUnitError ? (
                  <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
                    {fleetUnitError}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {selectedTemplate?.scope === "fleet" && relatedFleetUnitId && (
            <div className="rounded-md border border-gray-200 bg-brand-gray-light/30 px-4 py-3">
              {isArchivedFleetSelection ? (
                <p className="text-sm font-semibold text-amber-900">Archived Unit</p>
              ) : selectedFleetUnit ? (
                <>
                  <p className="text-sm font-semibold text-brand-charcoal">{selectedFleetUnit.name}</p>
                  <p className="mt-0.5 text-sm text-brand-gray">
                    {selectedFleetUnit.unitNumber
                      ? `Unit #${selectedFleetUnit.unitNumber} · `
                      : ""}
                    {selectedFleetUnit.type}
                  </p>
                </>
              ) : null}
            </div>
          )}

          <p className="text-sm text-brand-gray">
            Submitted by:{" "}
            <strong className="text-brand-charcoal">
              {profile?.displayName ?? profile?.email ?? "Signed-in member"}
            </strong>
          </p>

          {selectedTemplate?.sections.map((section) => (
            <div
              key={section.id}
              ref={(element) => {
                sectionRefs.current[section.id] = element;
              }}
              className="space-y-3 border-t border-gray-100 pt-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-brand-charcoal">{section.title}</h3>
                {section.description ? (
                  <p className="mt-1 text-xs text-brand-gray">{section.description}</p>
                ) : null}
              </div>
              <ul className="space-y-3">
                {section.fields.map((field) => (
                  <li
                    key={field.id}
                    className={`rounded-md border px-4 py-3 ${
                      fieldErrors[field.id] ? "border-brand-red/50 bg-red-50/30" : "border-gray-200"
                    }`}
                  >
                    <p className="text-sm font-medium text-brand-charcoal">
                      {field.label}
                      {field.required ? <span className="text-brand-red"> *</span> : null}
                    </p>
                    {field.helpText ? (
                      <p className="mt-0.5 text-xs text-brand-gray">{field.helpText}</p>
                    ) : null}
                    <div className="mt-2">
                      <ChecklistFieldInput
                        field={field}
                        sectionId={section.id}
                        templateId={selectedTemplate.id}
                        answer={answers[field.id] ?? defaultAnswerForField(field)}
                        disabled={submitting}
                        error={fieldErrors[field.id]}
                        onChange={(next) => {
                          setAnswers((prev) => ({ ...prev, [field.id]: next }));
                          if (fieldErrors[field.id]) {
                            setFieldErrors((prev) => {
                              const nextErrors = { ...prev };
                              delete nextErrors[field.id];
                              return nextErrors;
                            });
                          }
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-brand-charcoal">
              Additional notes
            </label>
            <textarea
              id="notes"
              rows={4}
              maxLength={5000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={inputClassName}
            />
          </div>

          <PhotoUploadControl
            label="Additional photos"
            items={generalPhotos}
            disabled={submitting}
            onUpload={(file) => void handleGeneralPhotoUpload(file)}
            onRemove={removeGeneralPhoto}
          />

          {submitError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || generalPhotos.some((item) => item.status === "uploading")}
          >
            {submitting ? "Submitting…" : "Submit checklist"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
