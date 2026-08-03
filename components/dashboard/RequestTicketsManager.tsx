"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RequestTicketAdminControls } from "@/components/dashboard/RequestTicketAdminControls";
import { DashboardStatCard } from "@/components/dashboard/home/DashboardStatCard";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { SkeletonCardList } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusVariant } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { createRequestTicket, fetchRequestTickets } from "@/lib/request-tickets/client";
import {
  REQUEST_TICKET_CATEGORIES,
  REQUEST_TICKET_PRIORITIES,
  REQUEST_TICKET_STATUSES,
  getRequestTicketCategoryLabel,
  getRequestTicketPriorityLabel,
  getRequestTicketStatusLabel,
  isRequestTicketOpen,
  type CreateRequestTicketPayload,
  type RequestTicket,
  type RequestTicketCategory,
  type RequestTicketPriority,
} from "@/lib/request-tickets/types";

const EMPTY_FORM: CreateRequestTicketPayload = {
  title: "",
  description: "",
  category: "supplies",
  location: "",
  priority: "normal",
};

type StatusFilter = "active" | "all" | RequestTicket["status"];
type PriorityFilter = "all" | RequestTicketPriority;
type CategoryFilter = "all" | RequestTicketCategory;

function parseTime(value: unknown): number {
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateTime(value: unknown): string {
  if (typeof value !== "string") return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusVariant(status: RequestTicket["status"]): StatusVariant {
  switch (status) {
    case "open":
      return "open";
    case "in_progress":
      return "info";
    case "resolved":
      return "completed";
    case "closed":
      return "neutral";
  }
}

function priorityVariant(priority: RequestTicketPriority): StatusVariant {
  switch (priority) {
    case "urgent":
      return "attention";
    case "high":
      return "warning";
    case "normal":
      return "neutral";
  }
}

function RequestTicketCard({
  ticket,
  isAdmin,
  onUpdated,
}: {
  ticket: RequestTicket;
  isAdmin: boolean;
  onUpdated: (ticket: RequestTicket) => void;
}) {
  return (
    <Card as="article" className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-blue">
              {ticket.ticketNumber}
            </span>
            <StatusBadge label={getRequestTicketStatusLabel(ticket.status)} variant={statusVariant(ticket.status)} />
            <StatusBadge
              label={`${getRequestTicketPriorityLabel(ticket.priority)} priority`}
              variant={priorityVariant(ticket.priority)}
            />
          </div>
          <h3 className="mt-3 text-lg font-bold text-brand-charcoal">{ticket.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-gray">
            {ticket.description}
          </p>
        </div>

        <StatusBadge label={getRequestTicketCategoryLabel(ticket.category)} variant="info" />
      </div>

      <dl className="mt-5 grid gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Submitted</dt>
          <dd className="mt-1 font-medium text-brand-charcoal">{formatDateTime(ticket.createdAt)}</dd>
        </div>
        {isAdmin ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Requester</dt>
            <dd className="mt-1 font-medium text-brand-charcoal">
              {ticket.submittedByName || ticket.submittedByEmail || "Department member"}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Location</dt>
          <dd className="mt-1 font-medium text-brand-charcoal">{ticket.location || "Not specified"}</dd>
        </div>
        {ticket.updatedByName ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Last updated by</dt>
            <dd className="mt-1 font-medium text-brand-charcoal">{ticket.updatedByName}</dd>
          </div>
        ) : null}
      </dl>

      {ticket.adminResponse ? (
        <div className="mt-5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">
            Administrator response
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950">
            {ticket.adminResponse}
          </p>
        </div>
      ) : null}

      {isAdmin ? (
        <RequestTicketAdminControls ticket={ticket} onUpdated={onUpdated} />
      ) : null}
    </Card>
  );
}

export function RequestTicketsManager() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [tickets, setTickets] = useState<RequestTicket[]>([]);
  const [form, setForm] = useState<CreateRequestTicketPayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTickets(await fetchRequestTickets());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load request tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const queueCounts = useMemo(() => {
    const active = tickets.filter((ticket) => isRequestTicketOpen(ticket.status));
    return {
      open: tickets.filter((ticket) => ticket.status === "open").length,
      inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
      urgent: active.filter((ticket) => ticket.priority === "urgent").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (statusFilter === "active" && !isRequestTicketOpen(ticket.status)) return false;
      if (statusFilter !== "active" && statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
      if (!query) return true;

      return [
        ticket.ticketNumber,
        ticket.title,
        ticket.description,
        ticket.location,
        ticket.submittedByName,
        ticket.submittedByEmail,
        ticket.adminResponse,
      ].some((value) => typeof value === "string" && value.toLowerCase().includes(query));
    });
  }, [categoryFilter, priorityFilter, search, statusFilter, tickets]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSubmitError(null);
    setMessage(null);

    try {
      const created = await createRequestTicket(form);
      setTickets((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setStatusFilter("active");
      setMessage(
        `${created.ticketNumber} was submitted. Administrators can now see it in their request queue.`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit the request.");
    } finally {
      setSaving(false);
    }
  }

  function handleUpdated(updated: RequestTicket) {
    setTickets((current) =>
      current
        .map((ticket) => (ticket.id === updated.id ? updated : ticket))
        .sort((a, b) => parseTime(b.updatedAt) - parseTime(a.updatedAt))
    );
  }

  return (
    <div className="space-y-10">
      <Card>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
            New department request
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-charcoal">What do you need?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-gray">
            Report low supplies, station needs, equipment problems, technology access issues, or
            any other request that needs administrator attention.
          </p>
        </div>

        {submitError ? (
          <AlertBanner variant="error" title="Request could not be submitted" className="mt-5">
            {submitError}
          </AlertBanner>
        ) : null}
        {message ? (
          <AlertBanner variant="success" title="Request sent" className="mt-5">
            {message}
          </AlertBanner>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleCreate}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="request-title" label="Request title" required className="sm:col-span-2">
              <Input
                id="request-title"
                required
                minLength={3}
                maxLength={120}
                value={form.title}
                disabled={saving}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Example: Paper towels are running low"
              />
            </FormField>

            <FormField id="request-category" label="Category" required>
              <Select
                id="request-category"
                required
                value={form.category}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as RequestTicketCategory,
                  }))
                }
              >
                {REQUEST_TICKET_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="request-priority"
              label="Priority"
              required
              hint="Use urgent only when the request affects immediate readiness or safety."
            >
              <Select
                id="request-priority"
                required
                value={form.priority}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as RequestTicketPriority,
                  }))
                }
              >
                {REQUEST_TICKET_PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="request-location"
              label="Location or unit"
              hint="Optional — identify a room, apparatus, cabinet, or other location."
              className="sm:col-span-2"
            >
              <Input
                id="request-location"
                maxLength={120}
                value={form.location ?? ""}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
                placeholder="Example: Station 91 kitchen or Engine 91"
              />
            </FormField>

            <FormField
              id="request-description"
              label="Description"
              required
              hint="Include enough detail for an administrator to understand and act on the request."
              className="sm:col-span-2"
            >
              <Textarea
                id="request-description"
                required
                minLength={5}
                maxLength={2000}
                rows={5}
                value={form.description}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe what is needed, where it is needed, and any timing concerns."
              />
            </FormField>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Card>

      {isAdmin ? (
        <section aria-labelledby="request-queue-overview" className="space-y-4">
          <div>
            <h2 id="request-queue-overview" className="text-lg font-bold text-brand-charcoal">
              Administrator queue overview
            </h2>
            <p className="mt-1 text-sm text-brand-gray">
              Live counts for requests submitted by department members.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard label="Open" value={queueCounts.open} />
            <DashboardStatCard label="In progress" value={queueCounts.inProgress} />
            <DashboardStatCard
              label="Urgent active"
              value={queueCounts.urgent}
              variant={queueCounts.urgent > 0 ? "attention" : "default"}
            />
            <DashboardStatCard label="Resolved" value={queueCounts.resolved} variant="success" />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="request-ticket-list" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="request-ticket-list" className="text-lg font-bold text-brand-charcoal">
              {isAdmin ? "Department request queue" : "My requests"}
            </h2>
            <p className="mt-1 text-sm text-brand-gray">
              {isAdmin
                ? "Review every submitted request and keep members informed as work progresses."
                : "Track the status of requests you have sent to administrators."}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        <Card variant="muted" padding="sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField id="request-filter-status" label="Status">
              <Select
                id="request-filter-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="active">Active requests</option>
                <option value="all">All statuses</option>
                {REQUEST_TICKET_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="request-filter-priority" label="Priority">
              <Select
                id="request-filter-priority"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
              >
                <option value="all">All priorities</option>
                {REQUEST_TICKET_PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="request-filter-category" label="Category">
              <Select
                id="request-filter-category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
              >
                <option value="all">All categories</option>
                {REQUEST_TICKET_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="request-filter-search" label="Search">
              <Input
                id="request-filter-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title, requester, location…"
              />
            </FormField>
          </div>
        </Card>

        {loadError ? (
          <AlertBanner
            variant="error"
            title="Could not load request tickets"
            onRetry={() => void load()}
          >
            {loadError}
          </AlertBanner>
        ) : loading ? (
          <SkeletonCardList count={3} />
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            title={tickets.length === 0 ? "No requests yet" : "No requests match these filters"}
            description={
              tickets.length === 0
                ? isAdmin
                  ? "New member requests will appear here as soon as they are submitted."
                  : "Submit your first request above when something needs administrator attention."
                : "Try changing the status, priority, category, or search filters."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <RequestTicketCard
                key={ticket.id}
                ticket={ticket}
                isAdmin={isAdmin}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
