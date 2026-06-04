import type { Metadata } from "next";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Join Us — Volunteer Application",
  description:
    "Apply to volunteer with Cove Fire & Rescue. Serve Cove, Texas and Chambers County as a trained fire and emergency response volunteer.",
  keywords: [...siteConfig.seo.keywords],
};

export default function JoinPage() {
  return (
    <PageShell
      title="Join Cove Fire & Rescue"
      description="Make a difference in your community. We welcome dedicated volunteers ready to train and serve."
      narrow
    >
      <section className="mb-12">
        <SectionHeader title="Volunteer Service" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            Cove Fire &amp; Rescue is a volunteer fire department built on neighbors helping neighbors.
            Members train twice each week, respond when the community needs help, and uphold the standards
            that have defined our department for {siteConfig.yearsInService} years. Serving is demanding
            and rewarding — if you are ready to commit time, effort, and teamwork, we would like to hear
            from you.
          </p>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="Why Serve With Us?" />
        <Card>
          <ul className="list-inside list-disc space-y-2 text-brand-gray">
            <li>Protect your neighbors and community when it matters most</li>
            <li>Train with experienced volunteers twice each week</li>
            <li>Join a department with deep roots in Cove, Texas</li>
            <li>Develop fire, rescue, and emergency response skills</li>
            <li>Be part of a respected Chambers County institution</li>
          </ul>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="Application Form" />
        <Card>
          <ApplicationForm />
        </Card>
      </section>

      <section className="text-center">
        <Card className="border-brand-blue/20 bg-brand-gray-light">
          <h3 className="text-lg font-bold text-brand-charcoal">Questions before you apply?</h3>
          <p className="mt-2 text-sm text-brand-gray">
            Contact us during station meeting hours or send a non-emergency message.
          </p>
          <div className="mt-6">
            <Button href="/contact" variant="outline">
              Contact the Department
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
