import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SkeletonForm } from "@/components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Member and admin login for Cove Fire & Rescue.",
};

export default function LoginPage() {
  return (
    <PageShell
      eyebrow="Member Access"
      title="Member Login"
      description="Secure access for department members and administrators."
      narrow
    >
      <Card padding="none" className="overflow-hidden">
        <div className="bg-navy-900 px-6 py-5 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-gold-500">
            Cove Fire &amp; Rescue
          </p>
          <p className="mt-1 text-lg font-bold text-white">Department Member Portal</p>
        </div>
        <div className="p-6 sm:p-8">
          <Suspense fallback={<SkeletonForm />}>
            <LoginForm embedded />
          </Suspense>
        </div>
      </Card>
    </PageShell>
  );
}
