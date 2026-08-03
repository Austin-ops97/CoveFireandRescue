import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  CreateRequestTicketPayload,
  RequestTicket,
  RequestTicketCategory,
  RequestTicketPriority,
  RequestTicketStatus,
  UpdateRequestTicketPayload,
} from "@/lib/request-tickets/types";

const VALID_CATEGORIES: RequestTicketCategory[] = [
  "supplies",
  "facility",
  "apparatus",
  "equipment",
  "technology",
  "other",
];

const VALID_PRIORITIES: RequestTicketPriority[] = ["normal", "high", "urgent"];
const VALID_STATUSES: RequestTicketStatus[] = ["open", "in_progress", "resolved", "closed"];

export class RequestTicketValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestTicketValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readCategory(value: unknown): RequestTicketCategory {
  if (typeof value === "string" && VALID_CATEGORIES.includes(value as RequestTicketCategory)) {
    return value as RequestTicketCategory;
  }
  return "other";
}

function readPriority(value: unknown): RequestTicketPriority {
  if (typeof value === "string" && VALID_PRIORITIES.includes(value as RequestTicketPriority)) {
    return value as RequestTicketPriority;
  }
  return "normal";
}

function readStatus(value: unknown): RequestTicketStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as RequestTicketStatus)) {
    return value as RequestTicketStatus;
  }
  return "open";
}

function requireString(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum: number
): string {
  if (typeof value !== "string") {
    throw new RequestTicketValidationError(`${fieldName} is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minimum || trimmed.length > maximum) {
    throw new RequestTicketValidationError(
      `${fieldName} must be between ${minimum} and ${maximum} characters.`
    );
  }

  return trimmed;
}

function optionalString(value: unknown, fieldName: string, maximum: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestTicketValidationError(`${fieldName} must be text.`);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maximum) {
    throw new RequestTicketValidationError(`${fieldName} must be ${maximum} characters or fewer.`);
  }

  return trimmed;
}

export function serializeRequestTicketDoc(doc: DocumentSnapshot): RequestTicket {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    ticketNumber:
      typeof data.ticketNumber === "string" && data.ticketNumber.trim()
        ? data.ticketNumber
        : `REQ-${doc.id.slice(0, 6).toUpperCase()}`,
    title: typeof data.title === "string" ? data.title : "Untitled request",
    description: typeof data.description === "string" ? data.description : "",
    category: readCategory(data.category),
    location: typeof data.location === "string" ? data.location : null,
    priority: readPriority(data.priority),
    status: readStatus(data.status),
    submittedBy: typeof data.submittedBy === "string" ? data.submittedBy : "",
    submittedByName: typeof data.submittedByName === "string" ? data.submittedByName : null,
    submittedByEmail: typeof data.submittedByEmail === "string" ? data.submittedByEmail : null,
    adminResponse: typeof data.adminResponse === "string" ? data.adminResponse : null,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : null,
    updatedByName: typeof data.updatedByName === "string" ? data.updatedByName : null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    resolvedAt: serializeTimestamp(data.resolvedAt),
  };
}

export function requestTicketSortTime(ticket: RequestTicket): number {
  const value = ticket.updatedAt ?? ticket.createdAt;
  if (typeof value !== "string") return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function validateCreateRequestTicketPayload(input: unknown): {
  title: string;
  description: string;
  category: RequestTicketCategory;
  location: string | null;
  priority: RequestTicketPriority;
} {
  if (!input || typeof input !== "object") {
    throw new RequestTicketValidationError("Request details are required.");
  }

  const payload = input as Partial<CreateRequestTicketPayload>;
  const category = payload.category;
  if (!VALID_CATEGORIES.includes(category as RequestTicketCategory)) {
    throw new RequestTicketValidationError("Choose a valid request category.");
  }

  const priority = payload.priority;
  if (!VALID_PRIORITIES.includes(priority as RequestTicketPriority)) {
    throw new RequestTicketValidationError("Choose a valid priority.");
  }

  return {
    title: requireString(payload.title, "Request title", 3, 120),
    description: requireString(payload.description, "Description", 5, 2000),
    category: category as RequestTicketCategory,
    location: optionalString(payload.location, "Location", 120),
    priority: priority as RequestTicketPriority,
  };
}

export function validateUpdateRequestTicketPayload(input: unknown): {
  status: RequestTicketStatus;
  priority: RequestTicketPriority;
  adminResponse: string | null;
} {
  if (!input || typeof input !== "object") {
    throw new RequestTicketValidationError("Ticket update details are required.");
  }

  const payload = input as Partial<UpdateRequestTicketPayload>;
  if (!VALID_STATUSES.includes(payload.status as RequestTicketStatus)) {
    throw new RequestTicketValidationError("Choose a valid request status.");
  }
  if (!VALID_PRIORITIES.includes(payload.priority as RequestTicketPriority)) {
    throw new RequestTicketValidationError("Choose a valid priority.");
  }

  return {
    status: payload.status as RequestTicketStatus,
    priority: payload.priority as RequestTicketPriority,
    adminResponse: optionalString(payload.adminResponse, "Admin response", 2000),
  };
}
