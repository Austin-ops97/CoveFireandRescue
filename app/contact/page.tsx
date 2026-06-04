import type { Metadata } from "next";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Cove Fire & Rescue — station location, phone, and non-emergency inquiries.",
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      description="Non-emergency inquiries only. For emergencies, call 911."
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-8">
          <section>
            <SectionHeader title="Station Information" />
            <Card>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-brand-charcoal">Address</dt>
                  <dd className="mt-1 text-brand-gray">[Station Address — Coming Soon]</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-charcoal">Phone</dt>
                  <dd className="mt-1 text-brand-gray">(555) 000-0000</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-charcoal">Email</dt>
                  <dd className="mt-1">
                    <a
                      href="mailto:info@covefirerescue.org"
                      className="text-brand-blue hover:underline"
                    >
                      info@covefirerescue.org
                    </a>
                  </dd>
                </div>
              </dl>
            </Card>
          </section>

          <section>
            <SectionHeader title="Google Business Listing" />
            <Card>
              <p className="text-sm text-brand-gray">
                [Google Business Profile placeholder.] Link to our official Google Business
                listing will be added here for reviews, hours, and directions.
              </p>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionHeader title="Map" />
            <Card className="p-0 overflow-hidden">
              <div
                className="flex aspect-video w-full items-center justify-center bg-brand-gray-light text-brand-gray"
                role="img"
                aria-label="Google Maps embed placeholder"
              >
                <p className="px-4 text-center text-sm">
                  Google Maps embed — add station coordinates in a future update
                </p>
              </div>
            </Card>
          </section>

          <section>
            <SectionHeader title="Send a Message" />
            <Card>
              <form className="space-y-4" noValidate aria-label="Contact form placeholder">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-charcoal">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    placeholder="Your name"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-charcoal">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    placeholder="you@example.com"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-charcoal">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    placeholder="Your message"
                    disabled
                  />
                </div>
                <p className="text-xs text-brand-gray">
                  Form submission is not yet connected. Contact functionality will be added in a
                  future update.
                </p>
                <button
                  type="submit"
                  disabled
                  className="w-full rounded-md bg-brand-gray/30 px-4 py-2.5 text-sm font-semibold text-brand-gray cursor-not-allowed"
                >
                  Send Message (Coming Soon)
                </button>
              </form>
            </Card>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
