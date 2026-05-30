"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedFetch } from "@/lib/api/client";

type SetupResult =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function FirstAdminSetupPage() {
  const { configured, loading, user, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  async function handleCreateProfile() {
    setSubmitting(true);
    setResult(null);

    try {
      const response = await authenticatedFetch("/api/setup/first-admin", {
        method: "POST",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setResult({
          kind: "error",
          message: payload.error ?? "Failed to create first admin profile.",
        });
        return;
      }

      await refreshProfile();
      setResult({
        kind: "success",
        message: payload.message ?? "First admin profile created.",
      });
    } catch (error) {
      setResult({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create first admin profile.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="First Admin Setup"
      description="Bootstrap the first Cove Fire & Rescue administrator profile for your signed-in Firebase account."
      narrow
    >
      {!configured && (
        <AlertBanner variant="warning" title="Firebase is not configured">
          Add Firebase keys to <code className="text-xs">.env.local</code> before
          using this setup page.
        </AlertBanner>
      )}

      {configured && loading && <SkeletonCard rows={3} />}

      {configured && !loading && !user && (
        <Card>
          <h2 className="text-lg font-semibold text-brand-charcoal">Sign in required</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-gray">
            Sign in with your Firebase Auth account before creating the first admin
            profile.
          </p>
          <Link
            href="/login?next=/setup/first-admin"
            className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-brand-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 rounded"
          >
            Go to login
          </Link>
        </Card>
      )}

      {configured && !loading && user && (
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-medium text-brand-charcoal">Signed in as</p>
            <p className="mt-1 text-sm text-brand-gray">{user.email ?? user.uid}</p>
          </div>

          <p className="text-sm leading-relaxed text-brand-gray">
            This one-time setup creates a Firestore <code className="text-xs">users/{"{uid}"}</code>{" "}
            document for your account with <code className="text-xs">role: admin</code> and{" "}
            <code className="text-xs">active: true</code>. Use it only when no active
            administrator exists yet.
          </p>

          <AlertBanner variant="warning">
            After the first admin is created, this route disables itself automatically.
            Remove this setup page before production handoff if desired.
          </AlertBanner>

          {result?.kind === "error" && (
            <AlertBanner variant="error">{result.message}</AlertBanner>
          )}

          {result?.kind === "success" && (
            <AlertBanner variant="success">
              {result.message}{" "}
              <Link href="/dashboard" className="font-semibold underline">
                Go to dashboard
              </Link>
            </AlertBanner>
          )}

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={submitting || result?.kind === "success"}
            onClick={handleCreateProfile}
          >
            {submitting ? "Creating profile…" : "Create First Admin Profile"}
          </Button>
        </Card>
      )}
    </PageShell>
  );
}
