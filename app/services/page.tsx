import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Fire Protection & Emergency Services",
  description:
    "Fire protection, EMS response support, mutual aid, and community emergency response from Cove Fire & Rescue in Chambers County, Texas.",
  keywords: [...siteConfig.seo.keywords],
};

export default function ServicesPage() {
  return (
    <PageShell
      title="What We Do"
      description="Professional volunteer fire and emergency response services for Cove and surrounding areas."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {siteConfig.services.map((service) => (
          <Card
            key={service.id}
            className={service.featured ? "md:col-span-2 border-l-4 border-l-brand-blue ring-1 ring-brand-gold/30" : ""}
          >
            {service.featured && (
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gold-muted">
                Primary Service
              </p>
            )}
            <h2 className={`font-bold text-brand-charcoal ${service.featured ? "mt-2 text-2xl" : "text-xl"}`}>
              {service.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray">{service.description}</p>
          </Card>
        ))}
      </div>

      <section className="mt-14">
        <SectionHeader title="Volunteer With Us" />
        <Card className="bg-brand-gray-light">
          <p className="text-brand-gray leading-relaxed">
            Our members train twice each week and serve the community on their own time. If you are
            interested in joining, we welcome you to submit an application or contact the department
            during station meeting hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button href="/join" variant="primary">
              Apply to Join
            </Button>
            <Button href="/contact" variant="outline">
              Contact the Department
            </Button>
          </div>
        </Card>
      </section>
    </PageShell>
  );
}
