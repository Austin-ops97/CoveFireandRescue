const HISTORY_PREFS_KEY = "cove-checklist-history-prefs-v1";
const REVIEW_PREFS_KEY = "cove-checklist-review-prefs-v1";

export type ExplorerPreferences = {
  templateId: string;
  scope: string;
  relatedFleetUnitId: string;
  submittedBy: string;
  fromDate: string;
  toDate: string;
  search: string;
  attentionOnly: boolean;
  sortOrder: "newest" | "oldest";
};

const defaultPreferences: ExplorerPreferences = {
  templateId: "",
  scope: "",
  relatedFleetUnitId: "",
  submittedBy: "",
  fromDate: "",
  toDate: "",
  search: "",
  attentionOnly: false,
  sortOrder: "newest",
};

function storageKey(mode: "history" | "review"): string {
  return mode === "history" ? HISTORY_PREFS_KEY : REVIEW_PREFS_KEY;
}

export function loadExplorerPreferences(mode: "history" | "review"): ExplorerPreferences {
  if (typeof window === "undefined") return { ...defaultPreferences };

  try {
    const raw = window.localStorage.getItem(storageKey(mode));
    if (!raw) return { ...defaultPreferences };

    const parsed = JSON.parse(raw) as Partial<ExplorerPreferences>;
    return { ...defaultPreferences, ...parsed };
  } catch {
    return { ...defaultPreferences };
  }
}

export function saveExplorerPreferences(
  mode: "history" | "review",
  prefs: ExplorerPreferences
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(mode), JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function getQuickFilterDates(
  preset: "today" | "last7" | "last30" | "thisMonth"
): { fromDate: string; toDate: string } {
  const today = new Date();
  const toDate = formatDateInput(today);

  if (preset === "today") {
    return { fromDate: toDate, toDate };
  }

  if (preset === "last7") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { fromDate: formatDateInput(from), toDate };
  }

  if (preset === "last30") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { fromDate: formatDateInput(from), toDate };
  }

  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate: formatDateInput(from), toDate };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
