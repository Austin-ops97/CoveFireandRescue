"use client";

import { StatusBadge } from "@/components/ui";
import {
  submissionHadFlaggedAnswers,
  submissionIsReviewAcknowledged,
  submissionNeedsReview,
  type ChecklistSubmissionRecord,
  type ChecklistTemplateRecord,
} from "@/lib/checklist/types";

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

type SubmissionReviewStatusProps = {
  submission: ChecklistSubmissionRecord;
  template?: ChecklistTemplateRecord | null;
};

export function SubmissionReviewStatus({
  submission,
  template = null,
}: SubmissionReviewStatusProps) {
  const needsReview = submissionNeedsReview(submission, template);
  const isReviewed = submissionIsReviewAcknowledged(submission);
  const hadFlags = submissionHadFlaggedAnswers(submission, template);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {needsReview && <StatusBadge label="Needs Review" variant="attention" />}
        {isReviewed && <StatusBadge label="Reviewed" variant="pass" />}
        {!needsReview && !isReviewed && hadFlags && (
          <StatusBadge label="Clear" variant="pass" />
        )}
        {!hadFlags && !isReviewed && <StatusBadge label="Clear" variant="pass" />}
      </div>

      {isReviewed && (
        <div className="text-sm text-brand-gray">
          <p>
            Reviewed by {submission.reviewedByName ?? "Administrator"} on{" "}
            {formatTimestamp(submission.reviewedAt)}
          </p>
          {submission.reviewNote && (
            <p className="mt-1 italic">&ldquo;{submission.reviewNote}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
