import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { SectionLabel } from "@/components/site/SectionLabel";
import { siteConfig } from "@/lib/config/site";

export function HomeServicesSection() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <SectionLabel>What We Do</SectionLabel>
      <SectionHeader
        title="Services"
        subtitle="Professional volunteer fire and emergency response for Cove and Chambers County."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {siteConfig.services.map((service) => (
          <Card key={service.id} hover variant="elevated">
            <h3 className="text-lg font-bold text-brand-charcoal">{service.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-gray">{service.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
