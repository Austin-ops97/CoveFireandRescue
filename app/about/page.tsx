import type { Metadata } from "next";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { departmentHistory, siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About Cove Fire & Rescue",
  description:
    "Learn about Cove Fire & Rescue — 54 years serving Cove, Texas and Chambers County with volunteer fire protection and community commitment.",
  keywords: [...siteConfig.seo.keywords],
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Cove Fire & Rescue"
      description={`Serving our neighbors for ${siteConfig.yearsInService} years with volunteer dedication and professional standards.`}
    >
      <section className="mb-14">
        <SectionHeader title="Our Mission" />
        <Card>
          <p className="text-brand-gray leading-relaxed">{siteConfig.mission}</p>
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader
          title="Department History"
          subtitle={`${siteConfig.yearsInService} years of volunteer service in Cove, Texas.`}
        />
        <Card>
          {departmentHistory.split("\n\n").map((paragraph, index) => (
            <p
              key={index}
              className={`text-brand-gray leading-relaxed ${index > 0 ? "mt-4" : ""}`}
            >
              {paragraph}
            </p>
          ))}
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader title="What Makes Us Different" />
        <Card className="border-l-4 border-l-brand-gold">
          <p className="text-brand-gray leading-relaxed font-medium">{siteConfig.trainingCommitment}</p>
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader title="Service Area" />
        <Card>
          <p className="text-brand-gray leading-relaxed">{siteConfig.serviceArea}</p>
        </Card>
      </section>

      <section className="mb-14">
        <SectionHeader
          title="Our Team & Station"
          subtitle="Photos will be added as they are provided by the department."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden p-0">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand-blue/15 to-brand-gold/15">
              <div className="px-6 text-center">
                <p className="text-sm font-semibold text-brand-charcoal">Team Group Photo</p>
                <p className="mt-1 text-xs text-brand-gray">Coming soon</p>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden p-0">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand-blue/10 to-brand-gray-light">
              <div className="px-6 text-center">
                <p className="text-sm font-semibold text-brand-charcoal">Station Exterior</p>
                <p className="mt-1 text-xs text-brand-gray">5735 S FM 565, Cove, TX</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <SectionHeader title="Community Commitment" />
        <Card>
          <p className="text-brand-gray leading-relaxed">
            Cove Fire &amp; Rescue is built on neighbors helping neighbors. We train regularly,
            respond when called, and work to keep our community informed through department updates,
            outreach, and transparent communication. We invite residents to follow our announcements,
            visit the station during posted meeting hours, and consider volunteering when they are ready
            to serve.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
