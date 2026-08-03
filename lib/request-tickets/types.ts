export type RequestTicketCategory =
  | "supplies"
  | "facility"
  | "apparatus"
  | "equipment"
  | "technology"
  | "other";

export type RequestTicketPriority = "normal" | "high" | "urgent";

export type RequestTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type RequestTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: RequestTicketCategory;
  location?: string | null;
  priority: RequestTicketPriority;
  status: RequestTicketStatus;
  adminNotificationUnread: boolean;
  submittedBy: string;
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  adminResponse?: string | null;
  updatedBy?: string | null;
  updatedByName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  resolvedAt?: unknown | null;
};

export type CreateRequestTicketPayload = {
  title: string;
  description: string;
  category: RequestTicketCategory;
  location?: string;
  priority: RequestTicketPriority;
};

export type UpdateRequestTicketPayload = {
  status: RequestTicketStatus;
  priority: RequestTicketPriority;
  adminResponse?: string;
};

export const REQUEST_TICKET_CATEGORIES: Array<{
  value: RequestTicketCategory;
  label: string;
}> = [
  { value: "supplies", label: "Supplies" },
  { value: "facility", label: "Station / Facility" },
  { value: "apparatus", label: "Apparatus / Vehicle" },
  { value: "equipment", label: "Equipment / Gear" },
  { value: "technology", label: "Technology / Access" },
  { value: "other", label: "Other" },
];

export const REQUEST_TICKET_PRIORITIES: Array<{
  value: RequestTicketPriority;
  label: string;
}> = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const REQUEST_TICKET_STATUSES: Array<{
  value: RequestTicketStatus;
  label: string;
}> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function getRequestTicketCategoryLabel(category: RequestTicketCategory): string {
  return (
    REQUEST_TICKET_CATEGORIES.find((option) => option.value === category)?.label ?? category
  );
}

export function getRequestTicketPriorityLabel(priority: RequestTicketPriority): string {
  return REQUEST_TICKET_PRIORITIES.find((option) => option.value === priority)?.label ?? priority;
}

export function getRequestTicketStatusLabel(status: RequestTicketStatus): string {
  return REQUEST_TICKET_STATUSES.find((option) => option.value === status)?.label ?? status;
}

export function isRequestTicketOpen(status: RequestTicketStatus): boolean {
  return status === "open" || status === "in_progress";
}
