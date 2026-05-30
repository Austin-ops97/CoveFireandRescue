"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { StoredFileRecord } from "@/lib/storage/types";

type PhotoGalleryProps = {
  fileIds: string[];
  resolvedPhotos: Record<string, StoredFileRecord>;
  altPrefix?: string;
  thumbnailClassName?: string;
};

function PhotoFallback({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-brand-gray-light/50 text-brand-gray"
      aria-label={label}
    >
      <span className="px-3 text-center text-xs font-medium">Photo unavailable</span>
    </div>
  );
}

export function PhotoGallery({
  fileIds,
  resolvedPhotos,
  altPrefix = "Attachment",
  thumbnailClassName = "aspect-video w-full rounded-lg object-cover",
}: PhotoGalleryProps) {
  const uniqueIds = [...new Set(fileIds.filter(Boolean))];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState("");

  if (uniqueIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {uniqueIds.map((fileId, index) => {
          const file = resolvedPhotos[fileId];
          const alt = `${altPrefix} ${index + 1}`;

          if (!file?.publicUrl) {
            return <PhotoFallback key={fileId} label={alt} />;
          }

          return (
            <button
              key={fileId}
              type="button"
              className="overflow-hidden rounded-lg border border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40"
              onClick={() => {
                setPreviewUrl(file.publicUrl ?? null);
                setPreviewAlt(alt);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.publicUrl} alt={alt} className={thumbnailClassName} />
            </button>
          );
        })}
      </div>

      {previewUrl ? (
        <Modal
          title="Photo preview"
          description={previewAlt}
          onClose={() => setPreviewUrl(null)}
          size="xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        </Modal>
      ) : null}
    </>
  );
}
