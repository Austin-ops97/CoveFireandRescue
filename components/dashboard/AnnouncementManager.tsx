"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  CheckboxField,
  EmptyState,
  InfoBanner,
  ListToolbar,
  SkeletonCardList,
  StatusBadge,
} from "@/components/ui";
import { inputBase } from "@/lib/ui/classes";
import {
  archiveAnnouncement,
  fetchAdminAnnouncements,
  saveAnnouncement,
} from "@/lib/announcements/client";
import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUSES,
  getCategoryLabel,
  getStatusLabel,
} from "@/lib/announcements/types";
import type { AnnouncementFormState, AnnouncementRecord } from "@/lib/announcements/types";

const emptyForm: AnnouncementFormState = {
  title: "",
  body: "",
  category: "general",
  status: "draft",
  pinned: false,
};

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

function AnnouncementStatusBadge({ status }: { status: AnnouncementRecord["status"] }) {
  const variant =
    status === "published" ? "published" : status === "archived" ? "archived" : "draft";
  return <StatusBadge label={getStatusLabel(status)} variant={variant} />;
}

function recordToForm(record: AnnouncementRecord): AnnouncementFormState {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    category: record.category,
    status: record.status,
    pinned: record.pinned,
  };
}

function validateForm(form: AnnouncementFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (form.title.trim().length > 140) return "Title must be 140 characters or fewer.";
  if (!form.body.trim()) return "Body is required.";
  if (form.body.trim().length > 5000) return "Body must be 5000 characters or fewer.";
  return null;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchAdminAnnouncements();
      setAnnouncements(items);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load announcements.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
  }

  function handleEdit(record: AnnouncementRecord) {
    setForm(recordToForm(record));
    setEditingId(record.id);
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
      const saved = await saveAnnouncement({
        ...form,
        title: form.title.trim(),
        body: form.body.trim(),
      });
      await loadAnnouncements(true);
      resetForm();
      setSuccessMessage(
        editingId
          ? `Saved "${saved.title}" (${getStatusLabel(saved.status)}).`
          : `Created "${saved.title}".`
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string, title: string) {
    if (!window.confirm(`Archive "${title}"? It will be removed from the public billboard.`)) {
      return;
    }

    setArchivingId(id);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await archiveAnnouncement(id);
      await loadAnnouncements(true);
      if (editingId === id) resetForm();
      setSuccessMessage(`Archived "${title}".`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to archive announcement.");
    } finally {
      setArchivingId(null);
    }
  }

  const fieldClass = inputBase;

  return (
    <div className="space-y-8">
      <InfoBanner>
        Only <strong className="font-medium text-brand-charcoal">published</strong> announcements
        appear on the public billboard at <code className="text-xs">/announcements</code>. Drafts
        stay internal until you publish them.
      </InfoBanner>

      <ListToolbar
        title="All announcements"
        countLabel={loading ? undefined : `${announcements.length} total`}
        onRefresh={() => void loadAnnouncements(true)}
        refreshing={refreshing}
        refreshDisabled={loading || refreshing}
      />

      {successMessage && <AlertBanner variant="success">{successMessage}</AlertBanner>}

      {loadError && (
        <AlertBanner
          variant="error"
          title="Could not load announcements"
          onRetry={() => void loadAnnouncements(true)}
        >
          {loadError}
        </AlertBanner>
      )}

      <Card>
        <h2 className="text-base font-semibold text-brand-charcoal">
          {editingId ? "Edit announcement" : "New announcement"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-brand-charcoal">
              Title <span className="text-brand-red">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={140}
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-semibold text-brand-charcoal">
              Body <span className="text-brand-red">*</span>
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={6}
              maxLength={5000}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-brand-charcoal">
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value as AnnouncementFormState["category"],
                  }))
                }
                className={fieldClass}
              >
                {ANNOUNCEMENT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-brand-charcoal">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as AnnouncementFormState["status"],
                  }))
                }
                className={fieldClass}
              >
                {ANNOUNCEMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CheckboxField
            id="announcementPinned"
            label="Pin to top of public billboard"
            checked={form.pinned}
            onChange={(pinned) => setForm((prev) => ({ ...prev, pinned }))}
          />

          <div className="rounded-lg border border-dashed border-gray-200 bg-brand-gray-light/50 px-4 py-3 text-sm text-brand-gray">
            Images will be added in the Backblaze B2 upload step.
          </div>

          {saveError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create announcement"}
            </Button>
            {(editingId || form.title || form.body) && (
              <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {loading && !loadError && <SkeletonCardList count={3} />}

      {!loading && !loadError && announcements.length === 0 && (
        <EmptyState
          title="No announcements yet"
          description="Create your first draft or published post using the form above."
        />
      )}

      {!loading && !loadError && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((item) => {
            const isArchived = item.status === "archived";
            return (
              <Card
                key={item.id}
                className={isArchived ? "opacity-70" : item.pinned ? "ring-1 ring-brand-red/25" : ""}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <AnnouncementStatusBadge status={item.status} />
                      <StatusBadge label={getCategoryLabel(item.category)} variant="neutral" />
                      {item.pinned && <StatusBadge label="Pinned" variant="admin" />}
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-brand-charcoal">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-brand-gray">
                      {item.body}
                    </p>
                    <p className="mt-3 text-xs text-brand-gray">
                      Updated {formatTimestamp(item.updatedAt)}
                      {item.publishedAt
                        ? ` · Published ${formatTimestamp(item.publishedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </Button>
                    {!isArchived && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={archivingId === item.id}
                        onClick={() => void handleArchive(item.id, item.title)}
                      >
                        {archivingId === item.id ? "Archiving…" : "Archive"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
