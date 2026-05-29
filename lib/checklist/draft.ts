import type { FieldAnswerState } from "@/lib/checklist/types";

const DRAFT_STORAGE_KEY = "cove-checklist-submission-draft-v1";

export type ChecklistSubmissionDraft = {
  selectedTemplateId: string;
  relatedFleetUnitId: string;
  notes: string;
  answers: Record<string, FieldAnswerState>;
  generalPhotoFileIds: string[];
  generalPhotoPreviews: Record<string, string>;
  savedAt: string;
};

export function loadChecklistSubmissionDraft(): ChecklistSubmissionDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ChecklistSubmissionDraft;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.selectedTemplateId !== "string") return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveChecklistSubmissionDraft(draft: Omit<ChecklistSubmissionDraft, "savedAt">): void {
  if (typeof window === "undefined") return;

  try {
    const payload: ChecklistSubmissionDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or private browsing errors.
  }
}

export function clearChecklistSubmissionDraft(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
