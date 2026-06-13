"use client";

import { Button } from "@/components/site/Button";
import { Modal } from "@/components/ui/Modal";

type DeleteSubmissionModalProps = {
  onConfirm: () => void;
  onClose: () => void;
  deleting?: boolean;
};

export function DeleteSubmissionModal({
  onConfirm,
  onClose,
  deleting = false,
}: DeleteSubmissionModalProps) {
  return (
    <Modal
      title="Delete Submission"
      description="Are you sure you want to permanently delete this checklist submission?"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-700 hover:bg-red-800 focus-visible:ring-red-700/40"
          >
            {deleting ? "Deleting…" : "Delete Submission"}
          </Button>
        </>
      }
    />
  );
}
