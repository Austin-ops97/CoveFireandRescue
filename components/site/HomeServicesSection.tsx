import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/config/site";

export function HomeServicesSection() {
  return (
    <section id="services" className="bg-off-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          eyebrow="What We Do"
          title="Fire & Emergency Response Services"
          subtitle="Professional volunteer fire and emergency response for Cove and Chambers County."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {siteConfig.services.map((service) => (
            <Card key={service.id} hover variant="elevated">
              <h3 className="text-lg font-bold text-navy-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{service.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
