type ModuleStatus = "active" | "coming_soon" | "admin_only";

const styles: Record<ModuleStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  coming_soon: "bg-gray-100 text-brand-gray border-gray-200",
  admin_only: "bg-amber-100 text-amber-900 border-amber-200",
};

const labels: Record<ModuleStatus, string> = {
  active: "Active placeholder",
  coming_soon: "Coming soon",
  admin_only: "Admin only",
};

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
