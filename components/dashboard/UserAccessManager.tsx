"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  EmptyState,
  FormField,
  Input,
  ListToolbar,
  Modal,
  Select,
  SkeletonTable,
  StatusBadge,
} from "@/components/ui";
import { USER_ROLES, roleLabel } from "@/lib/auth/roles";
import {
  createManagedUser,
  deleteManagedUserPermanently,
  disableManagedUser,
  fetchManagedUsers,
  resetManagedUserPassword,
  updateManagedUser,
} from "@/lib/users/client";
import {
  fetchEmailProvisioningConfig,
  provisionDepartmentEmail,
  resetDepartmentEmailPassword,
  type EmailProvisioningConfig,
} from "@/lib/email-provisioning/client";
import { suggestDepartmentEmailUsername } from "@/lib/email-provisioning/validation";
import type {
  CreateUserFormState,
  EditUserFormState,
  EmailProvisioningStatus,
  ManagedUserProfile,
  ManagedUserRole,
  ResetPasswordFormState,
} from "@/lib/users/types";

const emptyCreateForm: CreateUserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  role: "member",
  active: true,
  phone: "",
  title: "",
  passwordMode: "reset_link",
  temporaryPassword: "",
  createDepartmentEmail: false,
  departmentEmailUsername: "",
  departmentEmailPassword: "",
  departmentEmailPasswordConfirm: "",
  departmentEmailQuota: 1024,
};

const emptyDepartmentEmailForm = {
  emailUsername: "",
  password: "",
  confirmPassword: "",
  quotaMb: 1024 as 1024 | 2048 | 5120 | 0,
};

const emptyEditForm: EditUserFormState = {
  firstName: "",
  lastName: "",
  role: "member",
  active: true,
  phone: "",
  title: "",
};

const emptyResetForm: ResetPasswordFormState = {
  mode: "reset_link",
  temporaryPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ModalMode =
  | "create"
  | "edit"
  | "reset"
  | "disable"
  | "delete"
  | "department-email"
  | "department-email-reset"
  | null;

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return "—";
}

function roleBadgeVariant(role: ManagedUserRole) {
  if (role === "admin") return "admin" as const;
  if (role === "editor") return "info" as const;
  if (role === "viewer") return "neutral" as const;
  return "member" as const;
}

function profileToEditForm(profile: ManagedUserProfile): EditUserFormState {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    role: profile.role,
    active: profile.active,
    phone: profile.phone ?? "",
    title: profile.title ?? "",
  };
}

function validateCreateForm(
  form: CreateUserFormState,
  emailConfigured: boolean
): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.lastName.trim()) return "Last name is required.";
  if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) {
    return "A valid email address is required.";
  }
  if (form.passwordMode === "temporary" && form.temporaryPassword.length < 8) {
    return "Temporary password must be at least 8 characters.";
  }
  if (form.createDepartmentEmail) {
    if (!emailConfigured) {
      return "Department email provisioning is not configured on this server.";
    }
    if (!form.departmentEmailUsername.trim()) {
      return "Email username is required.";
    }
    if (form.departmentEmailPassword.length < 8) {
      return "Department email password must be at least 8 characters.";
    }
    if (form.departmentEmailPassword !== form.departmentEmailPasswordConfirm) {
      return "Department email password and confirm password must match.";
    }
  }
  return null;
}

function emailStatusLabel(status: EmailProvisioningStatus): string {
  if (status === "provisioned") return "Provisioned";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return "Not created";
}

function emailStatusVariant(status: EmailProvisioningStatus) {
  if (status === "provisioned") return "active" as const;
  if (status === "failed") return "inactive" as const;
  if (status === "pending") return "info" as const;
  return "neutral" as const;
}

function validateEditForm(form: EditUserFormState): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.lastName.trim()) return "Last name is required.";
  return null;
}

export function UserAccessManager() {
  const [users, setUsers] = useState<ManagedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [passwordSetupLink, setPasswordSetupLink] = useState<string | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailProvisioningConfig | null>(null);
  const [departmentEmailForm, setDepartmentEmailForm] = useState(emptyDepartmentEmailForm);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<ManagedUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<ManagedUserProfile | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(emptyCreateForm);
  const [editForm, setEditForm] = useState<EditUserFormState>(emptyEditForm);
  const [resetForm, setResetForm] = useState<ResetPasswordFormState>(emptyResetForm);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const list = await fetchManagedUsers();
      setUsers(list);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void fetchEmailProvisioningConfig()
      .then(setEmailConfig)
      .catch(() => {
        setEmailConfig({
          configured: false,
          domain: null,
          quotaOptions: [
            { value: 1024, label: "1024 MB" },
            { value: 2048, label: "2048 MB" },
            { value: 5120, label: "5120 MB" },
          ],
          supportsUnlimited: false,
        });
      });
  }, []);

  useEffect(() => {
    if (modalMode !== "create" || !createForm.createDepartmentEmail) return;
    const suggested = suggestDepartmentEmailUsername(
      createForm.firstName,
      createForm.lastName
    );
    if (!suggested) return;
    setCreateForm((prev) => {
      if (prev.departmentEmailUsername.trim()) return prev;
      return { ...prev, departmentEmailUsername: suggested };
    });
  }, [
    modalMode,
    createForm.createDepartmentEmail,
    createForm.firstName,
    createForm.lastName,
    createForm.departmentEmailUsername,
  ]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter === "active" && !user.active) return false;
      if (statusFilter === "inactive" && user.active) return false;
      if (!query) return true;

      const haystack = [
        user.displayName,
        user.firstName,
        user.lastName,
        user.email,
        user.title,
        user.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [users, search, roleFilter, statusFilter]);

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setActionError(null);
    setCreateForm(emptyCreateForm);
    setEditForm(emptyEditForm);
    setResetForm(emptyResetForm);
    setDepartmentEmailForm(emptyDepartmentEmailForm);
  }

  function openCreateModal() {
    setSuccessMessage(null);
    setWarningMessage(null);
    setPasswordSetupLink(null);
    setActionError(null);
    setCreateForm(emptyCreateForm);
    setModalMode("create");
  }

  function openDepartmentEmailModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setDepartmentEmailForm({
      ...emptyDepartmentEmailForm,
      emailUsername: suggestDepartmentEmailUsername(
        user.firstName ?? "",
        user.lastName ?? ""
      ),
      quotaMb: (emailConfig?.quotaOptions[0]?.value ?? 1024) as 1024 | 2048 | 5120 | 0,
    });
    setModalMode("department-email");
  }

  function openDepartmentEmailResetModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setDepartmentEmailForm({
      ...emptyDepartmentEmailForm,
      emailUsername: "",
    });
    setModalMode("department-email-reset");
  }

  function openEditModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setEditForm(profileToEditForm(user));
    setModalMode("edit");
  }

  function openResetModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setResetForm(emptyResetForm);
    setPasswordSetupLink(null);
    setModalMode("reset");
  }

  function openDisableModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setModalMode("disable");
  }

  function openDeleteModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setModalMode("delete");
  }

  async function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    setPasswordSetupLink(null);

    const validationError = validateCreateForm(createForm, emailConfig?.configured ?? false);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSaving(true);
    try {
      const result = await createManagedUser(createForm);
      await loadUsers(true);
      closeModal();
      setSuccessMessage(result.message);
      setWarningMessage(result.emailWarning ?? null);
      if (result.passwordSetupLink) {
        setPasswordSetupLink(result.passwordSetupLink);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);

    const validationError = validateEditForm(editForm);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSaving(true);
    try {
      await updateManagedUser(selectedUser.uid, editForm);
      await loadUsers(true);
      closeModal();
      setSuccessMessage("User updated successfully.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    setPasswordSetupLink(null);

    if (resetForm.mode === "temporary" && resetForm.temporaryPassword.length < 8) {
      setActionError("Temporary password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const result = await resetManagedUserPassword(selectedUser.uid, resetForm);
      setSuccessMessage(result.message);
      if (result.passwordSetupLink) {
        setPasswordSetupLink(result.passwordSetupLink);
      }
      closeModal();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisableConfirm() {
    if (!selectedUser) return;
    setSaving(true);
    setActionError(null);
    try {
      await disableManagedUser(selectedUser.uid);
      await loadUsers(true);
      closeModal();
      setSuccessMessage(`${selectedUser.displayName ?? "User"} has been disabled.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to disable user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDepartmentEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);

    if (!departmentEmailForm.emailUsername.trim()) {
      setActionError("Email username is required.");
      return;
    }
    if (departmentEmailForm.password.length < 8) {
      setActionError("Email password must be at least 8 characters.");
      return;
    }
    if (departmentEmailForm.password !== departmentEmailForm.confirmPassword) {
      setActionError("Password and confirm password must match.");
      return;
    }

    setSaving(true);
    try {
      const result = await provisionDepartmentEmail(selectedUser.uid, departmentEmailForm);
      await loadUsers(true);
      closeModal();
      setSuccessMessage(result.message);
      setWarningMessage(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to provision department email."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDepartmentEmailResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);

    if (departmentEmailForm.password.length < 8) {
      setActionError("Email password must be at least 8 characters.");
      return;
    }
    if (departmentEmailForm.password !== departmentEmailForm.confirmPassword) {
      setActionError("Password and confirm password must match.");
      return;
    }

    setSaving(true);
    try {
      const result = await resetDepartmentEmailPassword(selectedUser.uid, {
        password: departmentEmailForm.password,
        confirmPassword: departmentEmailForm.confirmPassword,
      });
      closeModal();
      setSuccessMessage(result.message);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to reset department email password."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedUser) return;
    setSaving(true);
    setActionError(null);
    try {
      await deleteManagedUserPermanently(selectedUser.uid);
      await loadUsers(true);
      closeModal();
      setSuccessMessage(`${selectedUser.displayName ?? "User"} has been permanently deleted.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-brand-gray">
            Create and manage portal accounts. User IDs are assigned automatically by the
            authentication system.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create user
        </Button>
      </div>

      {successMessage && <AlertBanner variant="success">{successMessage}</AlertBanner>}

      {warningMessage && (
        <AlertBanner variant="warning" title="Department email warning">
          {warningMessage}
        </AlertBanner>
      )}

      {passwordSetupLink && (
        <AlertBanner variant="info" title="Password setup link">
          <p className="text-sm">
            Share this link with the user so they can set their password. It expires after use.
          </p>
          <input
            type="text"
            readOnly
            value={passwordSetupLink}
            className="mt-2 w-full rounded-lg border border-brand-gray/20 bg-white px-3 py-2 text-xs text-brand-charcoal"
            onFocus={(event) => event.target.select()}
          />
        </AlertBanner>
      )}

      <ListToolbar
        title="Manage users"
        countLabel={
          loading ? undefined : `${filteredUsers.length} of ${users.length} user${users.length === 1 ? "" : "s"}`
        }
        onRefresh={() => void loadUsers(true)}
        refreshing={refreshing}
        refreshDisabled={loading || refreshing}
      />

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField id="userSearch" label="Search">
            <Input
              id="userSearch"
              type="search"
              placeholder="Name, email, title…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </FormField>
          <FormField id="roleFilter" label="Filter by role">
            <Select
              id="roleFilter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as ManagedUserRole | "all")
              }
            >
              <option value="all">All roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="statusFilter" label="Filter by status">
            <Select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | "active" | "inactive")
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
        </div>
      </Card>

      {loadError && (
        <AlertBanner variant="error" title="Could not load users" onRetry={() => void loadUsers(true)}>
          {loadError}
        </AlertBanner>
      )}

      {loading && !loadError && <SkeletonTable rows={5} />}

      {!loading && !loadError && filteredUsers.length === 0 && (
        <EmptyState
          title={users.length === 0 ? "No users yet" : "No users match your filters"}
          description={
            users.length === 0
              ? "Create the first portal user with the button above."
              : "Try adjusting your search or filters."
          }
        />
      )}

      {!loading && !loadError && filteredUsers.length > 0 && (
        <>
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                  <thead className="bg-gray-50/90">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Name</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Email</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Role</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Status</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Last login</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Created</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gray/15">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-brand-charcoal/[0.02]">
                        <td className="px-4 py-3 font-medium text-brand-charcoal">
                          <div>{user.displayName || "—"}</div>
                          {user.title && (
                            <div className="text-xs text-brand-gray">{user.title}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-brand-gray">{user.email || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={roleLabel(user.role)}
                            variant={roleBadgeVariant(user.role)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={user.active ? "Active" : "Inactive"}
                            variant={user.active ? "active" : "inactive"}
                          />
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {formatTimestamp(user.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {formatTimestamp(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="text-xs font-semibold text-brand-red hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openResetModal(user)}
                              className="text-xs font-semibold text-brand-blue hover:underline"
                            >
                              Reset password
                            </button>
                            {user.active && (
                              <button
                                type="button"
                                onClick={() => openDisableModal(user)}
                                className="text-xs font-semibold text-amber-700 hover:underline"
                              >
                                Disable
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDeleteModal(user)}
                              className="text-xs font-semibold text-brand-gray hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredUsers.map((user) => (
              <Card key={user.uid}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-brand-charcoal">
                      {user.displayName || "Unnamed user"}
                    </h3>
                    <p className="mt-1 text-sm text-brand-gray">{user.email || "No email"}</p>
                    {user.title && <p className="text-xs text-brand-gray">{user.title}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={roleLabel(user.role)} variant={roleBadgeVariant(user.role)} />
                    <StatusBadge
                      label={user.active ? "Active" : "Inactive"}
                      variant={user.active ? "active" : "inactive"}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-brand-gray">
                  Last login {formatTimestamp(user.lastLoginAt)} · Created{" "}
                  {formatTimestamp(user.createdAt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(user)}>
                    Edit
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => openResetModal(user)}>
                    Reset password
                  </Button>
                  {user.active && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => openDisableModal(user)}>
                      Disable
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {modalMode === "create" && (
        <Modal
          title="Create user"
          description="A secure account will be created automatically. No UID is required."
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="create-user-form" disabled={saving}>
                {saving ? "Creating…" : "Create user"}
              </Button>
            </>
          }
        >
          <form id="create-user-form" onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="createFirstName" label="First name" required>
                <Input
                  id="createFirstName"
                  value={createForm.firstName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  required
                />
              </FormField>
              <FormField id="createLastName" label="Last name" required>
                <Input
                  id="createLastName"
                  value={createForm.lastName}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  required
                />
              </FormField>
            </div>
            <FormField id="createEmail" label="Email" required>
              <Input
                id="createEmail"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="createRole" label="Role" required>
                <Select
                  id="createRole"
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      role: event.target.value as ManagedUserRole,
                    }))
                  }
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="createStatus" label="Status" required>
                <Select
                  id="createStatus"
                  value={createForm.active ? "active" : "inactive"}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      active: event.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="createPhone" label="Phone">
                <Input
                  id="createPhone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </FormField>
              <FormField id="createTitle" label="Title / department">
                <Input
                  id="createTitle"
                  value={createForm.title}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </FormField>
            </div>
            <FormField
              id="createPasswordMode"
              label="Password setup"
              hint="Password setup links are more secure. Share the generated link with the user."
            >
              <Select
                id="createPasswordMode"
                value={createForm.passwordMode}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    passwordMode: event.target.value as CreateUserFormState["passwordMode"],
                  }))
                }
              >
                <option value="reset_link">Generate password setup link</option>
                <option value="temporary">Set temporary password</option>
              </Select>
            </FormField>
            {createForm.passwordMode === "temporary" && (
              <FormField id="createTempPassword" label="Temporary password" required>
                <Input
                  id="createTempPassword"
                  type="password"
                  value={createForm.temporaryPassword}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      temporaryPassword: event.target.value,
                    }))
                  }
                  minLength={8}
                  required
                />
              </FormField>
            )}

            <div className="rounded-xl border border-brand-gray/15 bg-brand-charcoal/[0.02] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <input
                  id="createDepartmentEmail"
                  type="checkbox"
                  checked={createForm.createDepartmentEmail}
                  disabled={!emailConfig?.configured}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      createDepartmentEmail: event.target.checked,
                      departmentEmailUsername: event.target.checked
                        ? prev.departmentEmailUsername ||
                          suggestDepartmentEmailUsername(prev.firstName, prev.lastName)
                        : "",
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-brand-gray/30 text-brand-red focus:ring-brand-red/30"
                />
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <label
                      htmlFor="createDepartmentEmail"
                      className="text-sm font-semibold text-brand-charcoal"
                    >
                      Create department email for this user
                    </label>
                    <p className="mt-1 text-sm text-brand-gray">
                      This will create a department email account for the member through the
                      secure email server.
                    </p>
                    {!emailConfig?.configured && (
                      <p className="mt-2 text-sm text-amber-800">
                        Department email provisioning is not configured on this server.
                      </p>
                    )}
                  </div>

                  {createForm.createDepartmentEmail && emailConfig?.configured && (
                    <div className="space-y-4 border-t border-brand-gray/10 pt-4">
                      <FormField
                        id="createDepartmentEmailUsername"
                        label="Email username"
                        hint={
                          emailConfig.domain
                            ? `Address will be ${createForm.departmentEmailUsername || "username"}@${emailConfig.domain}`
                            : undefined
                        }
                        required
                      >
                        <Input
                          id="createDepartmentEmailUsername"
                          value={createForm.departmentEmailUsername}
                          onChange={(event) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              departmentEmailUsername: event.target.value.toLowerCase(),
                            }))
                          }
                          autoComplete="off"
                          required
                        />
                      </FormField>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          id="createDepartmentEmailPassword"
                          label="Temporary email password"
                          required
                        >
                          <Input
                            id="createDepartmentEmailPassword"
                            type="password"
                            value={createForm.departmentEmailPassword}
                            onChange={(event) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                departmentEmailPassword: event.target.value,
                              }))
                            }
                            autoComplete="new-password"
                            required
                          />
                        </FormField>
                        <FormField
                          id="createDepartmentEmailPasswordConfirm"
                          label="Confirm password"
                          required
                        >
                          <Input
                            id="createDepartmentEmailPasswordConfirm"
                            type="password"
                            value={createForm.departmentEmailPasswordConfirm}
                            onChange={(event) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                departmentEmailPasswordConfirm: event.target.value,
                              }))
                            }
                            autoComplete="new-password"
                            required
                          />
                        </FormField>
                      </div>
                      <FormField id="createDepartmentEmailQuota" label="Mailbox quota" required>
                        <Select
                          id="createDepartmentEmailQuota"
                          value={createForm.departmentEmailQuota}
                          onChange={(event) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              departmentEmailQuota: Number(
                                event.target.value
                              ) as CreateUserFormState["departmentEmailQuota"],
                            }))
                          }
                        >
                          {(emailConfig?.quotaOptions ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {actionError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {actionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modalMode === "edit" && selectedUser && (
        <Modal
          title="Edit user"
          description={selectedUser.email ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="edit-user-form" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="editFirstName" label="First name" required>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                  required
                />
              </FormField>
              <FormField id="editLastName" label="Last name" required>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                  required
                />
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="editRole" label="Role" required>
                <Select
                  id="editRole"
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: event.target.value as ManagedUserRole,
                    }))
                  }
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField id="editStatus" label="Status" required>
                <Select
                  id="editStatus"
                  value={editForm.active ? "active" : "inactive"}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      active: event.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="editPhone" label="Phone">
                <Input
                  id="editPhone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </FormField>
              <FormField id="editTitle" label="Title / department">
                <Input
                  id="editTitle"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
              </FormField>
            </div>

            <div className="rounded-xl border border-brand-gray/15 bg-brand-charcoal/[0.02] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-brand-charcoal">Department email</h3>
                  <p className="mt-1 text-sm text-brand-gray">
                    Manage the member&apos;s department mailbox on the secure email server.
                  </p>
                </div>
                <StatusBadge
                  label={emailStatusLabel(selectedUser.emailProvisioningStatus)}
                  variant={emailStatusVariant(selectedUser.emailProvisioningStatus)}
                />
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-brand-charcoal">Address:</dt>
                  <dd className="text-brand-gray">
                    {selectedUser.departmentEmail ?? "Not provisioned"}
                  </dd>
                </div>
                {selectedUser.emailProvisioningStatus === "failed" &&
                  selectedUser.emailProvisioningError && (
                    <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-amber-950">
                      {selectedUser.emailProvisioningError}
                    </div>
                  )}
              </dl>

              {emailConfig?.configured && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(selectedUser.emailProvisioningStatus === "none" ||
                    selectedUser.emailProvisioningStatus === "pending") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDepartmentEmailModal(selectedUser)}
                    >
                      Create email
                    </Button>
                  )}
                  {selectedUser.emailProvisioningStatus === "failed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDepartmentEmailModal(selectedUser)}
                    >
                      Retry email creation
                    </Button>
                  )}
                  {selectedUser.emailProvisioningStatus === "provisioned" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openDepartmentEmailResetModal(selectedUser)}
                    >
                      Reset email password
                    </Button>
                  )}
                </div>
              )}
            </div>

            {actionError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {actionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modalMode === "reset" && selectedUser && (
        <Modal
          title="Reset password"
          description={selectedUser.email ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="reset-password-form" disabled={saving}>
                {saving ? "Working…" : "Reset password"}
              </Button>
            </>
          }
        >
          <form id="reset-password-form" onSubmit={handleResetSubmit} className="space-y-4">
            <FormField id="resetMode" label="Reset method">
              <Select
                id="resetMode"
                value={resetForm.mode}
                onChange={(event) =>
                  setResetForm((prev) => ({
                    ...prev,
                    mode: event.target.value as ResetPasswordFormState["mode"],
                  }))
                }
              >
                <option value="reset_link">Generate password setup link</option>
                <option value="temporary">Set temporary password</option>
              </Select>
            </FormField>
            {resetForm.mode === "temporary" && (
              <FormField id="resetTempPassword" label="Temporary password" required>
                <Input
                  id="resetTempPassword"
                  type="password"
                  value={resetForm.temporaryPassword}
                  onChange={(event) =>
                    setResetForm((prev) => ({
                      ...prev,
                      temporaryPassword: event.target.value,
                    }))
                  }
                  minLength={8}
                  required
                />
              </FormField>
            )}
            {actionError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {actionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modalMode === "department-email" && selectedUser && (
        <Modal
          title={
            selectedUser.emailProvisioningStatus === "failed"
              ? "Retry email creation"
              : "Create department email"
          }
          description={selectedUser.displayName ?? selectedUser.email ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="department-email-form" disabled={saving}>
                {saving ? "Working…" : "Create email"}
              </Button>
            </>
          }
        >
          <form
            id="department-email-form"
            onSubmit={handleDepartmentEmailSubmit}
            className="space-y-4"
          >
            <FormField
              id="departmentEmailUsername"
              label="Email username"
              hint={
                emailConfig?.domain
                  ? `Address will be ${departmentEmailForm.emailUsername || "username"}@${emailConfig.domain}`
                  : undefined
              }
              required
            >
              <Input
                id="departmentEmailUsername"
                value={departmentEmailForm.emailUsername}
                onChange={(event) =>
                  setDepartmentEmailForm((prev) => ({
                    ...prev,
                    emailUsername: event.target.value.toLowerCase(),
                  }))
                }
                autoComplete="off"
                required
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="departmentEmailPassword" label="Temporary email password" required>
                <Input
                  id="departmentEmailPassword"
                  type="password"
                  value={departmentEmailForm.password}
                  onChange={(event) =>
                    setDepartmentEmailForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  required
                />
              </FormField>
              <FormField id="departmentEmailConfirmPassword" label="Confirm password" required>
                <Input
                  id="departmentEmailConfirmPassword"
                  type="password"
                  value={departmentEmailForm.confirmPassword}
                  onChange={(event) =>
                    setDepartmentEmailForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  autoComplete="new-password"
                  required
                />
              </FormField>
            </div>
            <FormField id="departmentEmailQuota" label="Mailbox quota" required>
              <Select
                id="departmentEmailQuota"
                value={departmentEmailForm.quotaMb}
                onChange={(event) =>
                  setDepartmentEmailForm((prev) => ({
                    ...prev,
                    quotaMb: Number(event.target.value) as 1024 | 2048 | 5120 | 0,
                  }))
                }
              >
                {(emailConfig?.quotaOptions ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <p className="text-sm text-brand-gray">
              This will create a department email account for the member through the secure
              email server.
            </p>
            {actionError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {actionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modalMode === "department-email-reset" && selectedUser && (
        <Modal
          title="Reset email password"
          description={selectedUser.departmentEmail ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="department-email-reset-form" disabled={saving}>
                {saving ? "Working…" : "Reset email password"}
              </Button>
            </>
          }
        >
          <form
            id="department-email-reset-form"
            onSubmit={handleDepartmentEmailResetSubmit}
            className="space-y-4"
          >
            <FormField id="resetDepartmentEmailPassword" label="New email password" required>
              <Input
                id="resetDepartmentEmailPassword"
                type="password"
                value={departmentEmailForm.password}
                onChange={(event) =>
                  setDepartmentEmailForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                autoComplete="new-password"
                required
              />
            </FormField>
            <FormField id="resetDepartmentEmailConfirmPassword" label="Confirm password" required>
              <Input
                id="resetDepartmentEmailConfirmPassword"
                type="password"
                value={departmentEmailForm.confirmPassword}
                onChange={(event) =>
                  setDepartmentEmailForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                autoComplete="new-password"
                required
              />
            </FormField>
            {actionError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {actionError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {modalMode === "disable" && selectedUser && (
        <Modal
          title="Disable user"
          description={`Disable ${selectedUser.displayName ?? selectedUser.email ?? "this user"}? They will not be able to sign in, but their records will be kept.`}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void handleDisableConfirm()} disabled={saving}>
                {saving ? "Disabling…" : "Disable user"}
              </Button>
            </>
          }
        >
          {actionError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {actionError}
            </p>
          )}
        </Modal>
      )}

      {modalMode === "delete" && selectedUser && (
        <Modal
          title="Permanently delete user"
          description="This removes the authentication account and profile. Prefer disabling users when possible."
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleDeleteConfirm()} disabled={saving}>
                {saving ? "Deleting…" : "Delete permanently"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-brand-gray">
            You are about to permanently delete{" "}
            <strong className="text-brand-charcoal">
              {selectedUser.displayName ?? selectedUser.email}
            </strong>
            . This cannot be undone.
          </p>
          {actionError && (
            <p className="mt-3 text-sm font-medium text-brand-red" role="alert">
              {actionError}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
