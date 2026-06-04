import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ContactSubmissionsManager } from "@/components/dashboard/ContactSubmissionsManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Contact Submissions",
  description: "Review non-emergency messages from the public contact form.",
};

export default function ContactSubmissionsDashboardPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="Contact Submissions"
        description="Messages from the public contact form. Not visible to the public."
      >
        <ContactSubmissionsManager />
      </PageShell>
    </RequireAuth>
  );
}
