import type { Metadata } from "next";
import { PublicFleetGrid } from "@/components/site/PublicFleetGrid";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Fleet",
  description: "Cove Fire & Rescue apparatus and response vehicles.",
};

export default function FleetPage() {
  return (
    <PageShell
      eyebrow="Apparatus"
      title="Fleet & Apparatus"
      description="Our engines, tankers, rescue units, and support vehicles ready to respond."
    >
      <PublicFleetGrid />
    </PageShell>
  );
}
