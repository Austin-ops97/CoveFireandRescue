import type { AnnouncementCategory } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface BadgeProps {
  label: string;
  category?: AnnouncementCategory;
  className?: string;
}

/** @deprecated Prefer StatusBadge for status labels; Badge remains for announcement categories. */
export function Badge({ label, category, className = "" }: BadgeProps) {
  return (
    <StatusBadge
      label={label}
      category={category}
      className={className}
      uppercase
    />
  );
}
