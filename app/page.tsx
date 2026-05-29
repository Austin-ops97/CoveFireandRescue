import Link from "next/link";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { announcements } from "@/lib/data/announcements";

const quickActions = [
  {
    title: "Contact",
    description: "Station location, phone, and non-emergency inquiries.",
    href: "/contact",
  },
  {
    title: "View Fleet",
    description: "Explore our apparatus and response vehicles.",
    href: "/fleet",
  },
  {
    title: "Join / Volunteer",
    description: "Learn how to serve with Cove Fire & Rescue.",
    href: "/join",
  },
  {
    title: "Latest Announcements",
    description: "Community notices, events, and department updates.",
    href: "/announcements",
  },
] as const;

const latestAnnouncements = announcements.slice(0, 3);

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-charcoal text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-charcoal via-brand-charcoal-light to-brand-red/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
            Official Department Site
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Cove Fire &amp; Rescue
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
            Serving our community with readiness, professionalism, and pride.
          </p>
          <p className="mt-6 inline-flex items-center rounded-md border border-brand-gold/40 bg-brand-red/20 px-4 py-2 text-sm font-semibold">
            For emergencies, call{" "}
            <a href="tel:911" className="ml-1 underline underline-offset-2 text-brand-gold">
              911
            </a>
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/join" variant="primary" size="lg">
              Join Our Team
            </Button>
            <Button href="/contact" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-charcoal">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          title="Quick Actions"
          subtitle="Find what you need — contact, fleet, recruitment, and news."
          centered
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block h-full">
              <Card hover className="h-full">
                <h3 className="text-lg font-bold text-brand-charcoal group-hover:text-brand-red transition-colors">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-brand-gray">{action.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-brand-red">
                  Learn more →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-gray-light">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            title="Latest Announcements"
            subtitle="Recent updates from Cove Fire & Rescue."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {latestAnnouncements.map((item) => (
              <AnnouncementCard key={item.id} announcement={item} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button href="/announcements" variant="secondary">
              View All Announcements
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          title="Department Overview"
          subtitle="Dedicated volunteers protecting and serving our community."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-bold text-brand-charcoal">Who We Are</h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray">
              Cove Fire &amp; Rescue is a community-based fire and rescue department committed
              to rapid response, professional service, and continuous training. Official
              department history and service details will be published here.
            </p>
          </Card>
          <Card>
            <h3 className="text-lg font-bold text-brand-charcoal">Our Commitment</h3>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray">
              We stand ready 24/7 to protect life and property. From structural fire response
              to rescue operations and community education, our members serve with pride and
              accountability.
            </p>
            <Button href="/about" variant="outline" className="mt-6">
              Learn More About Us
            </Button>
          </Card>
        </div>
      </section>
    </>
  );
}
