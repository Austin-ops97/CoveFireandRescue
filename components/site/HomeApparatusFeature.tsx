import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/site/SectionLabel";
import { siteConfig } from "@/lib/config/site";

export function HomeApparatusFeature() {
  const { homeApparatusImage } = siteConfig;

  return (
    <section className="border-y border-brand-gold/20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <SectionLabel>In the Community</SectionLabel>
            <h2 className="border-b-2 border-brand-gold/35 pb-2 text-2xl font-bold tracking-tight text-brand-blue sm:text-3xl">
              Ready When Called
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-gray">
              {homeApparatusImage.caption}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray">
              From Tanker 92 and our engines to support units, Cove Fire &amp; Rescue maintains the
              tools and training needed to serve Chambers County with professionalism and pride.
            </p>
            <Link
              href="/fleet"
              className="mt-6 inline-flex text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 rounded"
            >
              View our fleet →
            </Link>
          </div>

          <div className="order-1 lg:order-2">
            <figure className="overflow-hidden rounded-2xl border border-brand-gold/40 bg-brand-gray-light shadow-md">
              <div className="relative aspect-[16/10] w-full max-h-[min(420px,55vh)]">
                <Image
                  src={homeApparatusImage.url}
                  alt={homeApparatusImage.alt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
              </div>
              <figcaption className="border-t border-brand-gold/25 bg-brand-gray-light px-4 py-3 text-center text-xs font-medium text-brand-gray sm:text-sm">
                Cove Fire &amp; Rescue apparatus on scene — volunteer members serving our community
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
