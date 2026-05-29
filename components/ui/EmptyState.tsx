import type { ReactNode } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <Card variant="muted" className={`text-center sm:text-left ${className}`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {icon && (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gray-light text-brand-gray"
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-brand-charcoal">{title}</h3>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-gray">{description}</p>
          {actionLabel && actionHref && (
            <Button href={actionHref} variant="outline" size="sm" className="mt-4">
              {actionLabel}
            </Button>
          )}
          {actionLabel && onAction && !actionHref && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
