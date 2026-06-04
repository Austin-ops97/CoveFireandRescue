import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { departmentHistory, siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "About Cove Fire & Rescue",
  description:
    "Learn about Cove Fire & Rescue — a volunteer fire department serving Cove and West Chambers County, Texas since 1970.",
  keywords: [...siteConfig.seo.keywords],
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About the Department"
      title="Serving Cove and West Chambers County"
      description="Cove Fire & Rescue is a volunteer fire department committed to protecting lives, property, and the community through emergency response, training, and public service."
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <SectionHeader
            title="Our Mission"
            subtitle="Professional volunteer fire and emergency response for Cove and Chambers County."
          />
          <p className="text-base leading-relaxed text-gray-500">{siteConfig.mission}</p>
          <p className="mt-4 text-base leading-relaxed text-gray-500">{siteConfig.trainingCommitment}</p>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={siteConfig.homeApparatusImage.url}
              alt={siteConfig.homeApparatusImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
          </div>
        </Card>
      </div>

      <section className="mt-12">
        <SectionHeader
          eyebrow="Our History"
          title={`${siteConfig.yearsInService} Years of Volunteer Service`}
          subtitle="Built through community commitment, volunteer labor, and shared dedication."
        />
        <Card>
          <p className="leading-relaxed text-gray-500">{siteConfig.historyCondensed}</p>
          <p className="mt-4 leading-relaxed text-gray-500">{departmentHistory.slice(0, 600)}…</p>
        </Card>
      </section>

      <section className="mt-12">
        <SectionHeader title="What We Do" subtitle="Core services provided to Cove and surrounding areas." />
        <div className="grid gap-5 sm:grid-cols-2">
          {siteConfig.services.map((service) => (
            <Card key={service.id} hover>
              <h3 className="text-lg font-bold text-navy-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{service.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader title="Service Area" />
        <Card>
          <p className="leading-relaxed text-gray-500">{siteConfig.serviceArea}</p>
        </Card>
      </section>
    </PageShell>
  );
}
