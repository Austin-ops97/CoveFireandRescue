"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { FormField, Select, Textarea } from "@/components/ui/FormField";
import { deleteRequestTicket, updateRequestTicket } from "@/lib/request-tickets/client";
import {
  REQUEST_TICKET_PRIORITIES,
  REQUEST_TICKET_STATUSES,
  type RequestTicket,
  type RequestTicketPriority,
  type RequestTicketStatus,
} from "@/lib/request-tickets/types";

type RequestTicketAdminControlsProps = {
  ticket: RequestTicket;
  onUpdated: (ticket: RequestTicket) => void;
  onDeleted: (ticket: RequestTicket) => void;
};

export function RequestTicketAdminControls({
  ticket,
  onUpdated,
  onDeleted,
}: RequestTicketAdminControlsProps) {
  const [status, setStatus] = useState<RequestTicketStatus>(ticket.status);
  const [priority, setPriority] = useState<RequestTicketPriority>(ticket.priority);
  const [adminResponse, setAdminResponse] = useState(ticket.adminResponse ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAdminResponse(ticket.adminResponse ?? "");
  }, [ticket.adminResponse, ticket.priority, ticket.status]);

  const hasChanges =
    status !== ticket.status ||
    priority !== ticket.priority ||
    adminResponse.trim() !== (ticket.adminResponse ?? "").trim();

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateRequestTicket(ticket.id, {
        status,
        priority,
        adminResponse,
      });
      onUpdated(updated);
      setMessage("Request updated. The requester can now see the latest status and response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the request.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete ${ticket.ticketNumber} (${ticket.title})? This cannot be undone, and the requester will no longer be able to see it.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      await deleteRequestTicket(ticket.id);
      onDeleted(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the request.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-blue-700/15 bg-blue-700/[0.03] p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-bold text-brand-charcoal">Administrator response</h4>
        <p className="mt-1 text-xs leading-relaxed text-brand-gray">
          Update the queue status and leave a message the requester can see.
        </p>
      </div>

      {error ? (
        <AlertBanner variant="error" title="Request action failed" className="mt-4">
          {error}
        </AlertBanner>
      ) : null}
      {message ? (
        <AlertBanner variant="success" title="Request updated" className="mt-4">
          {message}
        </AlertBanner>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField id={`request-status-${ticket.id}`} label="Status">
          <Select
            id={`request-status-${ticket.id}`}
            value={status}
            disabled={saving || deleting}
            onChange={(event) => setStatus(event.target.value as RequestTicketStatus)}
          >
            {REQUEST_TICKET_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id={`request-priority-${ticket.id}`} label="Priority">
          <Select
            id={`request-priority-${ticket.id}`}
            value={priority}
            disabled={saving || deleting}
            onChange={(event) => setPriority(event.target.value as RequestTicketPriority)}
          >
            {REQUEST_TICKET_PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          id={`request-response-${ticket.id}`}
          label="Response to requester"
          hint="Optional. Add progress notes, purchasing details, or a resolution message."
          className="sm:col-span-2"
        >
          <Textarea
            id={`request-response-${ticket.id}`}
            rows={4}
            maxLength={2000}
            value={adminResponse}
            disabled={saving || deleting}
            onChange={(event) => setAdminResponse(event.target.value)}
            placeholder="Example: Supplies have been ordered and should arrive Thursday."
          />
        </FormField>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          disabled={saving || deleting || !hasChanges}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save update"}
        </Button>
        {!hasChanges ? (
          <p className="text-xs text-brand-gray">No unsaved changes.</p>
        ) : null}
      </div>

      <div className="mt-5 border-t border-red-200/70 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-charcoal">Delete this request</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-gray">
              Permanently removes the ticket from the administrator queue and the requester&apos;s
              history. The deletion itself remains recorded in the audit log.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            disabled={saving || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? "Deleting…" : "Delete request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
