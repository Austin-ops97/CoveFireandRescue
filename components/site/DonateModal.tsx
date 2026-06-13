"use client";

import { Button } from "@/components/site/Button";
import { Modal } from "@/components/ui/Modal";
import { PAYPAL_DONATE_URL } from "@/lib/config/site";

type DonateModalProps = {
  onClose: () => void;
};

export function DonateModal({ onClose }: DonateModalProps) {
  function handleContinueToPayPal() {
    window.open(PAYPAL_DONATE_URL, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <Modal
      title="Support Cove Fire & Rescue"
      description="Your donation helps support emergency response, equipment, training, and community safety."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleContinueToPayPal}>
            Continue to PayPal
          </Button>
        </>
      }
    />
  );
}
