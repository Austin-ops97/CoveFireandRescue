"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/auth/roles";
import { canAccessDashboard } from "@/lib/auth/roles";
import { Card } from "@/components/site/Card";

type RequireAuthProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

export function RequireAuth({
  children,
  allowedRoles = ["admin", "member"],
}: RequireAuthProps) {
  const router = useRouter();
  const { configured, loading, user, profile, role } = useAuth();

  useEffect(() => {
    if (!configured || loading) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
    }
  }, [configured, loading, user, router]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">Authentication not configured</h2>
          <p className="mt-2 text-sm text-brand-gray">
            Add Firebase keys to <code className="text-xs">.env.local</code> to enable member
            login and dashboard access.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline">
            Return home
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <p className="text-sm text-brand-gray">Loading member session…</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <p className="text-sm text-brand-gray">Redirecting to login…</p>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">Access pending</h2>
          <p className="mt-2 text-sm text-brand-gray">
            Your Firebase account is signed in, but no Cove Fire &amp; Rescue member profile was
            found. An administrator must create your <code className="text-xs">users/&#123;uid&#125;</code>{" "}
            document in Firestore before you can access the dashboard.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline">
            Return home
          </Link>
        </Card>
      </div>
    );
  }

  if (!profile.active) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">Account inactive</h2>
          <p className="mt-2 text-sm text-brand-gray">
            Your member profile is inactive. Contact a department administrator if you believe
            this is an error.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline">
            Return home
          </Link>
        </Card>
      </div>
    );
  }

  if (!canAccessDashboard(role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">Unauthorized</h2>
          <p className="mt-2 text-sm text-brand-gray">
            Your account does not have permission to access this area.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline">
            Return home
          </Link>
        </Card>
      </div>
    );
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card>
          <h2 className="text-lg font-bold text-brand-charcoal">Insufficient permissions</h2>
          <p className="mt-2 text-sm text-brand-gray">
            This module requires a different role. Contact a department administrator if you need
            access.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline">
            Back to dashboard
          </Link>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
