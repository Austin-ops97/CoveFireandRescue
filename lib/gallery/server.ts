import "server-only";

import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { galleryCategories, type GalleryCategory } from "@/lib/config/site";
import type { GalleryFormState, GalleryRecord } from "./types";
import { getCategoryLabel } from "./types";

export { getCategoryLabel };

const VALID_CATEGORIES = galleryCategories.map((c) => c.value);

export class GalleryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalleryValidationError";
  }
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function readCategory(value: unknown): GalleryCategory {
  if (typeof value === "string" && VALID_CATEGORIES.includes(value as GalleryCategory)) {
    return value as GalleryCategory;
  }
  return "team";
}

export function serializeGalleryDoc(doc: DocumentSnapshot): GalleryRecord {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "",
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    category: readCategory(data.category),
    altText: typeof data.altText === "string" ? data.altText : "",
    uploadedAt: serializeTimestamp(data.uploadedAt),
    visible: data.visible === true,
  };
}

export function validateGalleryPayload(input: unknown): Omit<GalleryFormState, "id"> {
  if (!input || typeof input !== "object") {
    throw new GalleryValidationError("Invalid gallery payload.");
  }

  const payload = input as Record<string, unknown>;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  if (!title || title.length > 120) {
    throw new GalleryValidationError("Title is required (120 characters max).");
  }

  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    throw new GalleryValidationError("A valid image URL is required.");
  }

  const altText = typeof payload.altText === "string" ? payload.altText.trim() : "";
  if (!altText) {
    throw new GalleryValidationError("Alt text is required for accessibility.");
  }

  if (
    typeof payload.category !== "string" ||
    !VALID_CATEGORIES.includes(payload.category as GalleryCategory)
  ) {
    throw new GalleryValidationError("Category is invalid.");
  }

  if (typeof payload.visible !== "boolean") {
    throw new GalleryValidationError("Visible must be a boolean.");
  }

  return {
    title,
    imageUrl,
    category: payload.category as GalleryCategory,
    altText: altText.slice(0, 300),
    visible: payload.visible,
  };
}

export function gallerySortTime(record: GalleryRecord): number {
  if (typeof record.uploadedAt === "string") {
    const time = new Date(record.uploadedAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  }
  return 0;
}
