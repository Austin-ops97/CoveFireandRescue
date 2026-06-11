import Image from "next/image";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/config/site";

export function HomeAboutSection() {
  return (
    <section id="about" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeader
              eyebrow="About the Department"
              title={`Serving Cove and West Chambers County Since 1970`}
              subtitle="Cove Fire & Rescue provides volunteer fire and emergency response service with a focus on readiness, training, and community protection."
            />
            <p className="text-base leading-relaxed text-gray-500">
              Cove Fire & Rescue is a volunteer fire department committed to protecting lives,
              property, and the community through emergency response, training, and public service.
              Based at Station 91, the department serves Cove and the surrounding West Chambers
              County area with readiness, professionalism, and volunteer pride.
            </p>
            <div className="mt-6">
              <Button href="/about" variant="outline">
                Learn More About Us
              </Button>
            </div>
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={siteConfig.homeApparatusImage.url}
                alt={siteConfig.homeApparatusImage.alt}
                fill
                className="department-image object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
