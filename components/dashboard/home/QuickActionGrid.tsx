import Link from "next/link";
import { Card } from "@/components/site/Card";

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  emphasis?: boolean;
};

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.href + action.title}
          href={action.href}
          className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2"
        >
          <Card
            hover
            variant={action.emphasis ? "accent" : "default"}
            padding="sm"
            className="group h-full"
          >
            <p className="text-sm font-semibold text-brand-charcoal group-hover:text-brand-red transition-colors duration-150">
              {action.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-brand-gray">{action.description}</p>
            <span className="mt-3 inline-flex items-center text-sm font-semibold text-brand-red">
              Open
              <span
                className="ml-1 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
