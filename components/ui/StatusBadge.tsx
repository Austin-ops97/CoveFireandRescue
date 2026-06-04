import type { AnnouncementCategory } from "@/lib/types";

export type StatusVariant =
  | "active"
  | "inactive"
  | "archived"
  | "draft"
  | "published"
  | "open"
  | "completed"
  | "admin"
  | "member"
  | "pass"
  | "fail"
  | "attention"
  | "warning"
  | "info"
  | "neutral"
  | "coming_soon"
  | "module_active";

const variantStyles: Record<StatusVariant, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  inactive: "bg-amber-50 text-amber-900 ring-amber-600/15",
  archived: "bg-gray-100 text-gray-600 ring-gray-500/10",
  draft: "bg-gray-100 text-gray-700 ring-gray-500/10",
  published: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  open: "bg-sky-50 text-sky-800 ring-sky-600/15",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  admin: "bg-brand-blue/10 text-brand-blue ring-brand-blue/20",
  member: "bg-gray-100 text-brand-charcoal ring-gray-500/10",
  pass: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  fail: "bg-red-50 text-red-800 ring-red-600/15",
  attention: "bg-red-50 text-red-800 ring-red-600/15",
  warning: "bg-amber-50 text-amber-900 ring-amber-600/15",
  info: "bg-sky-50 text-sky-800 ring-sky-600/15",
  neutral: "bg-gray-100 text-brand-charcoal ring-gray-500/10",
  coming_soon: "bg-gray-100 text-brand-gray ring-gray-500/10",
  module_active: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
};

const categoryStyles: Record<AnnouncementCategory, string> = {
  "Community Notice": "bg-sky-50 text-sky-800 ring-sky-600/15",
  Training: "bg-violet-50 text-violet-800 ring-violet-600/15",
  "Burn Ban": "bg-orange-50 text-orange-900 ring-orange-600/15",
  Event: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  "Department Update": "bg-gray-100 text-brand-charcoal ring-gray-500/10",
};

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset";

type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
  category?: AnnouncementCategory;
  className?: string;
  uppercase?: boolean;
};

export function StatusBadge({
  label,
  variant = "neutral",
  category,
  className = "",
  uppercase = false,
}: StatusBadgeProps) {
  const style = category ? categoryStyles[category] : variantStyles[variant];

  return (
    <span className={`${base} ${style} ${uppercase ? "uppercase" : ""} ${className}`}>
      {label}
    </span>
  );
}
