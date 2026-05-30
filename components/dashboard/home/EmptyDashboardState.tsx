import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";

type EmptyDashboardStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyDashboardState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyDashboardStateProps) {
  return (
    <Card variant="muted" padding="lg" className="text-center">
      <p className="text-lg font-bold text-brand-charcoal">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-gray">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-5 inline-block">
          <Button type="button" size="sm">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </Card>
  );
}
