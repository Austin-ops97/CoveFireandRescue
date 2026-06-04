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

const volunteerBenefits = [
  "Protect your neighbors and community when it matters most",
  "Train with experienced volunteers twice each week",
  "Develop fire, rescue, and emergency response skills",
  "Be part of a respected Chambers County institution",
] as const;

const requirements = [
  "Minimum age requirement as determined by department policy",
  "Willingness to attend regular training sessions",
  "Commitment to serving the community with professionalism",
  "Ability to pass a background check",
] as const;

export default function JoinPage() {
  return (
    <PageShell
      eyebrow="Volunteer With Us"
      title="Join Cove Fire & Rescue"
      description="Make a difference in your community. No prior experience is required — training, equipment, and support are provided."
      narrow
    >
      <section className="mb-12">
        <SectionHeader
          title="Why Volunteer?"
          subtitle="Cove Fire & Rescue depends on dedicated volunteers willing to serve their community."
        />
        <Card>
          <p className="leading-relaxed text-gray-500">
            Cove Fire &amp; Rescue is a volunteer fire department built on neighbors helping neighbors.
            Members train twice each week, respond when the community needs help, and uphold the standards
            that have defined our department for {siteConfig.yearsInService} years.
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-gray-500">
            {volunteerBenefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="What Volunteers Do" subtitle="Hands-on emergency response and community service." />
        <Card>
          <p className="leading-relaxed text-gray-500">{siteConfig.trainingCommitment}</p>
          <p className="mt-3 leading-relaxed text-gray-500">{siteConfig.mission}</p>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="Requirements" />
        <Card>
          <ul className="list-inside list-disc space-y-2 text-gray-500">
            {requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="How to Apply" subtitle="Complete the application form below to start the volunteer process." />
        <Card>
          <ApplicationForm />
        </Card>
      </section>

      <section className="text-center">
        <Card className="border-navy-900/10 bg-gray-50">
          <h3 className="text-lg font-bold text-navy-900">Questions before you apply?</h3>
          <p className="mt-2 text-sm text-gray-500">
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
