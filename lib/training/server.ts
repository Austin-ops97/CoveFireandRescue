import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type {
  TrainingRecord,
  TrainingRecordFormState,
  TrainingRecordType,
} from "@/lib/training/types";

const VALID_TYPES: TrainingRecordType[] = ["hours", "certification"];

export class TrainingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readType(value: unknown): TrainingRecordType {
  if (typeof value === "string" && VALID_TYPES.includes(value as TrainingRecordType)) {
    return value as TrainingRecordType;
  }
  return "hours";
}

function readOptionalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new TrainingValidationError("Date must be a valid ISO date string.");
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new TrainingValidationError("Date must be a valid ISO date string.");
  }
  return new Date(ms).toISOString();
}

export function serializeTrainingDoc(doc: DocumentSnapshot): TrainingRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    memberName: typeof data.memberName === "string" ? data.memberName : "",
    title: typeof data.title === "string" ? data.title : "",
    type: readType(data.type),
    hours: typeof data.hours === "number" ? data.hours : data.hours === null ? null : undefined,
    completedAt:
      typeof data.completedAt === "string"
        ? data.completedAt
        : data.completedAt === null
          ? null
          : undefined,
    expiresAt:
      typeof data.expiresAt === "string"
        ? data.expiresAt
        : data.expiresAt === null
          ? null
          : undefined,
    notes: typeof data.notes === "string" ? data.notes : "",
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function trainingSortTime(record: TrainingRecord): number {
  const value = record.completedAt ?? record.updatedAt ?? record.createdAt;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

export function validateTrainingPayload(input: TrainingRecordFormState): {
  memberName: string;
  title: string;
  type: TrainingRecordType;
  hours: number | null;
  completedAt: string | null;
  expiresAt: string | null;
  notes: string;
} {
  const memberName = input.memberName.trim();
  if (!memberName || memberName.length > 120) {
    throw new TrainingValidationError("Member name is required (120 characters max).");
  }

  const title = input.title.trim();
  if (!title || title.length > 200) {
    throw new TrainingValidationError("Title is required (200 characters max).");
  }

  const type = readType(input.type);

  let hours: number | null = null;
  if (type === "hours") {
    const parsed = Number(input.hours);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 999) {
      throw new TrainingValidationError("Training hours must be between 0.1 and 999.");
    }
    hours = Math.round(parsed * 10) / 10;
  }

  const completedAt = readOptionalDate(input.completedAt || null);
  const expiresAt = type === "certification" ? readOptionalDate(input.expiresAt || null) : null;

  const notes = input.notes.trim();
  if (notes.length > 2000) {
    throw new TrainingValidationError("Notes must be 2000 characters or fewer.");
  }

  return {
    memberName,
    title,
    type,
    hours,
    completedAt,
    expiresAt,
    notes,
  };
}
