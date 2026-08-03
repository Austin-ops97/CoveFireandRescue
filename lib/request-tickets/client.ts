"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  CreateRequestTicketPayload,
  RequestTicket,
  UpdateRequestTicketPayload,
} from "@/lib/request-tickets/types";

export const REQUEST_TICKETS_CHANGED_EVENT = "request-tickets-changed";

function dispatchRequestTicketsChanged(): void {
  window.dispatchEvent(new Event(REQUEST_TICKETS_CHANGED_EVENT));
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore invalid JSON and use the status fallback.
  }

  return `Request failed (${response.status})`;
}

export async function fetchRequestTickets(): Promise<RequestTicket[]> {
  const response = await authenticatedFetch("/api/request-tickets", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { tickets?: RequestTicket[] };
  return Array.isArray(data.tickets) ? data.tickets : [];
}

export async function createRequestTicket(
  payload: CreateRequestTicketPayload
): Promise<RequestTicket> {
  const response = await authenticatedFetch("/api/request-tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { ticket?: RequestTicket };
  if (!data.ticket) {
    throw new Error("Server did not return the created request.");
  }

  dispatchRequestTicketsChanged();
  return data.ticket;
}

export async function updateRequestTicket(
  id: string,
  payload: UpdateRequestTicketPayload
): Promise<RequestTicket> {
  const response = await authenticatedFetch(`/api/request-tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { ticket?: RequestTicket };
  if (!data.ticket) {
    throw new Error("Server did not return the updated request.");
  }

  dispatchRequestTicketsChanged();
  return data.ticket;
}

export async function deleteRequestTicket(id: string): Promise<void> {
  const response = await authenticatedFetch(`/api/request-tickets/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  dispatchRequestTicketsChanged();
}
