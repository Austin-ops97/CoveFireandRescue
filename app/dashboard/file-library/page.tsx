import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { FileStorageManager } from "@/components/dashboard/file-storage/FileStorageManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "File Storage",
  description: "Folder-based department file storage backed by Backblaze B2.",
};

export default function FileLibraryPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="File Storage"
        description="Manage folders, upload files, and organize department documents in Backblaze B2."
      >
        <FileStorageManager />
      </PageShell>
    </RequireAuth>
  );
}
