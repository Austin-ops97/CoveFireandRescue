import type { Metadata } from "next";
import { Card } from "@/components/site/Card";
import { ContactForm } from "@/components/site/ContactForm";
import { ContactInfoBlock } from "@/components/site/ContactInfoBlock";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact Cove Fire & Rescue",
  description:
    "Contact Cove Fire & Rescue in Cove, Texas — station address, phone, email, hours, and non-emergency message form.",
  keywords: [...siteConfig.seo.keywords],
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      description="Non-emergency inquiries only. For emergencies, call 911."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHeader title="Station Information" />
          <Card>
            <ContactInfoBlock />
          </Card>
        </section>

        <section>
          <SectionHeader title="Map & Directions" />
          <Card className="overflow-hidden p-0">
            <iframe
              title="Cove Fire & Rescue station location"
              src={siteConfig.mapsEmbedUrl}
              className="aspect-video w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Card>
        </section>

        <section className="lg:col-span-2">
          <SectionHeader title="Send a Message" />
          <Card>
            <p className="mb-4 text-xs text-brand-gray">
              Messages are delivered to {siteConfig.contact.formEmail}. For emergencies, call 911.
            </p>
            <ContactForm />
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
