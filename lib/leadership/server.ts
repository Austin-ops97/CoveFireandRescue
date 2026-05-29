import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { LeadershipMemberRecord, LeadershipMemberStatus } from "@/lib/leadership/types";

const VALID_STATUSES: LeadershipMemberStatus[] = ["active", "inactive", "archived"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class LeadershipValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadershipValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readStatus(value: unknown): LeadershipMemberStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as LeadershipMemberStatus)) {
    return value as LeadershipMemberStatus;
  }
  return "active";
}

function readOptionalString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (value === null) return null;
  return null;
}

function parseSortOrder(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 999;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 999;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      throw new LeadershipValidationError("Sort order must be a valid number.");
    }
    return parsed;
  }
  throw new LeadershipValidationError("Sort order must be a valid number.");
}

export function serializeLeadershipDoc(doc: DocumentSnapshot): LeadershipMemberRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "",
    rank: typeof data.rank === "string" ? data.rank : "",
    title: readOptionalString(data.title),
    email: readOptionalString(data.email),
    phone: readOptionalString(data.phone),
    bio: typeof data.bio === "string" ? data.bio : "",
    photoFileId: readOptionalString(data.photoFileId),
    status: readStatus(data.status),
    active: data.active !== false,
    sortOrder:
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 999,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function validateLeadershipPayload(input: unknown): {
  name: string;
  rank: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  bio: string;
  photoFileId: string | null;
  status: LeadershipMemberStatus;
  active: boolean;
  sortOrder: number;
} {
  if (!input || typeof input !== "object") {
    throw new LeadershipValidationError("Invalid leadership member payload.");
  }

  const payload = input as Record<string, unknown>;

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new LeadershipValidationError("Name is required.");
  }

  const name = payload.name.trim();
  if (name.length > 100) {
    throw new LeadershipValidationError("Name must be 100 characters or fewer.");
  }

  if (typeof payload.rank !== "string" || !payload.rank.trim()) {
    throw new LeadershipValidationError("Rank is required.");
  }

  const rank = payload.rank.trim();
  if (rank.length > 100) {
    throw new LeadershipValidationError("Rank must be 100 characters or fewer.");
  }

  let title: string | null = null;
  if (payload.title !== undefined && payload.title !== null) {
    if (typeof payload.title !== "string") {
      throw new LeadershipValidationError("Title must be a string.");
    }
    const trimmedTitle = payload.title.trim();
    if (trimmedTitle.length > 120) {
      throw new LeadershipValidationError("Title must be 120 characters or fewer.");
    }
    title = trimmedTitle || null;
  }

  let email: string | null = null;
  if (payload.email !== undefined && payload.email !== null) {
    if (typeof payload.email !== "string") {
      throw new LeadershipValidationError("Email must be a string.");
    }
    const trimmedEmail = payload.email.trim();
    if (trimmedEmail.length > 160) {
      throw new LeadershipValidationError("Email must be 160 characters or fewer.");
    }
    if (trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      throw new LeadershipValidationError("Email format is invalid.");
    }
    email = trimmedEmail || null;
  }

  let phone: string | null = null;
  if (payload.phone !== undefined && payload.phone !== null) {
    if (typeof payload.phone !== "string") {
      throw new LeadershipValidationError("Phone must be a string.");
    }
    const trimmedPhone = payload.phone.trim();
    if (trimmedPhone.length > 40) {
      throw new LeadershipValidationError("Phone must be 40 characters or fewer.");
    }
    phone = trimmedPhone || null;
  }

  let bio = "";
  if (payload.bio !== undefined && payload.bio !== null) {
    if (typeof payload.bio !== "string") {
      throw new LeadershipValidationError("Bio must be a string.");
    }
    bio = payload.bio;
    if (bio.length > 5000) {
      throw new LeadershipValidationError("Bio must be 5000 characters or fewer.");
    }
  }

  let photoFileId: string | null = null;
  if (payload.photoFileId !== undefined && payload.photoFileId !== null) {
    if (typeof payload.photoFileId !== "string") {
      throw new LeadershipValidationError("Photo file id must be a string.");
    }
    const trimmedPhoto = payload.photoFileId.trim();
    if (trimmedPhoto.length > 200) {
      throw new LeadershipValidationError("Photo file id must be 200 characters or fewer.");
    }
    photoFileId = trimmedPhoto || null;
  }

  if (
    typeof payload.status !== "string" ||
    !VALID_STATUSES.includes(payload.status as LeadershipMemberStatus)
  ) {
    throw new LeadershipValidationError("Status must be active, inactive, or archived.");
  }

  if (typeof payload.active !== "boolean") {
    throw new LeadershipValidationError("Active must be a boolean.");
  }

  const sortOrder = parseSortOrder(payload.sortOrder);

  return {
    name,
    rank,
    title,
    email,
    phone,
    bio,
    photoFileId,
    status: payload.status as LeadershipMemberStatus,
    active: payload.active,
    sortOrder,
  };
}

export async function attachLeadershipPhotoUrls(
  leadership: LeadershipMemberRecord[]
): Promise<LeadershipMemberRecord[]> {
  const { getStoredFilesByIds } = await import("@/lib/storage/server");
  const fileIds = leadership
    .map((member) => member.photoFileId)
    .filter((id): id is string => typeof id === "string" && Boolean(id));
  const files = await getStoredFilesByIds(fileIds);

  return leadership.map((member) => {
    const photoUrl =
      member.photoFileId && files[member.photoFileId]?.publicUrl
        ? files[member.photoFileId].publicUrl
        : null;

    return {
      ...member,
      photoUrl,
    };
  });
}

export function sortLeadershipForPublic(
  leadership: LeadershipMemberRecord[]
): LeadershipMemberRecord[] {
  return [...leadership].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    const rankCompare = a.rank.localeCompare(b.rank, undefined, { sensitivity: "base" });
    if (rankCompare !== 0) return rankCompare;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export function sortLeadershipForAdmin(
  leadership: LeadershipMemberRecord[]
): LeadershipMemberRecord[] {
  return [...leadership].sort((a, b) => {
    const aArchived = a.status === "archived" ? 1 : 0;
    const bArchived = b.status === "archived" ? 1 : 0;
    if (aArchived !== bArchived) {
      return aArchived - bArchived;
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
