import type { ManagedUserProfile } from "@/lib/users/types";

export function getDisplayDepartmentEmail(profile: ManagedUserProfile): string | null {
  return profile.departmentEmail ?? profile.email;
}
