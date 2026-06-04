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
      eyebrow="Get In Touch"
      title="Contact Us"
      description="Non-emergency inquiries only. For life-threatening emergencies, call 911 immediately."
    >
      <div
        role="alert"
        className="mb-10 rounded-[10px] border border-red-700/30 bg-red-700 px-5 py-4 text-center font-bold text-white"
      >
        Emergency: Call{" "}
        <a href="tel:911" className="underline underline-offset-2 hover:text-gold-500">
          911
        </a>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <SectionHeader
            eyebrow="Non-Emergency"
            title="Station 91"
            subtitle="Address, phone, email, and station hours."
          />
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
          <SectionHeader title="Send a Message" subtitle="We respond to non-emergency inquiries during station meeting hours." />
          <Card>
            <p className="mb-4 text-sm text-gray-500">
              Messages are delivered to {siteConfig.contact.formEmail}. For emergencies, call 911.
            </p>
            <ContactForm />
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
