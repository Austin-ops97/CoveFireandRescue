import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequestTicketsManager } from "@/components/dashboard/RequestTicketsManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Request Tickets",
  description: "Submit and track department requests that need administrator attention.",
};

export default function RequestTicketsPage() {
  return (
    <RequireAuth allowedRoles={["admin", "editor", "viewer", "member"]}>
      <PageShell
        title="Request Tickets"
        description="Send supply, facility, equipment, and other department needs to administrators."
      >
        <RequestTicketsManager />
      </PageShell>
    </RequireAuth>
  );
}
