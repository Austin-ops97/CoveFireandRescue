"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
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
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-charcoal">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red disabled:bg-gray-50"
            placeholder="member@covefirerescue.org"
            disabled={inputsDisabled}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-charcoal">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red disabled:bg-gray-50"
            placeholder="••••••••"
            disabled={inputsDisabled}
            required
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={inputsDisabled}>
          {isLoading
            ? "Signing in…"
            : configured
              ? "Sign In"
              : "Sign In (Configure Firebase)"}
        </Button>
      </form>

      <p className="mt-6 rounded-md border border-gray-200 bg-brand-gray-light px-4 py-3 text-sm text-brand-charcoal">
        Member access is restricted to authorized Cove Fire &amp; Rescue personnel.
      </p>

      {!configured && (
        <div className="mt-4 rounded-md border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm text-brand-charcoal">
          <p className="font-semibold">Firebase is not configured</p>
          <p className="mt-1 text-brand-gray">
            Copy <code className="text-xs">.env.local.example</code> to{" "}
            <code className="text-xs">.env.local</code> and add your Firebase web app keys.
            Accounts are created manually by administrators — there is no public signup.
          </p>
        </div>
      )}
    </Card>
  );
}
