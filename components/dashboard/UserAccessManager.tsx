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
import type {
  CreateUserFormState,
  EditUserFormState,
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

type ModalMode = "create" | "edit" | "reset" | "disable" | "delete" | null;

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

function validateCreateForm(form: CreateUserFormState): string | null {
  if (!form.firstName.trim()) return "First name is required.";
  if (!form.lastName.trim()) return "Last name is required.";
  if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) {
    return "A valid email address is required.";
  }
  if (form.passwordMode === "temporary" && form.temporaryPassword.length < 8) {
    return "Temporary password must be at least 8 characters.";
  }
  return null;
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
  const [passwordSetupLink, setPasswordSetupLink] = useState<string | null>(null);

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
  }

  function openCreateModal() {
    setSuccessMessage(null);
    setPasswordSetupLink(null);
    setActionError(null);
    setCreateForm(emptyCreateForm);
    setModalMode("create");
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

    const validationError = validateCreateForm(createForm);
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
