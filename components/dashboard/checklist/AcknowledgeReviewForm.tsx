"use client";

import { useState } from "react";
import { Button } from "@/components/site/Button";
import { inputBase } from "@/lib/ui/classes";

type AcknowledgeReviewFormProps = {
  onSubmit: (reviewNote: string) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
};

export function AcknowledgeReviewForm({
  onSubmit,
  disabled = false,
  compact = false,
}: AcknowledgeReviewFormProps) {
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(reviewNote);
      setReviewNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to acknowledge review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/60 p-4"}>
      {!compact && (
        <p className="text-sm font-semibold text-brand-charcoal">
          Acknowledge this flagged submission to clear it from the review queue.
        </p>
      )}
      <div>
        <label className="block text-sm font-semibold text-brand-charcoal">
          Review note <span className="font-normal text-brand-gray">(optional)</span>
        </label>
        <textarea
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          rows={compact ? 2 : 3}
          maxLength={2000}
          placeholder="Add context about the review or follow-up taken…"
          className={`${inputBase} mt-1 resize-y`}
          disabled={disabled || submitting}
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={disabled || submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? "Acknowledging…" : "Acknowledge Review"}
      </Button>
    </div>
  );
}
