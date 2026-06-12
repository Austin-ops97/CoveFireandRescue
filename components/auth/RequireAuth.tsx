"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/auth/roles";
import { canAccessDashboard } from "@/lib/auth/roles";
import { Card } from "@/components/site/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";

type RequireAuthProps = {
  children: ReactNode;
  allowedRoles?: UserRole[];
};

function AuthGate({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Card>
        <h2 className="text-lg font-semibold text-brand-charcoal">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-gray">{description}</p>
        <Link
          href={href}
          className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-brand-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 rounded"
        >
          {linkLabel}
        </Link>
      </Card>
    </div>
  );
}

export function RequireAuth({
  children,
  allowedRoles = ["admin", "editor", "viewer", "member"],
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
      <AuthGate
        title="Authentication not configured"
        description="Add Firebase keys to .env.local to enable member login and dashboard access."
        href="/"
        linkLabel="Return home"
      />
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SkeletonCard rows={2} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <EmptyState
          title="Signing you in"
          description="Redirecting to the member login page…"
        />
      </div>
    );
  }

  if (!profile) {
    console.warn("[auth/gate] Access pending", {
      firebaseAuthUid: user.uid,
      firebaseAuthEmail: user.email,
      reason: "profile_is_null",
      failingCheck: "RequireAuth: !profile",
      hint:
        "Client Firestore lookup returned null or threw. Check browser console for [auth/profile] logs.",
    });
    return (
      <AuthGate
        title="Access pending"
        description="Your Firebase account is signed in, but no Cove Fire & Rescue member profile was found. An administrator must create your users/{uid} document in Firestore before you can access the dashboard."
        href="/"
        linkLabel="Return home"
      />
    );
  }

  if (!profile.active) {
    return (
      <AuthGate
        title="Account inactive"
        description="Your member profile is inactive. Contact a department administrator if you believe this is an error."
        href="/"
        linkLabel="Return home"
      />
    );
  }

  if (!canAccessDashboard(role)) {
    return (
      <AuthGate
        title="Unauthorized"
        description="Your account does not have permission to access this area."
        href="/"
        linkLabel="Return home"
      />
    );
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <AuthGate
        title="Insufficient permissions"
        description="This module requires a different role. Contact a department administrator if you need access."
        href="/dashboard"
        linkLabel="Back to dashboard"
      />
    );
  }

  return <>{children}</>;
}
