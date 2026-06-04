import Link from "next/link";
import { Button } from "@/components/site/Button";
import { SectionHeader } from "@/components/site/SectionHeader";

const joinBenefits = [
  "Emergency response training",
  "Hands-on department experience",
  "Serve your local community",
  "Be part of a disciplined team",
] as const;

export function HomeJoinSection() {
  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
          <SectionHeader
            eyebrow="Volunteer With Us"
            title="Become a Volunteer Firefighter"
            subtitle="Cove Fire & Rescue depends on dedicated volunteers who are willing to serve their community. No prior experience is required. Training, equipment, and support are provided."
            centered
            dark
          />
          <ul className="mx-auto mt-2 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            {joinBenefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-white/85 sm:text-base">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button href="/join" variant="heroPrimary" size="lg">
              Start the Volunteer Process
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/65">
            Questions?{" "}
            <Link href="/contact" className="font-semibold text-gold-500 underline-offset-2 hover:underline">
              Contact the department
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
