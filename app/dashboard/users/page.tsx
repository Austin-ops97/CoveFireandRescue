import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UserAccessManager } from "@/components/dashboard/UserAccessManager";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "User Access",
  description: "Manage authorized Cove Fire & Rescue personnel and access levels.",
};

export default function UserAccessPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <PageShell
        title="User Access"
        description="Manage authorized Cove Fire & Rescue personnel and their access level."
      >
        <UserAccessManager />
      </PageShell>
    </RequireAuth>
  );
}
