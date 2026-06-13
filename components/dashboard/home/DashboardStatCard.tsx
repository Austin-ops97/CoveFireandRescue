import type { ReactNode } from "react";
import { Card } from "@/components/site/Card";

type DashboardStatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  variant?: "default" | "attention" | "success";
};

const variantClasses = {
  default: "text-brand-charcoal",
  attention: "text-brand-red",
  success: "text-green-700",
};

export function DashboardStatCard({
  label,
  value,
  hint,
  variant = "default",
}: DashboardStatCardProps) {
  return (
    <Card variant="muted" padding="sm" className="h-full">
      <p className="text-base font-semibold text-brand-gray sm:text-sm">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${variantClasses[variant]}`}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-brand-gray">{hint}</p> : null}
    </Card>
  );
}

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function DashboardSection({
  title,
  description,
  children,
  action,
}: DashboardSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-brand-gray">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
