import Image from "next/image";
import { Button } from "@/components/site/Button";
import { siteConfig } from "@/lib/config/site";

export function HomeHero() {
  const { heroStationImage } = siteConfig;

  return (
    <section className="relative overflow-hidden bg-brand-blue text-white">
      <div
        className="absolute inset-0 bg-gradient-to-b from-brand-blue via-brand-blue to-brand-blue-dark"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-1/2 hidden w-[min(420px,45vw)] -translate-y-1/2 opacity-[0.12] lg:block"
        aria-hidden
      >
        <Image
          src="/logo.png"
          alt=""
          width={420}
          height={420}
          className="h-auto w-full"
          priority
          unoptimized
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">
              Volunteer Fire Department · {siteConfig.tagline}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.75rem] lg:leading-tight">
              {siteConfig.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-100 sm:text-xl">
              {siteConfig.heroHeadline}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/announcements" variant="heroPrimary" size="lg" className="w-full sm:w-auto">
                View Department Updates
              </Button>
              <Button href="/join" variant="heroSecondary" size="lg" className="w-full sm:w-auto">
                Join Our Team
              </Button>
              <Button href="/contact" variant="heroTertiary" size="lg" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-brand-gold/50 bg-white/10 shadow-xl">
              <div className="relative aspect-[4/3] w-full bg-brand-charcoal">
                <Image
                  src={heroStationImage.url}
                  alt={heroStationImage.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/50 to-transparent px-4 pb-4 pt-12">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">Station 91</p>
                      <p className="text-sm font-medium text-brand-gold">Chambers County, Texas</p>
                    </div>
                    <Image
                      src="/logo.png"
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-auto shrink-0 drop-shadow-md"
                      unoptimized
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
              <p className="border-t border-brand-gold/30 bg-brand-blue/40 px-4 py-3 text-center text-sm font-semibold text-white">
                Est. {siteConfig.yearsInService} Years of Service
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-4">
          {siteConfig.heroStats.map((stat) => (
            <li
              key={stat.label}
              className="rounded-lg border border-brand-gold/30 bg-white/5 px-3 py-4 text-center shadow-sm sm:px-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-brand-gold">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
