"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import { deleteApplication, fetchAdminApplications } from "@/lib/applications/admin-client";
import type { ApplicationRecord } from "@/lib/applications/types";

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function ApplicationDetail({
  record,
  deleting,
  onDelete,
}: {
  record: ApplicationRecord;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-brand-charcoal">{record.fullName}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-brand-blue">
            {record.status}
          </span>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={() => onDelete(record.id)}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-sm text-brand-gray">Submitted {formatDate(record.submittedAt)}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-brand-charcoal">Email</dt>
          <dd className="text-brand-gray">{record.email}</dd>
        </div>
        <div>
          <dt className="font-semibold text-brand-charcoal">Phone</dt>
          <dd className="text-brand-gray">{record.phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-brand-charcoal">Address / City</dt>
          <dd className="text-brand-gray">{record.addressOrCity}</dd>
        </div>
        {record.priorExperience && (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-brand-charcoal">Prior experience</dt>
            <dd className="whitespace-pre-wrap text-brand-gray">{record.priorExperience}</dd>
          </div>
        )}
        {record.availability && (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-brand-charcoal">Availability</dt>
            <dd className="whitespace-pre-wrap text-brand-gray">{record.availability}</dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="font-semibold text-brand-charcoal">Why they want to join</dt>
          <dd className="whitespace-pre-wrap text-brand-gray">{record.reasonForJoining}</dd>
        </div>
      </dl>
    </Card>
  );
}

export function ApplicationsManager() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApplications(await fetchAdminApplications());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    const record = applications.find((item) => item.id === id);
    const name = record?.fullName ?? "this application";

    if (!window.confirm(`Delete the application from ${name}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      await deleteApplication(id);
      setApplications((current) => current.filter((item) => item.id !== id));
      setMessage("Application deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <SkeletonCardList count={3} />;

  if (error && applications.length === 0) {
    return (
      <AlertBanner variant="error" title="Could not load applications">
        {error}
      </AlertBanner>
    );
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Volunteer applications submitted from the public Join Us page will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <AlertBanner variant="success" title="Deleted">
          {message}
        </AlertBanner>
      )}
      {error && (
        <AlertBanner variant="error" title="Error">
          {error}
        </AlertBanner>
      )}
      {applications.map((record) => (
        <ApplicationDetail
          key={record.id}
          record={record}
          deleting={deletingId === record.id}
          onDelete={(applicationId) => void handleDelete(applicationId)}
        />
      ))}
    </div>
  );
}
