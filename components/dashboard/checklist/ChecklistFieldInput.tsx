"use client";

import { useState } from "react";
import { Button } from "@/components/site/Button";
import { MAX_SUBMISSION_PHOTOS } from "@/components/dashboard/checklist/PhotoUploadControl";
import type { ChecklistTemplateField, FieldAnswerState } from "@/lib/checklist/types";
import { uploadImageToB2 } from "@/lib/storage/client";

const inputClassName = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";
const inputErrorClassName =
  "mt-1 w-full rounded-md border border-brand-red px-3 py-2 text-sm ring-1 ring-brand-red/30";

type ChecklistFieldInputProps = {
  field: ChecklistTemplateField;
  sectionId: string;
  templateId: string;
  answer: FieldAnswerState;
  disabled?: boolean;
  error?: string;
  onChange: (next: FieldAnswerState) => void;
  onUploadError?: (message: string) => void;
};

export function ChecklistFieldInput({
  field,
  sectionId,
  templateId,
  answer,
  disabled = false,
  error,
  onChange,
  onUploadError,
}: ChecklistFieldInputProps) {
  const { value, photoFileIds, photoPreviews } = answer;
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const hasError = Boolean(error);
  const fieldInputClass = hasError ? inputErrorClassName : inputClassName;

  if (field.type === "pass_fail" || field.type === "pass_fail_na" || field.type === "yes_no") {
    const options =
      field.type === "pass_fail"
        ? [
            { value: "pass", label: "Pass" },
            { value: "fail", label: "Fail" },
          ]
        : field.type === "pass_fail_na"
          ? [
              { value: "pass", label: "Pass" },
              { value: "fail", label: "Fail" },
              { value: "na", label: "N/A" },
            ]
          : [
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ];

    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ ...answer, value: option.value })}
              className={`rounded-md border px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
                value === option.value
                  ? option.value === "fail" || option.value === "no"
                    ? "border-red-300 bg-red-50 text-red-800"
                    : option.value === "pass" || option.value === "yes"
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-gray-300 bg-gray-100 text-brand-charcoal"
                  : hasError
                    ? "border-brand-red/40 bg-white text-brand-gray"
                    : "border-gray-200 bg-white text-brand-gray"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "text" || field.type === "signature") {
    return (
      <div>
        <input
          type="text"
          disabled={disabled}
          placeholder={field.type === "signature" ? "Type full name" : undefined}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange({ ...answer, value: event.target.value })}
          className={fieldInputClass}
          aria-invalid={hasError}
        />
        {error ? (
          <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        <input
          type="number"
          disabled={disabled}
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange({
              ...answer,
              value: event.target.value === "" ? null : Number(event.target.value),
            })
          }
          className={fieldInputClass}
          aria-invalid={hasError}
        />
        {error ? (
          <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value === true}
            onChange={(event) => onChange({ ...answer, value: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            aria-invalid={hasError}
          />
          Checked
        </label>
        {error ? (
          <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <select
          disabled={disabled}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange({ ...answer, value: event.target.value || null })}
          className={fieldInputClass}
          aria-invalid={hasError}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1 text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "photo") {
    const atLimit = photoFileIds.length >= MAX_SUBMISSION_PHOTOS;

    return (
      <div className="space-y-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={disabled || uploading || atLimit}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;

            void (async () => {
              setUploading(true);
              setUploadStatus("Uploading…");
              try {
                const uploaded = await uploadImageToB2({
                  file,
                  module: "rounds",
                  relatedId: `${templateId}/${sectionId}/${field.id}`,
                });
                const nextIds = [...photoFileIds, uploaded.id];
                onChange({
                  value: null,
                  photoFileIds: nextIds,
                  photoPreviews: {
                    ...photoPreviews,
                    [uploaded.id]: uploaded.publicUrl,
                  },
                });
                setUploadStatus("Upload complete");
              } catch (uploadError) {
                const message =
                  uploadError instanceof Error ? uploadError.message : "Failed to upload photo.";
                setUploadStatus(message);
                onUploadError?.(message);
              } finally {
                setUploading(false);
              }
            })();
          }}
          className="block w-full max-w-full text-sm text-brand-gray file:mr-3 file:rounded-md file:border-0 file:bg-brand-red file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {uploadStatus ? (
          <p
            className={`text-xs font-medium ${uploadStatus === "Upload complete" ? "text-green-800" : uploadStatus === "Uploading…" ? "text-brand-gray" : "text-brand-red"}`}
          >
            {uploadStatus}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs font-medium text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
        {photoFileIds.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {photoFileIds.map((fileId) => (
              <li
                key={fileId}
                className="overflow-hidden rounded-md border border-gray-200 bg-white"
              >
                {photoPreviews[fileId] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreviews[fileId]}
                    alt={field.label}
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
                <div className="flex justify-end px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || uploading}
                    onClick={() => {
                      const nextIds = photoFileIds.filter((id) => id !== fileId);
                      const nextPreviews = { ...photoPreviews };
                      delete nextPreviews[fileId];
                      onChange({
                        ...answer,
                        photoFileIds: nextIds,
                        photoPreviews: nextPreviews,
                      });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return null;
}

export function defaultAnswerForField(field: ChecklistTemplateField): FieldAnswerState {
  if (field.type === "checkbox") {
    return { value: false, photoFileIds: [], photoPreviews: {} };
  }
  return { value: null, photoFileIds: [], photoPreviews: {} };
}

// Re-export for backward compatibility in imports
export type { FieldAnswerState };
