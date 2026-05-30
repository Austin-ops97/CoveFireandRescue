import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { StatusBadge } from "@/components/ui";
import type { DashboardRecentSubmission } from "@/lib/dashboard/types";

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }
  return "—";
}

type RecentSubmissionsListProps = {
  submissions: DashboardRecentSubmission[];
  showInspector?: boolean;
  detailHref?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function RecentSubmissionsList({
  submissions,
  showInspector = false,
  detailHref = "/dashboard/rounds/history",
  emptyTitle = "No recent submissions",
  emptyDescription = "Submitted inspections will appear here.",
}: RecentSubmissionsListProps) {
  if (submissions.length === 0) {
    return (
      <Card variant="muted" padding="sm">
        <p className="text-sm font-semibold text-brand-charcoal">{emptyTitle}</p>
        <p className="mt-1 text-sm text-brand-gray">{emptyDescription}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card
          key={submission.id}
          padding="sm"
          className={
            submission.hasAttention
              ? "border-l-4 border-l-brand-red"
              : "border-l-4 border-l-green-600"
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={submission.hasAttention ? "Needs attention" : "Clear"}
                  variant={submission.hasAttention ? "attention" : "pass"}
                />
              </div>
              <p className="mt-2 font-semibold text-brand-charcoal">{submission.templateName}</p>
              <p className="mt-1 text-sm text-brand-gray">
                {formatTimestamp(submission.submittedAt)}
                {submission.relatedFleetUnitName
                  ? ` · ${submission.relatedFleetUnitName}`
                  : ""}
                {showInspector && submission.submittedByName
                  ? ` · ${submission.submittedByName}`
                  : ""}
              </p>
            </div>
          </div>
        </Card>
      ))}

      <div className="pt-1">
        <Link href={detailHref}>
          <Button type="button" variant="outline" size="sm">
            View all submissions
          </Button>
        </Link>
      </div>
    </div>
  );
}
