import { siteConfig } from "@/lib/config/site";

export function LocalBusinessJsonLd() {
  const { contact, social } = siteConfig;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FireStation",
    name: siteConfig.name,
    description: siteConfig.seo.defaultDescription,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
    telephone: contact.publicPhone,
    email: contact.publicEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.street,
      addressLocality: contact.address.city,
      addressRegion: contact.address.state,
      postalCode: contact.address.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: siteConfig.hours.schedule.map((entry) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: entry.day,
      opens: "19:00",
      closes: "21:00",
    })),
    sameAs: [social.facebook, social.googleBusiness].filter(Boolean),
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Chambers County, Texas",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
