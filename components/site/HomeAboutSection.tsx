import Link from "next/link";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { SectionLabel } from "@/components/site/SectionLabel";
import { siteConfig } from "@/lib/config/site";

export function HomeAboutSection() {
  return (
    <section id="about" className="border-y border-brand-gold/25 bg-brand-gray-light">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionLabel>Who We Are</SectionLabel>
        <SectionHeader
          title="About Us"
          subtitle={`${siteConfig.yearsInService} years of volunteer service in Cove, Texas.`}
        />
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <Card variant="elevated">
            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Our Story</h3>
            <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.historyCondensed}</p>
          </Card>
          <div className="flex flex-col gap-4">
            <Card variant="elevated">
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Our Mission</h3>
              <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.mission}</p>
            </Card>
            <Card variant="elevated">
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Service Area</h3>
              <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.serviceArea}</p>
            </Card>
            <Card variant="elevated" className="border-l-4 border-l-brand-gold">
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Always Training</h3>
              <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.trainingCommitment}</p>
              <Link
                href="/join"
                className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 rounded"
              >
                Learn about joining →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
