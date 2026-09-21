"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  EmptyState,
  FormField,
  Input,
  ListToolbar,
  Modal,
  Select,
  Textarea,
  SkeletonCardList,
  StatusBadge,
  type StatusVariant,
} from "@/components/ui";
import {
  deleteNationalNightOutRequest,
  fetchAdminNationalNightOutRequests,
  fetchAdminNationalNightOutSettings,
  updateNationalNightOutRequestStatus,
  updateNationalNightOutSettings,
} from "@/lib/national-night-out/admin-client";
import {
  NNO_STATUS_LABELS,
  NNO_STATUSES,
  type NationalNightOutNotificationResult,
  type NationalNightOutRequestRecord,
  type NationalNightOutStatus,
} from "@/lib/national-night-out/types";

type StatusFilter = "all" | NationalNightOutStatus;

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

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

function notificationFeedback(notification: NationalNightOutNotificationResult): string {
  switch (notification.outcome) {
    case "sent":
      return "The requester was emailed.";
    case "logged":
      return "Email was recorded locally and not sent (delivery mode is log).";
    case "skipped":
      return "No additional email was sent because this update was already notified.";
    case "unconfigured":
      return notification.message ?? "Status was saved, but outgoing email is not configured.";
    case "failed":
      return notification.message ?? "Status was saved, but the email could not be sent.";
  }
}

function DetailField({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-brand-charcoal">
        {value.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export function NationalNightOutManager() {
  const [requests, setRequests] = useState<NationalNightOutRequestRecord[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settings, list] = await Promise.all([
        fetchAdminNationalNightOutSettings(),
        fetchAdminNationalNightOutRequests(),
      ]);
      setEnabled(settings.enabled);
      setRequests(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load National Night Out data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => requests.find((item) => item.id === selectedId) ?? null,
    [requests, selectedId]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!query) return true;

      return [
        request.requestId,
        request.requesterName,
        request.neighborhood,
        request.address,
        request.city,
        request.zipCode,
        request.email,
        request.phone,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [requests, search, statusFilter]);

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(
      NNO_STATUSES.map((status) => [status, 0])
    ) as Record<NationalNightOutStatus, number>;
    for (const item of requests) {
      byStatus[item.status] += 1;
    }
    return { all: requests.length, ...byStatus };
  }, [requests]);

  async function handleToggleEnabled(nextEnabled: boolean) {
    setSavingSettings(true);
    setError(null);
    setMessage(null);
    try {
      const settings = await updateNationalNightOutSettings(nextEnabled);
      setEnabled(settings.enabled);
      setMessage(
        settings.enabled
          ? "National Night Out requests are enabled. The homepage banner and public form are now available."
          : "National Night Out requests are disabled. The homepage banner is hidden and new public submissions are blocked."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update National Night Out setting.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleStatusChange(id: string, status: NationalNightOutStatus) {
    setUpdatingId(id);
    setError(null);
    setMessage(null);
    try {
      const result = await updateNationalNightOutRequestStatus(id, status, statusNote);
      setRequests((current) => current.map((item) => (item.id === id ? result.request : item)));
      setStatusNote(result.request.statusNote);
      setMessage(
        `${result.request.requestId} marked as ${NNO_STATUS_LABELS[result.request.status]}. ${notificationFeedback(result.notification)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!selected) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const deletedId = selected.id;
      const deletedRequestId = selected.requestId;
      await deleteNationalNightOutRequest(deletedId);
      setRequests((current) => current.filter((item) => item.id !== deletedId));
      setSelectedId(null);
      setConfirmDelete(false);
      setMessage(`${deletedRequestId} was permanently deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete request.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <SkeletonCardList count={4} />;

  if (error && requests.length === 0 && !message) {
    return (
      <AlertBanner variant="error" title="Could not load National Night Out requests">
        {error}
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="accent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-charcoal">National Night Out Requests</h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-gray">
              When enabled, the homepage banner is shown and the public can submit visit requests.
              Existing requests remain available here when the feature is disabled.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <StatusBadge
              label={enabled ? "Enabled" : "Disabled"}
              variant={enabled ? "pass" : "neutral"}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant={enabled ? "outline" : "primary"}
                size="sm"
                disabled={savingSettings || enabled}
                onClick={() => void handleToggleEnabled(true)}
              >
                {savingSettings && !enabled ? "Saving…" : "Enable"}
              </Button>
              <Button
                type="button"
                variant={enabled ? "danger" : "outline"}
                size="sm"
                disabled={savingSettings || !enabled}
                onClick={() => void handleToggleEnabled(false)}
              >
                {savingSettings && enabled ? "Saving…" : "Disable"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {message && (
        <AlertBanner variant="success" title="Updated">
          {message}
        </AlertBanner>
      )}
      {error && (
        <AlertBanner variant="error" title="Error">
          {error}
        </AlertBanner>
      )}

      {selected ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                ← Back to request list
              </Button>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-blue">
                  {selected.requestId}
                </span>
                <StatusBadge
                  label={NNO_STATUS_LABELS[selected.status]}
                  variant={statusVariant(selected.status)}
                />
              </div>
              <h3 className="mt-2 text-xl font-bold text-brand-charcoal">{selected.requesterName}</h3>
              <p className="mt-1 text-sm text-brand-gray">Submitted {formatDate(selected.createdAt)}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <DetailField label="Request ID" value={selected.requestId} />
            <DetailField label="Current status" value={NNO_STATUS_LABELS[selected.status]} />
            <DetailField label="Full name" value={selected.requesterName} />
            <DetailField label="Phone" value={selected.phone} />
            <DetailField label="Email" value={selected.email} />
            <DetailField label="Neighborhood / subdivision" value={selected.neighborhood} />
            <DetailField
              label="Complete event address"
              value={`${selected.address}\n${selected.city}, ${selected.zipCode}`}
              fullWidth
            />
            <DetailField label="Preferred visit time" value={selected.preferredTime} />
            <DetailField label="Estimated attendance" value={selected.estimatedAttendance} />
            <DetailField
              label="Gate / access instructions"
              value={selected.accessInstructions}
              fullWidth
            />
            <DetailField label="Additional comments" value={selected.comments} fullWidth />
            <DetailField label="Note to requester" value={selected.statusNote} fullWidth />
            <DetailField
              label="Last email status"
              value={
                selected.lastNotificationError
                  ? selected.lastNotificationError
                  : selected.lastNotifiedStatus
                    ? `Notified: ${NNO_STATUS_LABELS[selected.lastNotifiedStatus]}`
                    : "Not sent yet"
              }
              fullWidth
            />
            <DetailField
              label="Disclaimer acknowledgement"
              value={selected.disclaimerAccepted ? "Yes — disclaimer acknowledged" : "No"}
            />
            <DetailField label="Date/time submitted" value={formatDate(selected.createdAt)} />
            <DetailField label="Last updated" value={formatDate(selected.updatedAt)} />
          </dl>

          <div className="mt-6 rounded-xl border border-blue-700/15 bg-blue-700/[0.03] p-4 sm:p-5">
            <h4 className="text-sm font-bold text-brand-charcoal">Review actions</h4>
            <p className="mt-1 text-xs leading-relaxed text-brand-gray">
              Changing the status emails the requester. Saving the same status again does not send
              another email unless the note changed or the previous email did not go out.
            </p>
            <div className="mt-4">
              <FormField
                id="nno-status-note"
                label="Note to requester"
                hint="Included in the status email. For a denial, use this as the reason. It is not shown on the public status page."
              >
                <Textarea
                  id="nno-status-note"
                  value={statusNote}
                  maxLength={2000}
                  onChange={(event) => setStatusNote(event.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                disabled={updatingId === selected.id || deleting}
                onClick={() => void handleStatusChange(selected.id, "under_review")}
              >
                {updatingId === selected.id ? "Saving…" : "Mark Under Review"}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={updatingId === selected.id || deleting}
                onClick={() => void handleStatusChange(selected.id, "approved")}
              >
                {updatingId === selected.id ? "Saving…" : "Approve Request"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={updatingId === selected.id || deleting}
                onClick={() => void handleStatusChange(selected.id, "denied")}
              >
                {updatingId === selected.id ? "Saving…" : "Deny Request"}
              </Button>
              {selected.status !== "pending" ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={updatingId === selected.id || deleting}
                  onClick={() => void handleStatusChange(selected.id, "pending")}
                >
                  Mark as Submitted
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-red-200/70 pt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-charcoal">Delete Request</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-gray">
                  Permanently removes this National Night Out request. This cannot be undone.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                disabled={updatingId === selected.id || deleting}
                onClick={() => setConfirmDelete(true)}
              >
                Delete Request
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <ListToolbar
            title="Submitted requests"
            countLabel={`${filteredRequests.length} shown · ${counts.pending} submitted`}
            onRefresh={() => void load()}
            refreshing={loading}
          />

          <Card padding="md">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="nno-status-filter" label="Filter by status">
                <Select
                  id="nno-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="all">All ({counts.all})</option>
                  {NNO_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {NNO_STATUS_LABELS[status]} ({counts[status]})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                id="nno-search"
                label="Search"
                hint="Requester name, neighborhood, address, or request ID"
              >
                <Input
                  id="nno-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search requests"
                />
              </FormField>
            </div>
          </Card>

          {filteredRequests.length === 0 ? (
            <EmptyState
              title={requests.length === 0 ? "No National Night Out requests yet" : "No matching requests"}
              description={
                requests.length === 0
                  ? "Public submissions will appear here once National Night Out requests are enabled."
                  : "Try a different status filter or search term."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setError(null);
                    setStatusNote(request.statusNote);
                    setSelectedId(request.id);
                  }}
                  className="block w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-brand-blue/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-blue">
                          {request.requestId}
                        </span>
                        <StatusBadge
                          label={NNO_STATUS_LABELS[request.status]}
                          variant={statusVariant(request.status)}
                        />
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-brand-charcoal">
                        {request.requesterName}
                      </h3>
                      <p className="mt-1 text-sm text-brand-gray">{request.neighborhood}</p>
                      <p className="mt-1 text-sm text-brand-gray">
                        {request.address}, {request.city} {request.zipCode}
                      </p>
                    </div>
                    <div className="shrink-0 text-sm text-brand-gray sm:text-right">
                      <p>
                        <span className="font-semibold text-brand-charcoal">Preferred:</span>{" "}
                        {request.preferredTime}
                      </p>
                      <p className="mt-1">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {confirmDelete && selected ? (
        <Modal
          title="Delete National Night Out request?"
          description={`Are you sure you want to permanently delete this National Night Out request? This action cannot be undone. (${selected.requestId})`}
          onClose={() => {
            if (!deleting) setConfirmDelete(false);
          }}
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleting}
                onClick={() => void handleDeleteConfirmed()}
              >
                {deleting ? "Deleting…" : "Delete Request"}
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}
