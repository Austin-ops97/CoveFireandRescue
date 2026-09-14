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
  SkeletonCardList,
  StatusBadge,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { canManageRoster } from "@/lib/auth/roles";
import {
  deleteRosterMember,
  fetchRosterMembers,
  saveRosterMember,
} from "@/lib/roster/client";
import { buildRosterCsv } from "@/lib/roster/export";
import {
  ROSTER_ACTIVITY_STATUSES,
  ROSTER_ACTIVITY_STATUS_LABELS,
  ROSTER_RANK_OPTIONS,
  formatRosterMemberName,
  getRosterActivityStatusLabel,
  type RosterActivityStatus,
  type RosterMemberFormState,
  type RosterMemberRecord,
} from "@/lib/roster/types";

type SortKey = "unit" | "name";

const emptyForm: RosterMemberFormState = {
  unitNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  rank: "Firefighter",
  activityStatus: "active",
};

function recordToForm(record: RosterMemberRecord): RosterMemberFormState {
  return {
    id: record.id,
    unitNumber: String(record.unitNumber),
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone,
    email: record.email,
    rank: record.rank,
    activityStatus: record.activityStatus,
  };
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RosterManager() {
  const { role } = useAuth();
  const canEdit = canManageRoster(role);

  const [members, setMembers] = useState<RosterMemberRecord[]>([]);
  const [form, setForm] = useState<RosterMemberFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | RosterActivityStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("unit");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RosterMemberRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await fetchRosterMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const ranks = useMemo(() => {
    const set = new Set<string>();
    for (const member of members) {
      if (member.rank.trim()) set.add(member.rank.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = members.filter((member) => {
      if (statusFilter !== "all" && member.activityStatus !== statusFilter) return false;
      if (rankFilter !== "all" && member.rank !== rankFilter) return false;
      if (!query) return true;
      return [
        String(member.unitNumber),
        member.firstName,
        member.lastName,
        member.phone,
        member.email,
        member.rank,
        getRosterActivityStatusLabel(member.activityStatus),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return [...list].sort((a, b) => {
      if (sortKey === "name") {
        const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
        if (last !== 0) return last;
        return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
      }
      if (a.unitNumber !== b.unitNumber) return a.unitNumber - b.unitNumber;
      return a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
    });
  }, [members, search, rankFilter, statusFilter, sortKey]);

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
  }

  function startCreate() {
    setForm(emptyForm);
    setShowForm(true);
    setMessage(null);
    setError(null);
  }

  function startEdit(record: RosterMemberRecord) {
    setForm(recordToForm(record));
    setShowForm(true);
    setMessage(null);
    setError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveRosterMember(form);
      setMessage(form.id ? "Roster member updated." : "Roster member added.");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save roster member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget || !canEdit) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteRosterMember(deleteTarget.id);
      setMessage(
        `Removed ${deleteTarget.unitNumber} ${formatRosterMemberName(deleteTarget)} from the roster.`
      );
      if (form.id === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete roster member.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    const csv = buildRosterCsv(filtered);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `cove-fire-roster-${stamp}.csv`);
    setMessage(`Exported ${filtered.length} roster ${filtered.length === 1 ? "row" : "rows"}.`);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) return <SkeletonCardList count={4} />;

  if (error && members.length === 0) {
    return (
      <AlertBanner variant="error" title="Could not load roster">
        {error}
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-6">
        <Card variant="accent">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-charcoal">Department Roster</h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-gray">
                Centralized member roster for officers. Print and export use a clean layout without
                dashboard controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                Print Roster
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleExport}>
                Export CSV
              </Button>
              {canEdit ? (
                <Button type="button" variant="primary" size="sm" onClick={startCreate}>
                  Add Member
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        {message ? (
          <AlertBanner variant="success" title="Roster updated">
            {message}
          </AlertBanner>
        ) : null}
        {error ? (
          <AlertBanner variant="error" title="Error">
            {error}
          </AlertBanner>
        ) : null}

        {showForm && canEdit ? (
          <Card>
            <h3 className="text-lg font-bold text-brand-charcoal">
              {form.id ? "Edit Roster Member" : "Add Roster Member"}
            </h3>
            <form onSubmit={(event) => void handleSave(event)} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="roster-unit" label="Unit number" required>
                  <Input
                    id="roster-unit"
                    inputMode="numeric"
                    value={form.unitNumber}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, unitNumber: event.target.value }))
                    }
                    placeholder="8901–8999"
                    required
                  />
                </FormField>
                <FormField id="roster-rank" label="Rank" required>
                  <Input
                    id="roster-rank"
                    list="roster-rank-options"
                    value={form.rank}
                    onChange={(event) => setForm((prev) => ({ ...prev, rank: event.target.value }))}
                    required
                  />
                  <datalist id="roster-rank-options">
                    {ROSTER_RANK_OPTIONS.map((rank) => (
                      <option key={rank} value={rank} />
                    ))}
                  </datalist>
                </FormField>
                <FormField id="roster-first" label="First name" required>
                  <Input
                    id="roster-first"
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, firstName: event.target.value }))
                    }
                    required
                  />
                </FormField>
                <FormField id="roster-last" label="Last name" required>
                  <Input
                    id="roster-last"
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                    required
                  />
                </FormField>
                <FormField id="roster-phone" label="Phone number" required>
                  <Input
                    id="roster-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    required
                  />
                </FormField>
                <FormField id="roster-email" label="Email" required>
                  <Input
                    id="roster-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                </FormField>
                <FormField id="roster-status" label="Activity status" required>
                  <Select
                    id="roster-status"
                    value={form.activityStatus}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        activityStatus: event.target.value as RosterActivityStatus,
                      }))
                    }
                  >
                    {ROSTER_ACTIVITY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {ROSTER_ACTIVITY_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving…" : form.id ? "Save Changes" : "Add Member"}
                </Button>
                <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <ListToolbar
          title="Roster members"
          countLabel={`${filtered.length} shown · ${members.length} total`}
          onRefresh={() => void load()}
          refreshing={loading}
        />

        <Card padding="md">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField id="roster-search" label="Search">
              <Input
                id="roster-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, unit, phone, email…"
              />
            </FormField>
            <FormField id="roster-filter-rank" label="Filter by rank">
              <Select
                id="roster-filter-rank"
                value={rankFilter}
                onChange={(event) => setRankFilter(event.target.value)}
              >
                <option value="all">All ranks</option>
                {ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="roster-filter-status" label="Filter by activity">
              <Select
                id="roster-filter-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | RosterActivityStatus)
                }
              >
                <option value="all">All statuses</option>
                {ROSTER_ACTIVITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROSTER_ACTIVITY_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="roster-sort" label="Sort by">
              <Select
                id="roster-sort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                <option value="unit">Unit number</option>
                <option value="name">Name</option>
              </Select>
            </FormField>
          </div>
        </Card>
      </div>

      <div className="roster-print-root">
        <div className="mb-4 hidden print:block">
          <h1 className="text-xl font-bold text-brand-charcoal">Cove Fire &amp; Rescue — Roster</h1>
          <p className="text-sm text-brand-gray">
            Printed {new Date().toLocaleDateString()} · {filtered.length} members
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="print:hidden">
            <EmptyState
              title={members.length === 0 ? "No roster members yet" : "No matching members"}
              description={
                members.length === 0
                  ? canEdit
                    ? "Add the first member to begin replacing the monthly Excel roster."
                    : "An officer has not added roster members yet."
                  : "Try a different search or filter."
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block print:block print:rounded-none print:border-0 print:shadow-none">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Unit Number</th>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Name</th>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Phone #</th>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Email</th>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Rank</th>
                    <th className="px-4 py-3 font-semibold text-brand-charcoal">Activity Status</th>
                    {canEdit ? (
                      <th className="px-4 py-3 font-semibold text-brand-charcoal print:hidden">
                        Actions
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 font-mono text-brand-charcoal">{member.unitNumber}</td>
                      <td className="px-4 py-3 text-brand-charcoal">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-4 py-3 text-brand-gray">{member.phone}</td>
                      <td className="px-4 py-3 text-brand-gray">{member.email}</td>
                      <td className="px-4 py-3 text-brand-charcoal">{member.rank}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={getRosterActivityStatusLabel(member.activityStatus)}
                          variant={member.activityStatus === "active" ? "active" : "inactive"}
                        />
                      </td>
                      {canEdit ? (
                        <td className="px-4 py-3 print:hidden">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(member)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget(member)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden print:hidden">
              {filtered.map((member) => (
                <Card key={member.id} padding="md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-brand-blue">
                        {member.unitNumber}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-brand-charcoal">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-brand-gray">{member.rank}</p>
                    </div>
                    <StatusBadge
                      label={getRosterActivityStatusLabel(member.activityStatus)}
                      variant={member.activityStatus === "active" ? "active" : "inactive"}
                    />
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div>
                      <dt className="inline text-brand-gray">Phone: </dt>
                      <dd className="inline text-brand-charcoal">{member.phone}</dd>
                    </div>
                    <div>
                      <dt className="inline text-brand-gray">Email: </dt>
                      <dd className="inline break-all text-brand-charcoal">{member.email}</dd>
                    </div>
                  </dl>
                  {canEdit ? (
                    <div className="mt-4 flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(member)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(member)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {deleteTarget ? (
        <Modal
          title="Delete roster member?"
          description={`Remove ${deleteTarget.unitNumber} ${formatRosterMemberName(deleteTarget)} from the roster? This cannot be undone.`}
          onClose={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          size="md"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleting}
                onClick={() => void handleDeleteConfirmed()}
              >
                {deleting ? "Deleting…" : "Delete Member"}
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}
