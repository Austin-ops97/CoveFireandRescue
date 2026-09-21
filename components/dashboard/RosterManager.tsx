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
import { buildRosterCsv, ROSTER_EXPORT_HEADERS, rosterExportRows } from "@/lib/roster/export";
import { queryRosterMembers, rosterDisplayName } from "@/lib/roster/query";
import { createRosterMember, deleteRosterMember, fetchRosterMembers, updateRosterMember } from "@/lib/roster/client";
import {
  ROSTER_ACTIVITY_LABELS,
  ROSTER_ACTIVITY_STATUSES,
  ROSTER_RANK_SUGGESTIONS,
  ROSTER_UNIT_MAX,
  ROSTER_UNIT_MIN,
  type RosterActivityStatus,
  type RosterListQuery,
  type RosterMemberRecord,
  type RosterSortDirection,
  type RosterSortField,
} from "@/lib/roster/types";
import { RosterValidationError, validateRosterMemberPayload } from "@/lib/roster/validation";

type FormState = {
  unitNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  rank: string;
  activityStatus: RosterActivityStatus;
};

const EMPTY_FORM: FormState = {
  unitNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  rank: "",
  activityStatus: "active",
};

function memberToForm(member: RosterMemberRecord): FormState {
  return {
    unitNumber: String(member.unitNumber),
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    email: member.email,
    rank: member.rank,
    activityStatus: member.activityStatus,
  };
}

function downloadRosterCsv(members: RosterMemberRecord[]) {
  const csv = buildRosterCsv(members);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cove-fire-rescue-roster.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function RosterManager() {
  const { role } = useAuth();
  const canEdit = canManageRoster(role);

  const [members, setMembers] = useState<RosterMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("all");
  const [activityStatus, setActivityStatus] = useState<RosterListQuery["activityStatus"]>("all");
  const [sort, setSort] = useState<RosterSortField>("unit");
  const [direction, setDirection] = useState<RosterSortDirection>("asc");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RosterMemberRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await fetchRosterMembers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the roster.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rankOptions = useMemo(() => {
    const values = new Set<string>(ROSTER_RANK_SUGGESTIONS);
    for (const member of members) {
      if (member.rank.trim()) values.add(member.rank);
    }
    return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [members]);

  const visibleMembers = useMemo(
    () =>
      queryRosterMembers(members, {
        search,
        rank,
        activityStatus,
        sort,
        direction,
      }),
    [activityStatus, direction, members, rank, search, sort]
  );

  const printedOn = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(member: RosterMemberRecord) {
    setEditingId(member.id);
    setForm(memberToForm(member));
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || saving) return;

    setFormError(null);
    let validated;
    try {
      validated = validateRosterMemberPayload({
        ...form,
        unitNumber: form.unitNumber.trim(),
      });
    } catch (err) {
      setFormError(err instanceof RosterValidationError ? err.message : "Check the roster fields.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = editingId
        ? await updateRosterMember(editingId, validated)
        : await createRosterMember(validated);
      setMembers((current) => {
        const without = current.filter((member) => member.id !== editingId && member.id !== saved.id);
        return [...without, saved];
      });
      setFormOpen(false);
      setMessage(
        editingId
          ? `${rosterDisplayName(saved)} was updated.`
          : `${rosterDisplayName(saved)} was added to the roster.`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save this roster member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!pendingDelete || !canEdit) return;
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deleteRosterMember(pendingDelete.id);
      setMembers((current) => current.filter((member) => member.id !== pendingDelete.id));
      setMessage(`${rosterDisplayName(pendingDelete)} was removed from the roster.`);
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this roster member.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <SkeletonCardList count={4} />;

  if (error && members.length === 0) {
    return (
      <AlertBanner variant="error" title="Could not load the roster">
        {error}
      </AlertBanner>
    );
  }

  const printRows = rosterExportRows(visibleMembers);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          header, nav, footer, .no-print { display: none !important; }
          body * { visibility: hidden; }
          #roster-print-root, #roster-print-root * { visibility: visible; }
          #roster-print-root {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        {message && (
          <AlertBanner variant="success" title="Roster updated">
            {message}
          </AlertBanner>
        )}
        {error && (
          <AlertBanner variant="error" title="Roster error">
            {error}
          </AlertBanner>
        )}

        <ListToolbar
          title="Department roster"
          countLabel={`${visibleMembers.length} shown of ${members.length}`}
          onRefresh={() => void load()}
          refreshing={loading}
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                Print Roster
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadRosterCsv(visibleMembers)}
                disabled={visibleMembers.length === 0}
              >
                Export Excel / CSV
              </Button>
              {canEdit ? (
                <Button type="button" variant="primary" size="sm" onClick={openCreate}>
                  Add Member
                </Button>
              ) : null}
            </>
          }
        />

        <Card padding="md">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField id="roster-search" label="Search" hint="Name, unit, phone, email, or rank">
              <Input
                id="roster-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roster"
              />
            </FormField>
            <FormField id="roster-rank-filter" label="Rank">
              <Select id="roster-rank-filter" value={rank} onChange={(event) => setRank(event.target.value)}>
                <option value="all">All ranks</option>
                {rankOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="roster-status-filter" label="Activity status">
              <Select
                id="roster-status-filter"
                value={activityStatus}
                onChange={(event) =>
                  setActivityStatus(event.target.value as RosterListQuery["activityStatus"])
                }
              >
                <option value="all">All statuses</option>
                {ROSTER_ACTIVITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROSTER_ACTIVITY_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="roster-sort" label="Sort">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  id="roster-sort"
                  aria-label="Sort roster by"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as RosterSortField)}
                >
                  <option value="unit">Unit number</option>
                  <option value="name">Name</option>
                </Select>
                <Select
                  id="roster-sort-direction"
                  aria-label="Sort direction"
                  value={direction}
                  onChange={(event) => setDirection(event.target.value as RosterSortDirection)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Select>
              </div>
            </FormField>
          </div>
        </Card>

        {visibleMembers.length === 0 ? (
          <EmptyState
            title={members.length === 0 ? "No roster members yet" : "No matching members"}
            description={
              members.length === 0
                ? "Add the first member to replace the monthly Excel roster."
                : "Try a different search or filter."
            }
            actionLabel={canEdit && members.length === 0 ? "Add Member" : undefined}
            onAction={canEdit && members.length === 0 ? openCreate : undefined}
          />
        ) : (
          <div className="space-y-3 md:hidden">
            {visibleMembers.map((member) => (
              <Card key={member.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-brand-blue">{member.unitNumber}</p>
                    <h3 className="mt-1 text-lg font-bold text-brand-charcoal">
                      {rosterDisplayName(member)}
                    </h3>
                    <p className="mt-1 text-sm text-brand-gray">{member.rank}</p>
                  </div>
                  <StatusBadge
                    label={ROSTER_ACTIVITY_LABELS[member.activityStatus]}
                    variant={member.activityStatus === "active" ? "active" : "inactive"}
                  />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Phone #</dt>
                    <dd className="mt-0.5 font-medium text-brand-charcoal">{member.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Email</dt>
                    <dd className="mt-0.5 break-all font-medium text-brand-charcoal">{member.email}</dd>
                  </div>
                </dl>
                {canEdit ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(member)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => setPendingDelete(member)}>
                      Delete
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div id="roster-print-root" className={visibleMembers.length === 0 ? "hidden" : "hidden md:block"}>
        <div className="mb-4 hidden print:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">Cove Fire &amp; Rescue</p>
          <h2 className="text-2xl font-bold text-brand-charcoal">Department Roster</h2>
          <p className="mt-1 text-sm text-brand-gray">Printed {printedOn}</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-brand-gray print:bg-white">
              <tr>
                {ROSTER_EXPORT_HEADERS.map((header) => (
                  <th key={header} scope="col" className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
                {canEdit ? (
                  <th scope="col" className="no-print px-4 py-3 font-semibold">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {printRows.map((row, index) => {
                const member = visibleMembers[index];
                return (
                  <tr key={member.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-charcoal">{row.unitNumber}</td>
                    <td className="px-4 py-3 font-medium text-brand-charcoal">{row.name}</td>
                    <td className="px-4 py-3 text-brand-charcoal">{row.phone}</td>
                    <td className="px-4 py-3 text-brand-charcoal">{row.email}</td>
                    <td className="px-4 py-3 text-brand-charcoal">{row.rank}</td>
                    <td className="px-4 py-3 text-brand-charcoal">{row.activityStatus}</td>
                    {canEdit ? (
                      <td className="no-print px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(member)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingDelete(member)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen ? (
        <Modal
          title={editingId ? "Edit roster member" : "Add roster member"}
          description="Unit numbers for Cove Fire & Rescue run from 8901 to 8999."
          onClose={() => {
            if (!saving) setFormOpen(false);
          }}
          footer={
            <>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="roster-member-form" variant="primary" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Add member"}
              </Button>
            </>
          }
        >
          <form id="roster-member-form" className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSave(event)}>
            {formError ? (
              <div className="sm:col-span-2">
                <AlertBanner variant="error" title="Could not save member">
                  {formError}
                </AlertBanner>
              </div>
            ) : null}
            <FormField id="roster-unit" label="Unit number" required hint={`${ROSTER_UNIT_MIN}–${ROSTER_UNIT_MAX}`}>
              <Input
                id="roster-unit"
                inputMode="numeric"
                required
                value={form.unitNumber}
                onChange={(event) => setForm((current) => ({ ...current, unitNumber: event.target.value }))}
              />
            </FormField>
            <FormField id="roster-rank" label="Rank" required>
              <Input
                id="roster-rank"
                required
                list="roster-rank-suggestions"
                value={form.rank}
                onChange={(event) => setForm((current) => ({ ...current, rank: event.target.value }))}
              />
              <datalist id="roster-rank-suggestions">
                {ROSTER_RANK_SUGGESTIONS.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </FormField>
            <FormField id="roster-first-name" label="First name" required>
              <Input
                id="roster-first-name"
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              />
            </FormField>
            <FormField id="roster-last-name" label="Last name" required>
              <Input
                id="roster-last-name"
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              />
            </FormField>
            <FormField id="roster-phone" label="Phone number" required hint="Stored as (###) ###-####">
              <Input
                id="roster-phone"
                type="tel"
                required
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </FormField>
            <FormField id="roster-email" label="Email" required>
              <Input
                id="roster-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </FormField>
            <FormField id="roster-activity" label="Activity status" required className="sm:col-span-2">
              <Select
                id="roster-activity"
                required
                value={form.activityStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    activityStatus: event.target.value as RosterActivityStatus,
                  }))
                }
              >
                {ROSTER_ACTIVITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROSTER_ACTIVITY_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>
          </form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <Modal
          title="Remove roster member?"
          description={`Remove ${rosterDisplayName(pendingDelete)} (unit ${pendingDelete.unitNumber}) from the roster? This cannot be undone.`}
          onClose={() => {
            if (!deleting) setPendingDelete(null);
          }}
          size="md"
          footer={
            <>
              <Button type="button" variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" disabled={deleting} onClick={() => void handleDeleteConfirmed()}>
                {deleting ? "Removing…" : "Remove member"}
              </Button>
            </>
          }
        />
      ) : null}
    </div>
  );
}
