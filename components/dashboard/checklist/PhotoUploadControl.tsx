"use client";

import { Button } from "@/components/site/Button";

export const MAX_SUBMISSION_PHOTOS = 10;

export type PhotoUploadItem = {
  fileId: string;
  previewUrl: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
};

type PhotoUploadControlProps = {
  label: string;
  items: PhotoUploadItem[];
  disabled?: boolean;
  maxPhotos?: number;
  onUpload: (file: File) => void;
  onRemove: (fileId: string) => void;
};

export function PhotoUploadControl({
  label,
  items,
  disabled = false,
  maxPhotos = MAX_SUBMISSION_PHOTOS,
  onUpload,
  onRemove,
}: PhotoUploadControlProps) {
  const atLimit = items.length >= maxPhotos;
  const uploadingCount = items.filter((item) => item.status === "uploading").length;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-brand-charcoal">{label}</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        disabled={disabled || atLimit || uploadingCount > 0}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onUpload(file);
        }}
        className="block w-full max-w-full text-sm text-brand-gray file:mr-3 file:rounded-md file:border-0 file:bg-brand-red file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      <p className="text-xs text-brand-gray">
        {items.length} / {maxPhotos} photos · 15 MB max per image
        {uploadingCount > 0 ? ` · Uploading ${uploadingCount}…` : ""}
      </p>

      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.fileId}
              className="overflow-hidden rounded-md border border-gray-200 bg-white"
            >
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt="Uploaded inspection photo"
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-brand-gray-light/40 text-sm text-brand-gray">
                  Preview unavailable
                </div>
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span
                  className={`text-xs font-semibold ${
                    item.status === "success"
                      ? "text-green-800"
                      : item.status === "error"
                        ? "text-brand-red"
                        : "text-brand-gray"
                  }`}
                >
                  {item.status === "uploading"
                    ? "Uploading…"
                    : item.status === "success"
                      ? "Upload complete"
                      : (item.errorMessage ?? "Upload failed")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || item.status === "uploading"}
                  onClick={() => onRemove(item.fileId)}
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
