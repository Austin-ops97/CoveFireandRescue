import { StatusBadge } from "@/components/ui/StatusBadge";

type ModuleStatus = "active" | "coming_soon" | "admin_only";

const variantMap: Record<ModuleStatus, "module_active" | "coming_soon" | "admin"> = {
  active: "module_active",
  coming_soon: "coming_soon",
  admin_only: "admin",
};

const labels: Record<ModuleStatus, string> = {
  active: "Active",
  coming_soon: "Coming soon",
  admin_only: "Admin only",
};

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return <StatusBadge label={labels[status]} variant={variantMap[status]} uppercase />;
}
