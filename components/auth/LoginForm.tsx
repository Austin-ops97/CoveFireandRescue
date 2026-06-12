"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { FormField, Input } from "@/components/ui/FormField";
import { FirebaseConfigDebug } from "@/components/auth/FirebaseConfigDebug";
import { canAccessDashboard } from "@/lib/auth/roles";
import { getFriendlyAuthErrorMessage } from "@/lib/firebase/errors";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormProps {
  /** When true, renders without outer Card wrapper (for login page layout). */
  embedded?: boolean;
}

export function LoginForm({ embedded = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured, loading, user, role, signInWithEmailPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    if (loading || !user || !canAccessDashboard(role)) return;
    router.replace(nextPath);
  }, [loading, user, role, router, nextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    setSubmitting(true);
    setError(null);

    try {
      await signInWithEmailPassword(email, password);
      router.replace(nextPath);
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputsDisabled = !configured || loading || submitting;
  const isLoading = submitting;

  const formContent = (
    <>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-label="Member login">
        <FormField id="email" label="Email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@covefirerescue.org"
            disabled={inputsDisabled}
            required
          />
        </FormField>

        <FormField id="password" label="Password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={inputsDisabled}
            required
          />
        </FormField>

        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <Button type="submit" variant="primary" className="w-full" disabled={inputsDisabled}>
          {isLoading
            ? "Signing in…"
            : configured
              ? "Sign In"
              : "Sign In (Configure Firebase)"}
        </Button>
      </form>

      <p className="mt-6 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-text-dark">
        Member access is restricted to authorized Cove Fire &amp; Rescue personnel.
      </p>

      {!configured && (
        <AlertBanner variant="warning" title="Firebase is not configured" className="mt-4">
          Copy <code className="text-xs">.env.local.example</code> to{" "}
          <code className="text-xs">.env.local</code> and add your Firebase web app keys.
          Accounts are created manually by administrators — there is no public signup.
        </AlertBanner>
      )}

      <FirebaseConfigDebug />
    </>
  );

  if (embedded) {
    return formContent;
  }

  return <Card>{formContent}</Card>;
}
