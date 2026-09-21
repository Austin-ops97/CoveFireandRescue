import type { Metadata } from "next";
import { NationalNightOutStatusLookup } from "@/components/site/NationalNightOutStatusLookup";
import { Button } from "@/components/site/Button";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Check National Night Out Request Status",
  description:
    "Check the status of a Cove Fire & Rescue National Night Out visit request with the request ID and email address used on the form.",
};

export default function NationalNightOutStatusPage() {
  return (
    <PageShell
      eyebrow="Community Events"
      title="Check Request Status"
      description="Enter the Request ID and the email address used on your National Night Out visit request."
      narrow
    >
      <div className="mb-6">
        <Button href="/national-night-out" variant="ghost" size="sm">
          ← Back to the request form
        </Button>
      </div>
      <NationalNightOutStatusLookup />
    </PageShell>
  );
}
