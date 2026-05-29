"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { FormField, Input } from "@/components/ui/FormField";
import { getFriendlyAuthErrorMessage } from "@/lib/firebase/errors";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured, loading, signInWithEmailPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/dashboard";

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

  return (
    <Card>
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

        <Button type="submit" className="w-full" disabled={inputsDisabled}>
          {isLoading
            ? "Signing in…"
            : configured
              ? "Sign In"
              : "Sign In (Configure Firebase)"}
        </Button>
      </form>

      <p className="mt-6 rounded-lg border border-gray-100 bg-brand-gray-light/80 px-4 py-3 text-sm leading-relaxed text-brand-charcoal">
        Member access is restricted to authorized Cove Fire &amp; Rescue personnel.
      </p>

      {!configured && (
        <AlertBanner variant="warning" title="Firebase is not configured" className="mt-4">
          Copy <code className="text-xs">.env.local.example</code> to{" "}
          <code className="text-xs">.env.local</code> and add your Firebase web app keys.
          Accounts are created manually by administrators — there is no public signup.
        </AlertBanner>
      )}
    </Card>
  );
}
