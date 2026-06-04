import Image from "next/image";
import { Button } from "@/components/site/Button";
import { siteConfig } from "@/lib/config/site";

export function HomeHero() {
  const { heroStationImage } = siteConfig;

  return (
    <section className="relative overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${heroStationImage.url}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-navy-950/[0.97] via-navy-900/[0.93] to-blue-700/[0.86]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold-500">
              {siteConfig.heroEyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[0.95]">
              {siteConfig.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
              {siteConfig.heroHeadline}
            </p>
            <p className="mt-3 text-base font-semibold text-gold-500 sm:text-lg">
              {siteConfig.heroTagline}
            </p>

            <div className="hero-buttons mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/join" variant="heroPrimary" size="lg" className="w-full sm:w-auto">
                Join Our Team
              </Button>
              <Button href="/announcements" variant="heroSecondary" size="lg" className="w-full sm:w-auto">
                View Department Updates
              </Button>
              <Button href="/contact" variant="heroTertiary" size="lg" className="contact-button w-full sm:w-auto">
                Contact Us
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="hero-photo-card w-full max-w-md overflow-hidden rounded-[14px] border border-white/22 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={heroStationImage.url}
                  alt={heroStationImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
                <div className="hero-photo-overlay absolute inset-0 bg-gradient-to-t from-navy-950/[0.88] via-navy-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16">
                  <p className="text-xl font-bold text-white">Station 91</p>
                  <p className="mt-1 text-sm font-medium text-white/80">Cove, Texas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
