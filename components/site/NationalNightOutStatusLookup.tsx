"use client";

import { useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, FormField, Input, StatusBadge, type StatusVariant } from "@/components/ui";
import { lookupNationalNightOutStatus } from "@/lib/national-night-out/client";
import {
  type NationalNightOutPublicStatus,
  type NationalNightOutStatus,
} from "@/lib/national-night-out/types";

function statusVariant(status: NationalNightOutStatus): StatusVariant {
  switch (status) {
    case "pending":
      return "info";
    case "under_review":
      return "warning";
    case "approved":
      return "pass";
    case "denied":
      return "fail";
  }
}

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function NationalNightOutStatusLookup() {
  const [requestId, setRequestId] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NationalNightOutPublicStatus | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const status = await lookupNationalNightOutStatus(requestId, email);
      setResult(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check request status.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
          {error ? (
            <AlertBanner variant="error" title="Status unavailable">
              {error}
            </AlertBanner>
          ) : null}
          <FormField id="nno-lookup-id" label="Request ID" required>
            <Input
              id="nno-lookup-id"
              name="requestId"
              required
              autoComplete="off"
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="NNO-ABC123"
            />
          </FormField>
          <FormField
            id="nno-lookup-email"
            label="Email address"
            required
            hint="Use the email address entered when the request was submitted."
          >
            <Input
              id="nno-lookup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Checking…" : "Check Status"}
          </Button>
        </form>
      </Card>

      {result ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-blue">
              {result.requestId}
            </span>
            <StatusBadge label={result.statusLabel} variant={statusVariant(result.status)} />
          </div>
          <h2 className="mt-3 text-xl font-bold text-brand-charcoal">{result.statusLabel}</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Request ID</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.requestId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Current status</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.statusLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Request / event type</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.eventType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Submitted date</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{formatDate(result.submittedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Requested event date</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.requestedEventDate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Last updated</dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{formatDate(result.lastUpdated)}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
