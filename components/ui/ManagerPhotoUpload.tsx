"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/site/Button";

export type ManagerPhotoItem = {
  fileId: string;
  previewUrl: string | null;
};

type ManagerPhotoUploadProps = {
  label: string;
  photos: ManagerPhotoItem[];
  disabled?: boolean;
  uploading?: boolean;
  uploadError?: string | null;
  /** When true, user must save the record before uploading */
  requiresSavedRecord?: boolean;
  recordSaved?: boolean;
  maxPhotos?: number;
  aspectClassName?: string;
  hint?: string;
  onUpload: (file: File) => void;
  onRemove?: (fileId: string) => void;
};

export function ManagerPhotoUpload({
  label,
  photos,
  disabled = false,
  uploading = false,
  uploadError = null,
  requiresSavedRecord = true,
  recordSaved = false,
  maxPhotos = 1,
  aspectClassName = "aspect-video",
  hint = "JPEG, PNG, WebP, HEIC, or HEIF up to 4.5 MB.",
  onUpload,
  onRemove,
}: ManagerPhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = !requiresSavedRecord || recordSaved;
  const atLimit = photos.length >= maxPhotos;
  const canReplace = atLimit && maxPhotos === 1;
  const uploadDisabled = disabled || uploading || (atLimit && !canReplace);

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-charcoal">{label}</p>
          <p className="mt-1 text-xs text-brand-gray">{hint}</p>
        </div>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              disabled={uploadDisabled}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onUpload(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadDisabled}
              onClick={() => inputRef.current?.click()}
            >
              {uploading
                ? "Uploading…"
                : canReplace
                  ? "Replace photo"
                  : atLimit
                    ? "Photo limit reached"
                    : "Add photo"}
            </Button>
          </>
        )}
      </div>

      {!canUpload && (
        <p className="text-sm text-brand-gray">
          Save this record first, then you can upload {maxPhotos === 1 ? "a photo" : "photos"}.
        </p>
      )}

      {canUpload && maxPhotos > 1 && (
        <p className="text-xs text-brand-gray">
          {photos.length} / {maxPhotos} photos
        </p>
      )}

      {photos.length > 0 && (
        <ul className={`grid gap-3 ${maxPhotos === 1 ? "max-w-sm" : "sm:grid-cols-2"}`}>
          {photos.map((photo, index) => (
            <li key={photo.fileId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {photo.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.previewUrl}
                  alt={`${label} ${index + 1}`}
                  className={`${aspectClassName} w-full object-cover`}
                />
              ) : (
                <div
                  className={`flex ${aspectClassName} items-center justify-center bg-brand-gray-light text-sm text-brand-gray`}
                >
                  Photo attached
                </div>
              )}
              {onRemove && (
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
                  <span className="text-xs text-brand-gray">
                    {index === 0 && maxPhotos > 1 ? "Primary photo" : `Photo ${index + 1}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || uploading}
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => onRemove(photo.fileId)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {uploadError && (
        <p className="text-sm font-medium text-brand-red" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
