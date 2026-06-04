import Image from "next/image";
import { Button } from "@/components/site/Button";
import { siteConfig } from "@/lib/config/site";

export function HomeHero() {
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
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-gold">
              Volunteer Fire Department · {siteConfig.tagline}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
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
            <div
              className="relative w-full max-w-sm rounded-2xl border-2 border-brand-gold/50 bg-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-8"
              role="img"
              aria-label="Cove Fire and Rescue department badge — apparatus and crew photo placeholder"
            >
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-brand-gold bg-brand-blue shadow-inner sm:h-32 sm:w-32">
                <Image
                  src="/logo.png"
                  alt="Cove Fire and Rescue logo"
                  width={96}
                  height={96}
                  className="h-20 w-auto sm:h-24"
                />
              </div>
              <p className="mt-5 text-center text-lg font-bold text-white">Est. {siteConfig.yearsInService} Years</p>
              <p className="mt-1 text-center text-sm font-medium text-brand-gold">Chambers County, Texas</p>
              <div className="mt-5 rounded-lg border border-dashed border-white/30 bg-brand-charcoal/40 px-4 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
                  Photo coming soon
                </p>
                <p className="mt-2 text-sm text-gray-200">
                  Apparatus, station, or crew image will appear here when provided.
                </p>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 border-t border-white/15 pt-8 sm:grid-cols-4 sm:gap-4">
          {siteConfig.heroStats.map((stat) => (
            <li
              key={stat.label}
              className="rounded-lg border border-brand-gold/30 bg-white/5 px-3 py-4 text-center shadow-sm sm:px-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-brand-gold sm:text-[0.7rem]">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
