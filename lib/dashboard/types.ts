import type { ChecklistSubmissionRecord } from "@/lib/checklist/types";

export type DashboardRecentSubmission = {
  id: string;
  templateName: string;
  submittedAt?: unknown;
  relatedFleetUnitId?: string | null;
  relatedFleetUnitName?: string | null;
  hasAttention: boolean;
  submittedByName?: string | null;
};

export type DashboardSummaryBase = {
  recentSubmissions: DashboardRecentSubmission[];
};

export type DashboardSummaryAdmin = DashboardSummaryBase & {
  role: "admin";
  fleetCount: number;
  announcementCount: number;
  leadershipCount: number;
  checklistTemplateCount: number;
  recentSubmissionCount: number;
  failedSubmissionCount: number;
  documentCount: number;
  trainingRecordCount: number;
  equipmentCount: number;
};

export type DashboardSummaryMember = DashboardSummaryBase & {
  role: "member";
  availableTemplateCount: number;
  myRecentSubmissionCount: number;
  myFailedSubmissionCount: number;
};

export type DashboardSummary = DashboardSummaryAdmin | DashboardSummaryMember;

export function toDashboardRecentSubmission(
  submission: ChecklistSubmissionRecord,
  hasAttention: boolean
): DashboardRecentSubmission {
  return {
    id: submission.id,
    templateName: submission.templateName,
    submittedAt: submission.submittedAt,
    relatedFleetUnitId: submission.relatedFleetUnitId,
    relatedFleetUnitName: submission.relatedFleetUnitName,
    hasAttention,
    submittedByName: submission.submittedByName,
  };
}
