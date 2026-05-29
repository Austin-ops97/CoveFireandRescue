import type { AnnouncementCategory } from "@/lib/types";

const categoryStyles: Record<AnnouncementCategory, string> = {
  "Community Notice": "bg-blue-100 text-blue-800",
  Training: "bg-purple-100 text-purple-800",
  "Burn Ban": "bg-orange-100 text-orange-800",
  Event: "bg-green-100 text-green-800",
  "Department Update": "bg-brand-gray-light text-brand-charcoal border border-brand-gray/30",
};

interface BadgeProps {
  label: string;
  category?: AnnouncementCategory;
  className?: string;
}

export function Badge({ label, category, className = "" }: BadgeProps) {
  const style = category ? categoryStyles[category] : "bg-brand-gray-light text-brand-charcoal";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
