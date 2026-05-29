import type { Metadata } from "next";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Cove Fire & Rescue — mission, service area, and community commitment.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Cove Fire & Rescue"
      description="Our mission, service area, and commitment to the community we protect."
    >
      <section className="mb-14">
        <SectionHeader title="Mission Statement" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            [Mission statement placeholder.] Cove Fire &amp; Rescue exists to protect life,
            property, and the environment through professional emergency response, prevention,
            and community partnership. Official mission language will be added by department
            leadership.
          </p>
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader title="Department Overview" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            [Department overview placeholder.] Cove Fire &amp; Rescue is a volunteer and
            career-supported fire and rescue organization serving the Cove community and
            surrounding areas. History, staffing model, and operational details will be
            published here.
          </p>
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader title="Service Area" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            [Service area placeholder.] Our primary response district includes Cove and
            adjacent communities. An official service area map and coverage details will be
            added in a future update.
          </p>
        </Card>
      </section>

      <section>
        <SectionHeader title="Community Commitment" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            We believe in transparency, education, and partnership with the public we serve.
            Through open houses, safety programs, and community outreach, Cove Fire &amp;
            Rescue works to build a safer, more informed community. Program details and event
            schedules will be shared on our announcements page.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
