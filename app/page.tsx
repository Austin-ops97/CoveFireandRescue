import Link from "next/link";
import { HomeAnnouncementsPreview } from "@/components/site/HomeAnnouncementsPreview";
import { HomeApparatusFeature } from "@/components/site/HomeApparatusFeature";
import { HomeHero } from "@/components/site/HomeHero";
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
    title: "Our Services",
    description: "Fire protection, EMS support, mutual aid, and community response.",
    href: "/services",
    label: "What we do",
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionLabel>Community Resources</SectionLabel>
        <SectionHeader
          title="Quick Actions"
          subtitle="Find department updates, services, apparatus, and contact information."
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
      </section>

      <HomeApparatusFeature />

      <section className="border-y border-brand-gold/25 bg-brand-gray-light">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <SectionLabel>Who We Serve</SectionLabel>
              <SectionHeader title="Mission & Service Area" />
              <Card variant="elevated">
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Our Mission</h3>
                <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.mission}</p>
                <div className="my-6 h-px bg-brand-gold/30" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-brand-blue">Service Area</h3>
                <p className="mt-3 leading-relaxed text-brand-gray">{siteConfig.serviceArea}</p>
              </Card>
            </div>
            <div>
              <SectionLabel>Always Training</SectionLabel>
              <SectionHeader title="Ready to Respond" />
              <Card variant="elevated" className="border-l-4 border-l-brand-gold h-full">
                <p className="leading-relaxed text-brand-gray">{siteConfig.trainingCommitment}</p>
                <Link
                  href="/join"
                  className="mt-6 inline-block text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 rounded"
                >
                  Learn about joining →
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionLabel>What We Do</SectionLabel>
        <SectionHeader
          title="Services"
          subtitle="Professional volunteer fire and emergency response for Cove and Chambers County."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {siteConfig.services.map((service) => (
            <Card
              key={service.id}
              hover
              variant={service.featured ? "elevated" : "default"}
              className={service.featured ? "border-l-4 border-l-brand-blue sm:col-span-2" : ""}
            >
              {service.featured && (
                <span className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-brand-gold-muted">
                  Primary Service
                </span>
              )}
              <h3 className="text-lg font-bold text-brand-charcoal">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">{service.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button href="/services" variant="primary">
            View All Services
          </Button>
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionLabel>Our Story</SectionLabel>
          <SectionHeader
            title={`${siteConfig.yearsInService} Years of Service`}
            subtitle="Built by volunteers, sustained by community commitment."
          />
          <Card variant="muted" className="max-w-4xl">
            <p className="text-base leading-relaxed text-brand-gray">{siteConfig.historyPreview}</p>
            <Button href="/about" variant="outline" className="mt-6">
              Read Full History
            </Button>
          </Card>
        </div>
      </section>

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
