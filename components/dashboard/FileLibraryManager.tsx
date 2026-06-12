"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, InfoBanner, SkeletonCardList } from "@/components/ui";
import { deleteLibraryFile, fetchDocumentLibrary } from "@/lib/files/client";
import { uploadDocumentToB2 } from "@/lib/storage/client";
import type { StoredFileRecord } from "@/lib/storage/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function fileTypeLabel(contentType: string): string {
  if (contentType === "application/pdf") return "PDF";
  if (contentType.startsWith("image/")) return "Image";
  if (contentType.includes("word")) return "Word";
  if (contentType.includes("sheet") || contentType.includes("excel")) return "Excel";
  if (contentType === "text/plain") return "Text";
  return "File";
}

export function FileLibraryManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<StoredFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [b2Configured, setB2Configured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkB2() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { b2Configured?: boolean };
        if (!cancelled) setB2Configured(data.b2Configured === true);
      } catch {
        if (!cancelled) setB2Configured(null);
      }
    }

    void checkB2();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await fetchDocumentLibrary());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      await uploadDocumentToB2({ file });
      setMessage(`Uploaded ${file.name}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remove "${name}" from the library? The file metadata will be deleted.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      await deleteLibraryFile(id);
      setMessage("File removed from library.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {b2Configured === false ? (
        <AlertBanner variant="warning" title="Backblaze B2 not connected">
          File uploads are not configured yet. Add the six <code className="text-xs">B2_*</code>{" "}
          environment variables in Vercel (see docs/BACKBLAZE_B2_SETUP.md), redeploy, then confirm{" "}
          <code className="text-xs">/api/health</code> returns{" "}
          <code className="text-xs">b2Configured: true</code>.
        </AlertBanner>
      ) : b2Configured === true ? (
        <InfoBanner>
          <strong className="text-brand-charcoal">Department file storage.</strong> Files are stored
          in Backblaze B2. If uploads fail with &quot;Load failed&quot;, add CORS rules to your B2
          bucket (see <code className="text-xs">docs/BACKBLAZE_B2_SETUP.md</code>).
        </InfoBanner>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-brand-charcoal">Upload file</h3>
            <p className="mt-1 text-sm text-brand-gray">
              PDF, Word, Excel, plain text, or images up to 25 MB.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleUpload}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || b2Configured === false}
            >
              {uploading ? "Uploading…" : "Choose file"}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <AlertBanner variant="error" title="Error">
          {error}
        </AlertBanner>
      )}
      {message && (
        <AlertBanner variant="success" title="Success">
          {message}
        </AlertBanner>
      )}

      {loading ? (
        <SkeletonCardList count={3} />
      ) : files.length === 0 ? (
        <EmptyState
          title="No files yet"
          description="Upload department documents, forms, and reference files. They will appear here for administrators."
        />
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-base font-semibold text-brand-charcoal">
                    {file.originalFileName || file.fileName}
                  </h4>
                  <span className="rounded-full bg-brand-gray-light px-2 py-0.5 text-xs font-medium text-brand-gray">
                    {fileTypeLabel(file.contentType)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-gray">
                  {formatBytes(file.sizeBytes)} · Uploaded {formatDate(file.uploadedAt)}
                  {file.uploadedByName ? ` by ${file.uploadedByName}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={file.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center justify-center rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-text-dark shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-100"
                >
                  Open
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === file.id}
                  onClick={() =>
                    void handleDelete(file.id, file.originalFileName || file.fileName)
                  }
                >
                  {deletingId === file.id ? "Removing…" : "Remove"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
