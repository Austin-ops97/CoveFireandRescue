"use client";

import { authenticatedFetch } from "@/lib/api/client";
import type {
  ChecklistSubmissionPayload,
  ChecklistSubmissionRecord,
  ChecklistTemplateFormState,
  ChecklistTemplateRecord,
  ChecklistTemplateScope,
  SubmissionReviewFilter,
} from "@/lib/checklist/types";

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Request failed (${response.status})`;
}

export async function fetchActiveChecklistTemplates(): Promise<ChecklistTemplateRecord[]> {
  const response = await authenticatedFetch("/api/checklist-templates");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { templates?: ChecklistTemplateRecord[] };
  return Array.isArray(data.templates) ? data.templates : [];
}

export async function fetchAdminChecklistTemplates(): Promise<ChecklistTemplateRecord[]> {
  const response = await authenticatedFetch("/api/admin/checklist-templates");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { templates?: ChecklistTemplateRecord[] };
  return Array.isArray(data.templates) ? data.templates : [];
}

export async function saveChecklistTemplate(
  payload: ChecklistTemplateFormState
): Promise<ChecklistTemplateRecord> {
  if (process.env.NODE_ENV === "development") {
    console.log("[checklist-template] save payload:", payload);
  }

  const response = await authenticatedFetch("/api/admin/checklist-templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[checklist-template] save response:", response.status, response.statusText);
  }

  if (!response.ok) {
    const errorMessage = await readApiError(response);
    if (process.env.NODE_ENV === "development") {
      console.error("[checklist-template] save failed:", errorMessage);
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { template?: ChecklistTemplateRecord };
  if (!data.template) {
    throw new Error("Server did not return the saved template.");
  }

  return data.template;
}

export async function archiveChecklistTemplate(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/admin/checklist-templates/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function submitChecklist(
  payload: ChecklistSubmissionPayload
): Promise<ChecklistSubmissionRecord> {
  if (process.env.NODE_ENV === "development") {
    console.log("[checklist-submission] submit payload:", payload);
  }

  const response = await authenticatedFetch("/api/checklist-submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[checklist-submission] submit response:", response.status, response.statusText);
  }

  if (!response.ok) {
    const errorMessage = await readApiError(response);
    if (process.env.NODE_ENV === "development") {
      console.error("[checklist-submission] submit failed:", errorMessage);
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as { submission?: ChecklistSubmissionRecord };
  if (!data.submission) {
    throw new Error("Server did not return the saved submission.");
  }

  return data.submission;
}

export type ChecklistSubmissionQuery = {
  templateId?: string;
  scope?: ChecklistTemplateScope;
  relatedFleetUnitId?: string;
  submittedBy?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  attentionOnly?: boolean;
  deletedOnly?: boolean;
  reviewFilter?: SubmissionReviewFilter;
};

export async function fetchChecklistSubmissions(
  query: ChecklistSubmissionQuery = {}
): Promise<ChecklistSubmissionRecord[]> {
  const params = new URLSearchParams();
  if (query.templateId) params.set("templateId", query.templateId);
  if (query.scope) params.set("scope", query.scope);
  if (query.relatedFleetUnitId) params.set("relatedFleetUnitId", query.relatedFleetUnitId);
  if (query.submittedBy) params.set("submittedBy", query.submittedBy);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.search) params.set("search", query.search);
  if (query.attentionOnly) params.set("attentionOnly", "true");
  if (query.deletedOnly) params.set("deletedOnly", "true");
  if (query.reviewFilter && query.reviewFilter !== "all") {
    params.set("reviewFilter", query.reviewFilter);
  }

  const qs = params.toString();
  const response = await authenticatedFetch(
    `/api/checklist-submissions${qs ? `?${qs}` : ""}`
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { submissions?: ChecklistSubmissionRecord[] };
  return Array.isArray(data.submissions) ? data.submissions : [];
}

export async function deleteChecklistSubmission(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/checklist-submissions/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function restoreChecklistSubmission(
  id: string
): Promise<ChecklistSubmissionRecord> {
  const response = await authenticatedFetch(
    `/api/checklist-submissions/${encodeURIComponent(id)}/restore`,
    { method: "POST" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { submission?: ChecklistSubmissionRecord };
  if (!data.submission) {
    throw new Error("Server did not return the restored submission.");
  }

  return data.submission;
}

export async function purgeChecklistSubmission(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `/api/checklist-submissions/${encodeURIComponent(id)}/purge`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

export async function acknowledgeChecklistReview(
  id: string,
  reviewNote?: string
): Promise<ChecklistSubmissionRecord> {
  const response = await authenticatedFetch(
    `/api/checklist-submissions/${encodeURIComponent(id)}/acknowledge-review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNote: reviewNote?.trim() || undefined }),
    }
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { submission?: ChecklistSubmissionRecord };
  if (!data.submission) {
    throw new Error("Server did not return the updated submission.");
  }

  return data.submission;
}
