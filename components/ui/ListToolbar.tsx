import type { ReactNode } from "react";
import { Button } from "@/components/site/Button";

type ListToolbarProps = {
  title: string;
  countLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshDisabled?: boolean;
  actions?: ReactNode;
};

export function ListToolbar({
  title,
  countLabel,
  onRefresh,
  refreshing = false,
  refreshDisabled = false,
  actions,
}: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-brand-charcoal">{title}</h2>
        {countLabel && (
          <p className="mt-1 text-sm text-brand-gray" aria-live="polite">
            {countLabel}
          </p>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 [&>*]:w-full sm:[&>*]:w-auto">
        {actions}
        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshDisabled}
            onClick={onRefresh}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        )}
      </div>
    </div>
  );
}
