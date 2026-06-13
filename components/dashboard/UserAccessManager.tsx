"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmailSetupShareCard } from "@/components/dashboard/EmailSetupShareCard";
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
  fetchDepartmentEmailSuggestion,
  fetchEmailProvisioningConfig,
  resetDepartmentEmailPassword,
  type EmailProvisioningConfig,
} from "@/lib/email-provisioning/client";
import {
  LEADERSHIP_ALIAS_USERNAMES,
  suggestDepartmentEmailUsername,
} from "@/lib/email-provisioning/validation";
import {
  createManagedUser,
  deleteManagedUserPermanently,
  disableManagedUser,
  fetchManagedUsers,
  resetManagedUserPassword,
  retryPendingPortalAuth,
  updateManagedUser,
} from "@/lib/users/client";
import { getDisplayDepartmentEmail } from "@/lib/users/display";
import type {
  AuthProvisioningStatus,
  CreateUserFormState,
  EditUserFormState,
  EmailProvisioningStatus,
  ManagedUserProfile,
  ManagedUserRole,
  ResetPasswordFormState,
  RetryPortalAuthFormState,
} from "@/lib/users/types";

const emptyCreateForm: CreateUserFormState = {
  accountType: "member",
  firstName: "",
  lastName: "",
  aliasUsername: "chief",
  aliasDisplayName: "",
  departmentEmailUsername: "",
  departmentEmailUsernameEdited: false,
  role: "member",
  active: true,
  password: "",
  confirmPassword: "",
  departmentEmailQuota: 1024,
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

const emptyRetryAuthForm: RetryPortalAuthFormState = {
  password: "",
  confirmPassword: "",
};

const emptyEmailResetForm = {
  password: "",
  confirmPassword: "",
};

type ModalMode =
  | "create"
  | "edit"
  | "reset"
  | "retry-auth"
  | "email-reset"
  | "email-setup"
  | "disable"
  | "delete"
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

function emailStatusLabel(status: EmailProvisioningStatus): string {
  if (status === "provisioned") return "Provisioned";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return "Not created";
}

function authStatusLabel(status: AuthProvisioningStatus, user: ManagedUserProfile): string {
  if (user.isDepartmentAlias) return "Email only";
  if (user.isPendingAuth) return "Incomplete";
  if (status === "active") return "Active";
  if (status === "failed") return "Failed";
  if (status === "pending") return "Pending";
  return "Legacy";
}

function emailStatusVariant(status: EmailProvisioningStatus) {
  if (status === "provisioned") return "active" as const;
  if (status === "failed") return "inactive" as const;
  if (status === "pending") return "info" as const;
  return "neutral" as const;
}

function authStatusVariant(status: AuthProvisioningStatus, user: ManagedUserProfile) {
  if (user.isDepartmentAlias) return "neutral" as const;
  if (user.isPendingAuth || status === "failed") return "inactive" as const;
  if (status === "active") return "active" as const;
  return "info" as const;
}

function validateCreateForm(
  form: CreateUserFormState,
  emailConfigured: boolean
): string | null {
  if (!emailConfigured) {
    return "Department email provisioning is not configured on this server.";
  }

  if (form.accountType === "alias") {
    if (!form.aliasDisplayName.trim()) return "Display name is required.";
    if (!form.aliasUsername.trim()) return "Select a department alias address.";
  } else {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.lastName.trim()) return "Last name is required.";
    if (!form.departmentEmailUsername.trim()) return "Department email username is required.";
  }

  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (form.password !== form.confirmPassword) {
    return "Password and confirm password must match.";
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
  const [emailSetupShareEmail, setEmailSetupShareEmail] = useState<string | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailProvisioningConfig | null>(null);
  const [previewEmail, setPreviewEmail] = useState<string | null>(null);
  const [previewAvailable, setPreviewAvailable] = useState<boolean | null>(null);
  const [emailResetForm, setEmailResetForm] = useState(emptyEmailResetForm);
  const [retryAuthForm, setRetryAuthForm] = useState(emptyRetryAuthForm);

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
          mailClientSettings: null,
        });
      });
  }, []);

  useEffect(() => {
    if (modalMode !== "create" || createForm.accountType !== "member") return;
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      setPreviewEmail(null);
      setPreviewAvailable(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetchDepartmentEmailSuggestion({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        username: createForm.departmentEmailUsernameEdited
          ? createForm.departmentEmailUsername
          : undefined,
      })
        .then((result) => {
          setPreviewEmail(result.email);
          setPreviewAvailable(result.available);
          if (!createForm.departmentEmailUsernameEdited && result.username) {
            setCreateForm((prev) => ({
              ...prev,
              departmentEmailUsername: result.username ?? "",
            }));
          }
        })
        .catch(() => {
          const fallback = suggestDepartmentEmailUsername(
            createForm.firstName,
            createForm.lastName
          );
          const domain = emailConfig?.domain;
          setPreviewEmail(domain ? `${fallback}@${domain}` : null);
          setPreviewAvailable(null);
          if (!createForm.departmentEmailUsernameEdited) {
            setCreateForm((prev) => ({ ...prev, departmentEmailUsername: fallback }));
          }
        });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    modalMode,
    createForm.accountType,
    createForm.firstName,
    createForm.lastName,
    createForm.departmentEmailUsername,
    createForm.departmentEmailUsernameEdited,
    emailConfig?.domain,
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
        user.departmentEmail,
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
    setRetryAuthForm(emptyRetryAuthForm);
    setEmailResetForm(emptyEmailResetForm);
    setPreviewEmail(null);
    setPreviewAvailable(null);
    setEmailSetupShareEmail(null);
  }

  function openCreateModal() {
    setSuccessMessage(null);
    setPasswordSetupLink(null);
    setEmailSetupShareEmail(null);
    setActionError(null);
    setCreateForm(emptyCreateForm);
    setModalMode("create");
  }

  function openEmailSetupModal(user: ManagedUserProfile) {
    const email = getDisplayDepartmentEmail(user);
    if (!email || !emailConfig?.mailClientSettings) return;
    setActionError(null);
    setSelectedUser(user);
    setEmailSetupShareEmail(email);
    setModalMode("email-setup");
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

  function openRetryAuthModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setRetryAuthForm(emptyRetryAuthForm);
    setModalMode("retry-auth");
  }

  function openEmailResetModal(user: ManagedUserProfile) {
    setActionError(null);
    setSelectedUser(user);
    setEmailResetForm(emptyEmailResetForm);
    setModalMode("email-reset");
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
      if (result.departmentEmail && emailConfig?.mailClientSettings) {
        setEmailSetupShareEmail(result.departmentEmail);
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
      if (result.passwordSetupLink) setPasswordSetupLink(result.passwordSetupLink);
      closeModal();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetryAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);

    if (retryAuthForm.password.length < 8) {
      setActionError("Password must be at least 8 characters.");
      return;
    }
    if (retryAuthForm.password !== retryAuthForm.confirmPassword) {
      setActionError("Password and confirm password must match.");
      return;
    }

    setSaving(true);
    try {
      const result = await retryPendingPortalAuth(selectedUser.uid, retryAuthForm);
      await loadUsers(true);
      closeModal();
      setSuccessMessage(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to complete portal setup.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    setActionError(null);

    if (emailResetForm.password.length < 8) {
      setActionError("Password must be at least 8 characters.");
      return;
    }
    if (emailResetForm.password !== emailResetForm.confirmPassword) {
      setActionError("Password and confirm password must match.");
      return;
    }

    setSaving(true);
    try {
      const result = await resetDepartmentEmailPassword(selectedUser.uid, emailResetForm);
      closeModal();
      setSuccessMessage(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to reset email password.");
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
            Create portal members with Cove Fire &amp; Rescue department email addresses. Legacy
            personal-email accounts remain supported.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Create user
        </Button>
      </div>

      {successMessage && <AlertBanner variant="success">{successMessage}</AlertBanner>}

      {emailSetupShareEmail && emailConfig?.mailClientSettings && !modalMode && (
        <EmailSetupShareCard
          emailAddress={emailSetupShareEmail}
          mailSettings={emailConfig.mailClientSettings}
          onDismiss={() => setEmailSetupShareEmail(null)}
        />
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
              placeholder="Name, department email, title…"
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
              ? "Create the first member account with the button above."
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
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">
                        Department email
                      </th>
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
                          {user.isDepartmentAlias && (
                            <div className="text-xs text-brand-gray">Department alias</div>
                          )}
                          {user.isPendingAuth && (
                            <div className="text-xs text-amber-700">Portal setup incomplete</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {getDisplayDepartmentEmail(user) || "—"}
                        </td>
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
                            {!user.isDepartmentAlias && (
                              <button
                                type="button"
                                onClick={() => openEditModal(user)}
                                className="text-xs font-semibold text-brand-red hover:underline"
                              >
                                Edit
                              </button>
                            )}
                            {!user.isDepartmentAlias && !user.isPendingAuth && (
                              <button
                                type="button"
                                onClick={() => openResetModal(user)}
                                className="text-xs font-semibold text-brand-blue hover:underline"
                              >
                                Reset portal password
                              </button>
                            )}
                            {user.isPendingAuth && (
                              <button
                                type="button"
                                onClick={() => openRetryAuthModal(user)}
                                className="text-xs font-semibold text-brand-red hover:underline"
                              >
                                Retry portal setup
                              </button>
                            )}
                            {user.emailProvisioningStatus === "provisioned" &&
                              getDisplayDepartmentEmail(user) &&
                              emailConfig?.mailClientSettings && (
                                <button
                                  type="button"
                                  onClick={() => openEmailSetupModal(user)}
                                  className="text-xs font-semibold text-brand-red hover:underline"
                                >
                                  Email setup QR
                                </button>
                              )}
                            {user.emailProvisioningStatus === "provisioned" &&
                              getDisplayDepartmentEmail(user) && (
                                <button
                                  type="button"
                                  onClick={() => openEmailResetModal(user)}
                                  className="text-xs font-semibold text-brand-blue hover:underline"
                                >
                                  Reset email password
                                </button>
                              )}
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
                    <p className="mt-1 text-sm text-brand-gray">
                      {getDisplayDepartmentEmail(user) || "No department email"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={roleLabel(user.role)} variant={roleBadgeVariant(user.role)} />
                    <StatusBadge
                      label={user.active ? "Active" : "Inactive"}
                      variant={user.active ? "active" : "inactive"}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!user.isDepartmentAlias && (
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(user)}>
                      Edit
                    </Button>
                  )}
                  {user.isPendingAuth && (
                    <Button type="button" variant="outline" size="sm" onClick={() => openRetryAuthModal(user)}>
                      Retry setup
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
          description="A department email and portal account will be created automatically."
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
            <FormField id="createAccountType" label="Account type">
              <Select
                id="createAccountType"
                value={createForm.accountType}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    accountType: event.target.value as CreateUserFormState["accountType"],
                  }))
                }
              >
                <option value="member">Member portal account</option>
                <option value="alias">Department alias email</option>
              </Select>
            </FormField>

            {createForm.accountType === "member" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="createFirstName" label="First name" required>
                    <Input
                      id="createFirstName"
                      value={createForm.firstName}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          firstName: event.target.value,
                          departmentEmailUsernameEdited: false,
                        }))
                      }
                      required
                    />
                  </FormField>
                  <FormField id="createLastName" label="Last name" required>
                    <Input
                      id="createLastName"
                      value={createForm.lastName}
                      onChange={(event) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          lastName: event.target.value,
                          departmentEmailUsernameEdited: false,
                        }))
                      }
                      required
                    />
                  </FormField>
                </div>

                <div className="rounded-xl border border-brand-gray/15 bg-brand-charcoal/[0.02] p-4 sm:p-5">
                  <FormField id="createDepartmentEmailUsername" label="Department email" required>
                    <div className="flex items-center gap-1">
                      <Input
                        id="createDepartmentEmailUsername"
                        value={createForm.departmentEmailUsername}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            departmentEmailUsername: event.target.value.toLowerCase(),
                            departmentEmailUsernameEdited: true,
                          }))
                        }
                        autoComplete="off"
                        required
                        className="rounded-r-none"
                      />
                      <span className="rounded-r-lg border border-l-0 border-brand-gray/20 bg-gray-50 px-3 py-2 text-sm text-brand-gray">
                        @{emailConfig?.domain ?? "domain"}
                      </span>
                    </div>
                  </FormField>
                  {previewEmail && (
                    <p className="mt-2 text-sm text-brand-gray">
                      Login email: <span className="font-medium text-brand-charcoal">{previewEmail}</span>
                    </p>
                  )}
                  {previewAvailable === false && (
                    <p className="mt-2 text-sm text-amber-800">
                      This address appears to be in use. The server will try the next available
                      variation when you create the account.
                    </p>
                  )}
                  <p className="mt-2 text-sm text-brand-gray">
                    This will create a department email account through the secure email server.
                  </p>
                </div>

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
              </>
            ) : (
              <>
                <FormField id="createAliasUsername" label="Alias address" required>
                  <Select
                    id="createAliasUsername"
                    value={createForm.aliasUsername}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, aliasUsername: event.target.value }))
                    }
                  >
                    {LEADERSHIP_ALIAS_USERNAMES.map((alias) => (
                      <option key={alias} value={alias}>
                        {alias}@{emailConfig?.domain ?? "domain"}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField id="createAliasDisplayName" label="Display name" required>
                  <Input
                    id="createAliasDisplayName"
                    value={createForm.aliasDisplayName}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, aliasDisplayName: event.target.value }))
                    }
                    placeholder="Fire Chief"
                    required
                  />
                </FormField>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="createPassword" label="Temporary password" required>
                <Input
                  id="createPassword"
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
              </FormField>
              <FormField id="createConfirmPassword" label="Confirm password" required>
                <Input
                  id="createConfirmPassword"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
              </FormField>
            </div>

            <FormField id="createQuota" label="Mailbox quota" required>
              <Select
                id="createQuota"
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

            {!emailConfig?.configured && (
              <AlertBanner variant="warning">
                Department email provisioning is not configured on this server.
              </AlertBanner>
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
          description={getDisplayDepartmentEmail(selectedUser) ?? undefined}
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
            <div className="rounded-xl border border-brand-gray/15 bg-brand-charcoal/[0.02] p-4 sm:p-5">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-brand-charcoal">Department email</dt>
                  <dd className="mt-1 text-brand-gray">
                    {getDisplayDepartmentEmail(selectedUser) ?? "Not provisioned"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-charcoal">Email provisioning</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={emailStatusLabel(selectedUser.emailProvisioningStatus)}
                      variant={emailStatusVariant(selectedUser.emailProvisioningStatus)}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-brand-charcoal">Authentication</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={authStatusLabel(selectedUser.authProvisioningStatus, selectedUser)}
                      variant={authStatusVariant(
                        selectedUser.authProvisioningStatus,
                        selectedUser
                      )}
                    />
                  </dd>
                </div>
              </dl>
              {selectedUser.authProvisioningError && (
                <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  {selectedUser.authProvisioningError}
                </p>
              )}
              {selectedUser.emailProvisioningStatus === "provisioned" &&
                getDisplayDepartmentEmail(selectedUser) &&
                emailConfig?.mailClientSettings && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEmailSetupModal(selectedUser)}
                    >
                      Share email setup QR
                    </Button>
                  </div>
                )}
            </div>

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
          title="Reset portal password"
          description={getDisplayDepartmentEmail(selectedUser) ?? undefined}
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

      {modalMode === "retry-auth" && selectedUser && (
        <Modal
          title="Retry portal setup"
          description={getDisplayDepartmentEmail(selectedUser) ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="retry-auth-form" disabled={saving}>
                {saving ? "Working…" : "Complete portal setup"}
              </Button>
            </>
          }
        >
          <form id="retry-auth-form" onSubmit={handleRetryAuthSubmit} className="space-y-4">
            <p className="text-sm text-brand-gray">
              The department mailbox already exists. Set a portal password to finish creating the
              login account.
            </p>
            <FormField id="retryPassword" label="Portal password" required>
              <Input
                id="retryPassword"
                type="password"
                value={retryAuthForm.password}
                onChange={(event) =>
                  setRetryAuthForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </FormField>
            <FormField id="retryConfirmPassword" label="Confirm password" required>
              <Input
                id="retryConfirmPassword"
                type="password"
                value={retryAuthForm.confirmPassword}
                onChange={(event) =>
                  setRetryAuthForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
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

      {modalMode === "email-reset" && selectedUser && (
        <Modal
          title="Reset email password"
          description={getDisplayDepartmentEmail(selectedUser) ?? undefined}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="email-reset-form" disabled={saving}>
                {saving ? "Working…" : "Reset email password"}
              </Button>
            </>
          }
        >
          <form id="email-reset-form" onSubmit={handleEmailResetSubmit} className="space-y-4">
            <FormField id="emailResetPassword" label="New email password" required>
              <Input
                id="emailResetPassword"
                type="password"
                value={emailResetForm.password}
                onChange={(event) =>
                  setEmailResetForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </FormField>
            <FormField id="emailResetConfirmPassword" label="Confirm password" required>
              <Input
                id="emailResetConfirmPassword"
                type="password"
                value={emailResetForm.confirmPassword}
                onChange={(event) =>
                  setEmailResetForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
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

      {modalMode === "email-setup" &&
        selectedUser &&
        emailSetupShareEmail &&
        emailConfig?.mailClientSettings && (
          <Modal
            title="Email setup QR code"
            description="Share these secure mail settings with the member."
            onClose={closeModal}
            footer={
              <Button type="button" variant="ghost" onClick={closeModal}>
                Close
              </Button>
            }
          >
            <EmailSetupShareCard
              emailAddress={emailSetupShareEmail}
              mailSettings={emailConfig.mailClientSettings}
              compact
            />
          </Modal>
        )}

      {modalMode === "disable" && selectedUser && (
        <Modal
          title="Disable user"
          description={`Disable ${selectedUser.displayName ?? getDisplayDepartmentEmail(selectedUser) ?? "this user"}? They will not be able to sign in, but their records will be kept.`}
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
          description="This removes the authentication account and profile when applicable. Prefer disabling users when possible."
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
              {selectedUser.displayName ?? getDisplayDepartmentEmail(selectedUser)}
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
