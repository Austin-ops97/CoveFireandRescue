import { siteConfig } from "@/lib/config/site";

export function HomeStatsBar() {
  return (
    <section className="stats-bar bg-navy-900 text-white" aria-label="Department highlights">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
          {siteConfig.heroStats.map((stat) => (
            <li key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold tracking-tight text-gold-500 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-semibold leading-snug text-white/85 sm:text-sm">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
