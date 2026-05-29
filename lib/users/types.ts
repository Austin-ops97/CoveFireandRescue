export type ManagedUserRole = "admin" | "member";

export type ManagedUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: ManagedUserRole;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ManagedUserFormState = {
  uid: string;
  email: string;
  displayName: string;
  role: ManagedUserRole;
  active: boolean;
};
