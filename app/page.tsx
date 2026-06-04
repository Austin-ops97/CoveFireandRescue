import Link from "next/link";
import { HomeAboutSection } from "@/components/site/HomeAboutSection";
import { HomeAnnouncementsPreview } from "@/components/site/HomeAnnouncementsPreview";
import { HomeApparatusFeature } from "@/components/site/HomeApparatusFeature";
import { HomeHero } from "@/components/site/HomeHero";
import { HomeServicesSection } from "@/components/site/HomeServicesSection";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { SectionLabel } from "@/components/site/SectionLabel";
import { siteConfig } from "@/lib/config/site";

const quickActions = [
  {
    title: "Department Updates",
    description: "Burn bans, training nights, events, and official notices.",
    href: "/announcements",
    label: "View updates",
  },
  {
    title: "Leadership",
    description: "Meet the officers and leaders serving our department.",
    href: "/leadership",
    label: "View leadership",
  },
  {
    title: "Fleet & Apparatus",
    description: "Response vehicles and equipment serving our district.",
    href: "/fleet",
    label: "View fleet",
  },
  {
    title: "Contact & Station",
    description: "Address, hours, phone, and non-emergency messages.",
    href: "/contact",
    label: "Get in touch",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <div className="h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent" aria-hidden />

      <HomeAboutSection />
      <HomeServicesSection />

      <section className="border-y border-brand-gold/20 bg-brand-gray-light">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionLabel>Community Resources</SectionLabel>
          <SectionHeader
            title="Quick Actions"
            subtitle="Find department updates, leadership, apparatus, and contact information."
            centered
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="group block h-full">
                <Card hover variant="elevated" className="h-full border-t-4 border-t-brand-gold">
                  <h3 className="text-lg font-bold text-brand-charcoal group-hover:text-brand-blue transition-colors">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">{action.description}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-brand-blue">
                    {action.label} →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeApparatusFeature />
      <HomeAnnouncementsPreview />

      <section className="bg-brand-blue text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel className="border-brand-gold/60 bg-brand-gold/20 text-white">
              Volunteer With Us
            </SectionLabel>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Join Our Team</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-200 sm:text-lg">
              Serve your neighbors, train twice each week, and be part of a department with{" "}
              {siteConfig.yearsInService} years of history in Cove, Texas.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button href="/join" variant="heroSecondary" size="lg" className="w-full sm:w-auto">
                Apply to Join
              </Button>
              <Button href="/contact" variant="heroTertiary" size="lg" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
