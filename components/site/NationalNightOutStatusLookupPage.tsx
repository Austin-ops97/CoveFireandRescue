"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { AlertBanner, FormField, Input, StatusBadge, type StatusVariant } from "@/components/ui";
import { lookupNationalNightOutStatus } from "@/lib/national-night-out/client";
import {
  NNO_STATUS_LABELS,
  type NationalNightOutPublicStatus,
  type NationalNightOutStatus,
} from "@/lib/national-night-out/types";

function statusVariant(status: NationalNightOutStatus): StatusVariant {
  switch (status) {
    case "submitted":
      return "info";
    case "under_review":
      return "warning";
    case "approved":
      return "pass";
    case "denied":
      return "fail";
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function NationalNightOutStatusLookupPage() {
  const [requestId, setRequestId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NationalNightOutPublicStatus | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const status = await lookupNationalNightOutStatus({
        requestId: requestId.trim(),
        email: email.trim(),
      });
      setResult(status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t find a request matching that Request ID and email address."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      eyebrow="Community Events"
      title="Check Night Out Request Status"
      description="Enter your Request ID and the email address used when you submitted your National Night Out visit request."
      narrow
    >
      <Card>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
          {error ? (
            <AlertBanner variant="error" title="Unable to find request">
              {error}
            </AlertBanner>
          ) : null}

          <FormField id="nno-status-request-id" label="Request ID" required>
            <Input
              id="nno-status-request-id"
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              placeholder="NNO-ABCDEF"
              autoComplete="off"
              required
            />
          </FormField>

          <FormField
            id="nno-status-email"
            label="Email address used on the request"
            required
            hint="Must match the email submitted with the request."
          >
            <Input
              id="nno-status-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </FormField>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Checking…" : "Check Status"}
            </Button>
            <Link
              href="/national-night-out"
              className="text-sm font-semibold text-brand-blue hover:underline"
            >
              Back to request form
            </Link>
          </div>
        </form>
      </Card>

      {result ? (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-blue">
              {result.requestId}
            </span>
            <StatusBadge
              label={result.statusLabel || NNO_STATUS_LABELS[result.status]}
              variant={statusVariant(result.status)}
            />
          </div>

          <h2 className="mt-3 text-xl font-bold text-brand-charcoal">Request status</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Limited details are shown for your privacy. Officer notes and internal records are not
            displayed here.
          </p>

          <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Request ID
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.requestId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Current status
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">
                {result.statusLabel || NNO_STATUS_LABELS[result.status]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Request / event type
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.eventType}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Neighborhood
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.neighborhood}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Submitted date
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">
                {formatDate(result.submittedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Requested event date
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">
                {result.requestedEventDate}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Preferred visit time
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">{result.preferredTime}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                Last updated
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-charcoal">
                {formatDate(result.lastUpdatedAt)}
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </PageShell>
  );
}
