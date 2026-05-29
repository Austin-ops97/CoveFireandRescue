"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { fetchManagedUsers, saveManagedUser } from "@/lib/users/client";
import type { ManagedUserFormState, ManagedUserProfile } from "@/lib/users/types";

const emptyForm: ManagedUserFormState = {
  uid: "",
  email: "",
  displayName: "",
  role: "member",
  active: true,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }
  return "—";
}

function RoleBadge({ role }: { role: ManagedUserProfile["role"] }) {
  return (
    <Badge
      label={role === "admin" ? "Admin" : "Member"}
      className={
        role === "admin"
          ? "bg-brand-red/15 text-brand-red"
          : "bg-brand-gray-light text-brand-charcoal"
      }
    />
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      label={active ? "Active" : "Inactive"}
      className={
        active ? "bg-green-100 text-green-800" : "bg-brand-gray-light text-brand-charcoal"
      }
    />
  );
}

function validateForm(form: ManagedUserFormState): string | null {
  if (!form.uid.trim()) {
    return "Firebase Auth UID is required.";
  }

  if (form.role !== "admin" && form.role !== "member") {
    return "Role must be admin or member.";
  }

  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address or leave email blank.";
  }

  return null;
}

function profileToForm(profile: ManagedUserProfile): ManagedUserFormState {
  return {
    uid: profile.uid,
    email: profile.email ?? "",
    displayName: profile.displayName ?? "",
    role: profile.role,
    active: profile.active,
  };
}

export function UserAccessManager() {
  const [users, setUsers] = useState<ManagedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ManagedUserFormState>(emptyForm);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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

  function resetForm() {
    setForm(emptyForm);
    setEditingUid(null);
    setSaveError(null);
  }

  function handleEdit(user: ManagedUserProfile) {
    setForm(profileToForm(user));
    setEditingUid(user.uid);
    setSaveError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    const validationError = validateForm(form);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    try {
      const saved = await saveManagedUser(form);
      await loadUsers(true);
      resetForm();
      setSuccessMessage(
        editingUid
          ? `Updated access for ${saved.displayName || saved.uid}.`
          : `Authorized ${saved.displayName || saved.uid} for dashboard access.`
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save user profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-l-4 border-l-brand-red">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-charcoal">
          Authorization notice
        </h2>
        <p className="mt-2 text-sm text-brand-gray">
          Create the Firebase Auth account in Firebase Console first, then paste the UID here to
          authorize dashboard access. This form only creates or updates the Firestore{" "}
          <code className="text-xs">users/&#123;uid&#125;</code> profile — it does not create
          Firebase Auth accounts.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-brand-charcoal">First Admin / New Member Setup</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-brand-gray">
          <li>Create the person in Firebase Authentication.</li>
          <li>Copy their Firebase UID.</li>
          <li>Add the UID here with role <strong className="text-brand-charcoal">admin</strong> or{" "}
            <strong className="text-brand-charcoal">member</strong>.</li>
          <li>Set <strong className="text-brand-charcoal">Active</strong> to true.</li>
          <li>Have them log in at <code className="text-xs">/login</code>.</li>
        </ol>
        <ul className="mt-4 space-y-2 border-t border-brand-gray/15 pt-4 text-sm text-brand-gray">
          <li>
            Use <strong className="text-brand-charcoal">admin</strong> only for people who should
            manage website content and users.
          </li>
          <li>
            Use <strong className="text-brand-charcoal">member</strong> for firefighters who only
            need dashboard and rounds access.
          </li>
          <li>
            Set <strong className="text-brand-charcoal">active</strong> to false instead of
            deleting users when access should be disabled.
          </li>
        </ul>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">Authorized personnel</h2>
          <p className="mt-1 text-sm text-brand-gray">
            {loading ? "Loading…" : `${users.length} user profile${users.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || refreshing}
          onClick={() => void loadUsers(true)}
        >
          {refreshing ? "Refreshing…" : "Refresh Users"}
        </Button>
      </div>

      {successMessage && (
        <Card className="border-l-4 border-l-green-600 bg-green-50/50">
          <p className="text-sm font-medium text-green-900">{successMessage}</p>
        </Card>
      )}

      {loadError && (
        <Card className="border-l-4 border-l-brand-red bg-red-50/40">
          <p className="text-sm font-medium text-brand-charcoal">Could not load users</p>
          <p className="mt-1 text-sm text-brand-gray">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void loadUsers(true)}
          >
            Try again
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold text-brand-charcoal">
          {editingUid ? "Edit authorized user" : "Add authorized user"}
        </h2>
        <p className="mt-1 text-sm text-brand-gray">
          {editingUid
            ? "Update role, contact details, or active status for this UID."
            : "Paste the Firebase Auth UID after the account exists in Firebase Console."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="uid" className="block text-sm font-semibold text-brand-charcoal">
              Firebase Auth UID <span className="text-brand-red">*</span>
            </label>
            <input
              id="uid"
              name="uid"
              type="text"
              required
              readOnly={Boolean(editingUid)}
              value={form.uid}
              onChange={(event) => setForm((prev) => ({ ...prev, uid: event.target.value }))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-brand-gray-light/50"
              placeholder="Paste UID from Firebase Console"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brand-charcoal">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="optional@example.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-semibold text-brand-charcoal"
              >
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={form.displayName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Optional"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-brand-charcoal">
                Role <span className="text-brand-red">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value as ManagedUserFormState["role"],
                  }))
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, active: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                Active (can access dashboard when signed in)
              </label>
            </div>
          </div>

          {saveError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingUid ? "Save changes" : "Add authorized user"}
            </Button>
            {(editingUid || form.uid || form.email || form.displayName) && (
              <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {loading && !loadError && (
        <Card>
          <p className="text-sm text-brand-gray">Loading authorized users…</p>
        </Card>
      )}

      {!loading && !loadError && users.length === 0 && (
        <Card>
          <h3 className="font-bold text-brand-charcoal">No user profiles yet</h3>
          <p className="mt-2 text-sm text-brand-gray">
            After creating a Firebase Auth account, add their UID using the form above.
          </p>
        </Card>
      )}

      {!loading && !loadError && users.length > 0 && (
        <>
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-gray/20 text-left text-sm">
                  <thead className="bg-brand-charcoal/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Name</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Email</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">UID</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Role</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Status</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Last updated</th>
                      <th className="px-4 py-3 font-semibold text-brand-charcoal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gray/15">
                    {users.map((user) => (
                      <tr key={user.uid} className="hover:bg-brand-charcoal/[0.02]">
                        <td className="px-4 py-3 font-medium text-brand-charcoal">
                          {user.displayName || "—"}
                        </td>
                        <td className="px-4 py-3 text-brand-gray">{user.email || "—"}</td>
                        <td className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-brand-gray">
                          {user.uid}
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge active={user.active} />
                        </td>
                        <td className="px-4 py-3 text-brand-gray">
                          {formatTimestamp(user.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            className="text-xs font-semibold text-brand-red hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-4 md:hidden">
            {users.map((user) => (
              <Card key={user.uid}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-brand-charcoal">
                      {user.displayName || "Unnamed user"}
                    </h3>
                    <p className="mt-1 text-sm text-brand-gray">{user.email || "No email"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RoleBadge role={user.role} />
                    <StatusBadge active={user.active} />
                  </div>
                </div>
                <p className="mt-3 break-all font-mono text-xs text-brand-gray">{user.uid}</p>
                <p className="mt-2 text-xs text-brand-gray">
                  Updated {formatTimestamp(user.updatedAt)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
