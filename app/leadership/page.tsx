import type { Metadata } from "next";
import { PublicLeadershipGrid } from "@/components/site/PublicLeadershipGrid";
import { PageShell } from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Meet the command staff of Cove Fire & Rescue.",
};

export default function LeadershipPage() {
  return (
    <PageShell
      title="Leadership & Command Staff"
      description="The officers leading Cove Fire & Rescue with experience, accountability, and dedication."
    >
      <PublicLeadershipGrid />
    </PageShell>
  );
}
