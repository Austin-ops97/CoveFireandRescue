import { sanitizeB2Segment } from "@/lib/storage/b2";

const MAX_FOLDER_NAME_LENGTH = 100;
const MAX_FILE_NAME_LENGTH = 255;
const PATH_TRAVERSAL_PATTERN = /(?:^|\/)\.\.(?:\/|$)|^\/|\/\/|\.\//;

export class FileStorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileStorageValidationError";
  }
}

export function assertSafePathSegment(value: string, label: string): void {
  if (!value.trim()) {
    throw new FileStorageValidationError(`${label} cannot be empty.`);
  }
  if (PATH_TRAVERSAL_PATTERN.test(value)) {
    throw new FileStorageValidationError(`${label} contains invalid path characters.`);
  }
}

export function slugifyFolderName(name: string): string {
  const slug = sanitizeB2Segment(name);
  if (!slug) {
    throw new FileStorageValidationError("Folder name must contain at least one valid character.");
  }
  return slug;
}

export function validateFolderName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new FileStorageValidationError("Folder name is required.");
  }
  if (trimmed.length > MAX_FOLDER_NAME_LENGTH) {
    throw new FileStorageValidationError(
      `Folder name must be ${MAX_FOLDER_NAME_LENGTH} characters or fewer.`
    );
  }
  assertSafePathSegment(trimmed, "Folder name");
  return trimmed;
}

export function validateFileDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new FileStorageValidationError("File name is required.");
  }
  if (trimmed.length > MAX_FILE_NAME_LENGTH) {
    throw new FileStorageValidationError(
      `File name must be ${MAX_FILE_NAME_LENGTH} characters or fewer.`
    );
  }
  assertSafePathSegment(trimmed, "File name");
  return trimmed;
}

export function extractDisplayExtension(fileName: string): string {
  const match = fileName.match(/\.([a-zA-Z0-9]{1,10})$/);
  if (!match) return "";
  return `.${match[1].toLowerCase()}`;
}

export function preserveExtensionOnRename(params: {
  currentDisplayName: string;
  nextName: string;
}): string {
  const next = validateFileDisplayName(params.nextName);
  const currentExt = extractDisplayExtension(params.currentDisplayName);
  if (!currentExt) return next;

  const nextExt = extractDisplayExtension(next);
  if (nextExt) return next;

  return `${next}${currentExt}`;
}
