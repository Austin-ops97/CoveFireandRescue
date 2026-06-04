"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { fetchAdminContactSubmissions } from "@/lib/contact/admin-client";
import type { ContactSubmissionRecord } from "@/lib/contact/types";

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ContactSubmissionsManager() {
  const [submissions, setSubmissions] = useState<ContactSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubmissions(await fetchAdminContactSubmissions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <SkeletonCardList count={3} />;

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load messages">
        {error}
      </AlertBanner>
    );
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No contact messages yet"
        description="Messages from the public contact form will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((record) => (
        <Card key={record.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-brand-charcoal">{record.name}</h3>
            <span className="text-xs text-brand-gray">{formatDate(record.submittedAt)}</span>
          </div>
          <p className="mt-1 text-sm text-brand-gray">
            <a href={`mailto:${record.email}`} className="text-brand-blue hover:underline">
              {record.email}
            </a>
            {record.phone ? ` · ${record.phone}` : ""}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-gray">
            {record.message}
          </p>
        </Card>
      ))}
    </div>
  );
}
