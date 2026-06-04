import Link from "next/link";
import { Card } from "@/components/site/Card";
import { SectionHeader } from "@/components/site/SectionHeader";

const quickActions = [
  {
    title: "Volunteer With Us",
    description:
      "Serve your community, gain emergency response training, and become part of Cove Fire & Rescue.",
    href: "/join",
    label: "Learn About Joining",
  },
  {
    title: "Department Updates",
    description: "Read the latest announcements, notices, and department information.",
    href: "/announcements",
    label: "View Updates",
  },
  {
    title: "Our Fleet",
    description: "See the apparatus and equipment supporting fire and emergency response.",
    href: "/fleet",
    label: "View Fleet",
  },
  {
    title: "Contact Station 91",
    description: "Need non-emergency information? Contact Cove Fire & Rescue.",
    href: "/contact",
    label: "Contact Us",
  },
] as const;

export function HomeQuickActions() {
  return (
    <section className="bg-off-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeader
          eyebrow="Community Resources"
          title="Quick Actions"
          subtitle="Find department updates, fleet information, volunteer opportunities, and contact details."
          centered
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block h-full">
              <Card hover variant="elevated" className="action-card h-full">
                <span className="action-card-accent" aria-hidden />
                <h3 className="text-lg font-bold text-navy-900 transition-colors group-hover:text-blue-700">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{action.description}</p>
                <span className="mt-4 inline-block text-sm font-bold text-blue-700">
                  {action.label} →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
