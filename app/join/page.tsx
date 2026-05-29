import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "Join Us",
  description: "Volunteer and recruitment information for Cove Fire & Rescue.",
};

export default function JoinPage() {
  return (
    <PageShell
      title="Join Cove Fire & Rescue"
      description="Make a difference in your community. We're always looking for dedicated members."
      narrow
    >
      <section className="mb-12">
        <SectionHeader title="Why Join Cove Fire & Rescue?" />
        <Card>
          <ul className="list-inside list-disc space-y-2 text-brand-gray">
            <li>Serve your neighbors when they need help most</li>
            <li>Gain professional firefighting and rescue training</li>
            <li>Join a tight-knit team built on trust and accountability</li>
            <li>Develop leadership and emergency response skills</li>
            <li>Be part of a respected community institution</li>
          </ul>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="Basic Requirements" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            [Requirements placeholder.] Applicants must meet minimum age, residency, and
            physical fitness standards. Background checks and department orientation are
            required. Official eligibility criteria will be published here.
          </p>
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader title="Benefits" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            [Benefits placeholder.] Members receive training, gear, insurance coverage
            (where applicable), and the reward of meaningful community service. Specific
            benefits package details will be added by department administration.
          </p>
        </Card>
      </section>

      <section className="text-center">
        <Card className="bg-brand-charcoal text-white border-brand-charcoal">
          <h3 className="text-xl font-bold">Ready to Apply?</h3>
          <p className="mt-3 text-gray-300">
            Our online application form is coming soon. Contact us in the meantime to
            express your interest.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button href="/contact" variant="primary">
              Contact Us
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              className="border-brand-gold text-brand-gold opacity-60"
            >
              Application Form (Coming Soon)
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
