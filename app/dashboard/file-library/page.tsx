import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { FileLibraryManager } from "@/components/dashboard/FileLibraryManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "File Library",
  description: "Department documents and uploaded files stored in Backblaze B2.",
};

export default function FileLibraryPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="File Library"
        description="Department documents and uploaded files (Backblaze B2)."
      >
        <FileLibraryManager />
      </PageShell>
    </RequireAuth>
  );
}
