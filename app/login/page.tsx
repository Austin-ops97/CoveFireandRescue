import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageShell } from "@/components/site/PageShell";
import { SkeletonForm } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Member and admin login for Cove Fire & Rescue.",
};

export default function LoginPage() {
  return (
    <PageShell
      title="Member Login"
      description="Secure access for department members and administrators."
      narrow
    >
      <Suspense
        fallback={<SkeletonForm />}
      >
        <LoginForm />
      </Suspense>
    </PageShell>
  );
}
