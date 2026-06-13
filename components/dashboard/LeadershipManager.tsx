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
  ManagerPhotoUpload,
  SkeletonCardList,
  StatusBadge,
} from "@/components/ui";
import { inputBase } from "@/lib/ui/classes";
import {
  archiveLeadershipMember,
  fetchAdminLeadership,
  saveLeadershipMember,
} from "@/lib/leadership/client";
import { resolveStoredFiles, uploadImageToB2 } from "@/lib/storage/client";
import {
  COMMON_LEADERSHIP_RANKS,
  LEADERSHIP_STATUSES,
  getLeadershipStatusLabel,
} from "@/lib/leadership/types";
import type { LeadershipMemberFormState, LeadershipMemberRecord } from "@/lib/leadership/types";

const emptyForm: LeadershipMemberFormState = {
  name: "",
  rank: "Fire Chief",
  title: "",
  email: "",
  phone: "",
  bio: "",
  photoFileId: "",
  status: "active",
  active: true,
  sortOrder: "999",
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

function LeadershipStatusBadge({ status }: { status: LeadershipMemberRecord["status"] }) {
  return <StatusBadge label={getLeadershipStatusLabel(status)} variant={status} />;
}

function recordToForm(record: LeadershipMemberRecord): LeadershipMemberFormState {
  return {
    id: record.id,
    name: record.name,
    rank: record.rank,
    title: record.title ?? "",
    email: record.email ?? "",
    phone: record.phone ?? "",
    bio: record.bio,
    photoFileId: record.photoFileId ?? "",
    status: record.status,
    active: record.active,
    sortOrder: String(record.sortOrder),
  };
}

function validateForm(form: LeadershipMemberFormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (form.name.trim().length > 100) return "Name must be 100 characters or fewer.";
  if (!form.rank.trim()) return "Rank is required.";
  if (form.bio.length > 5000) return "Bio must be 5000 characters or fewer.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Email format is invalid.";
  }
  return null;
}

const inputClassName = inputBase;

export function LeadershipManager() {
  const [leadership, setLeadership] = useState<LeadershipMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<LeadershipMemberFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadLeadership = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchAdminLeadership();
      setLeadership(items);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load leadership members."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLeadership();
  }, [loadLeadership]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
    setUploadError(null);
    setPhotoPreviewUrl(null);
  }

  async function loadPhotoPreview(photoFileId: string) {
    if (!photoFileId) {
      setPhotoPreviewUrl(null);
      return;
    }

    try {
      const files = await resolveStoredFiles([photoFileId]);
      setPhotoPreviewUrl(files[photoFileId]?.publicUrl ?? null);
    } catch {
      setPhotoPreviewUrl(null);
    }
  }

  function handleEdit(record: LeadershipMemberRecord) {
    setForm(recordToForm(record));
    setEditingId(record.id);
    setSaveError(null);
    setUploadError(null);
    setSuccessMessage(null);
    if (record.photoUrl) {
      setPhotoPreviewUrl(record.photoUrl);
    } else if (record.photoFileId) {
      void loadPhotoPreview(record.photoFileId);
    } else {
      setPhotoPreviewUrl(null);
    }
  }

  async function handlePhotoUpload(file: File) {
    const memberId = editingId ?? form.id;
    if (!memberId) {
      setUploadError("Save the leadership record first before uploading a photo.");
      return;
    }

    setUploadingPhoto(true);
    setUploadError(null);
    setSaveError(null);

    try {
      const uploaded = await uploadImageToB2({
        file,
        module: "leadership",
        relatedId: memberId,
      });

      setForm((prev) => ({ ...prev, photoFileId: uploaded.id }));
      setPhotoPreviewUrl(uploaded.publicUrl);

      await saveLeadershipMember({
        ...form,
        id: memberId,
        name: form.name.trim(),
        rank: form.rank.trim(),
        title: form.title.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio,
        photoFileId: uploaded.id,
      });

      await loadLeadership(true);
      setSuccessMessage("Leadership photo uploaded and saved.");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload leadership photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    const memberId = editingId ?? form.id;
    if (!memberId || !form.photoFileId) return;

    const previousPhotoFileId = form.photoFileId;
    setForm((prev) => ({ ...prev, photoFileId: "" }));
    setPhotoPreviewUrl(null);
    setUploadError(null);
    setSaveError(null);

    try {
      await saveLeadershipMember({
        ...form,
        id: memberId,
        name: form.name.trim(),
        rank: form.rank.trim(),
        title: form.title.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio,
        photoFileId: "",
      });
      await loadLeadership(true);
      setSuccessMessage("Leadership photo removed.");
    } catch (error) {
      setForm((prev) => ({ ...prev, photoFileId: previousPhotoFileId }));
      void loadPhotoPreview(previousPhotoFileId);
      setSaveError(
        error instanceof Error ? error.message : "Failed to remove leadership photo."
      );
    }
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
      const saved = await saveLeadershipMember({
        ...form,
        name: form.name.trim(),
        rank: form.rank.trim(),
        title: form.title.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio,
        photoFileId: form.photoFileId.trim(),
      });
      await loadLeadership(true);
      if (!editingId) {
        setForm(recordToForm(saved));
        setEditingId(saved.id);
        setSuccessMessage(`Created "${saved.name}". You can upload a photo now.`);
      } else {
        resetForm();
        setSuccessMessage(
          `Saved "${saved.name}" (${getLeadershipStatusLabel(saved.status)}).`
        );
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save leadership member."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string, name: string) {
    if (
      !window.confirm(`Archive "${name}"? It will be removed from the public leadership page.`)
    ) {
      return;
    }

    setArchivingId(id);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await archiveLeadershipMember(id);
      await loadLeadership(true);
      if (editingId === id) resetForm();
      setSuccessMessage(`Archived "${name}".`);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to archive leadership member."
      );
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <InfoBanner>
        Only <strong className="font-medium text-brand-charcoal">active</strong> leadership records
        appear on the public leadership page.
      </InfoBanner>

      <ListToolbar
        title="All leadership members"
        countLabel={loading ? undefined : `${leadership.length} total`}
        onRefresh={() => void loadLeadership(true)}
        refreshing={refreshing}
        refreshDisabled={loading || refreshing}
      />

      {successMessage && <AlertBanner variant="success">{successMessage}</AlertBanner>}

      {loadError && (
        <AlertBanner
          variant="error"
          title="Could not load leadership"
          onRetry={() => void loadLeadership(true)}
        >
          {loadError}
        </AlertBanner>
      )}

      <Card>
        <h2 className="text-base font-semibold text-brand-charcoal">
          {editingId ? "Edit leadership member" : "New leadership member"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-charcoal">
                Name <span className="text-brand-red">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="rank" className="block text-sm font-semibold text-brand-charcoal">
                Rank <span className="text-brand-red">*</span>
              </label>
              <select
                id="rank"
                value={form.rank}
                onChange={(event) => setForm((prev) => ({ ...prev, rank: event.target.value }))}
                className={inputClassName}
              >
                {COMMON_LEADERSHIP_RANKS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-brand-charcoal">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                maxLength={120}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className={inputClassName}
                placeholder="e.g. Station Captain"
              />
            </div>
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-semibold text-brand-charcoal">
                Sort Order
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="text"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-brand-gray">Lower numbers appear first on the public page.</p>
            </div>
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
                maxLength={160}
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-brand-charcoal">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={40}
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-brand-charcoal">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              maxLength={5000}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                    status: event.target.value as LeadershipMemberFormState["status"],
                  }))
                }
                className={inputClassName}
              >
                {LEADERSHIP_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CheckboxField
            id="leadershipActive"
            label="Active (eligible for public display when status is Active)"
            checked={form.active}
            onChange={(active) => setForm((prev) => ({ ...prev, active }))}
          />

          <ManagerPhotoUpload
            label="Leadership photo"
            photos={
              form.photoFileId
                ? [{ fileId: form.photoFileId, previewUrl: photoPreviewUrl }]
                : []
            }
            disabled={saving}
            uploading={uploadingPhoto}
            uploadError={uploadError}
            recordSaved={Boolean(editingId || form.id)}
            maxPhotos={1}
            aspectClassName="aspect-[4/5]"
            hint="Portrait photo shown on the public leadership page. JPEG, PNG, WebP, HEIC, or HEIF up to 4.5 MB."
            onUpload={(file) => void handlePhotoUpload(file)}
            onRemove={() => void handleRemovePhoto()}
          />

          {saveError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create leadership member"}
            </Button>
            {(editingId || form.name) && (
              <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {loading && !loadError && <SkeletonCardList count={3} />}

      {!loading && !loadError && leadership.length === 0 && (
        <EmptyState
          title="No leadership members yet"
          description="Add your first command staff profile using the form above."
        />
      )}

      {!loading && !loadError && leadership.length > 0 && (
        <div className="space-y-4">
          {leadership.map((item) => {
            const isArchived = item.status === "archived";

            return (
              <Card key={item.id} className={isArchived ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt={`${item.name} portrait`}
                      className="h-24 w-20 shrink-0 rounded-lg border border-gray-200 object-cover sm:h-28 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center text-xs text-brand-gray sm:h-28 sm:w-24">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <LeadershipStatusBadge status={item.status} />
                      <StatusBadge label={item.rank} variant="neutral" />
                      {!item.active && item.status !== "archived" && (
                        <StatusBadge label="Inactive flag" variant="warning" />
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-brand-charcoal">{item.name}</h3>
                    {item.title ? (
                      <p className="mt-1 text-sm font-medium text-brand-gray">{item.title}</p>
                    ) : null}
                    {(item.email || item.phone) && (
                      <p className="mt-2 text-sm text-brand-gray">
                        {[item.email, item.phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {item.bio ? (
                      <p className="mt-3 line-clamp-3 text-sm text-brand-gray">{item.bio}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-brand-gray">
                      Sort {item.sortOrder} · Updated {formatTimestamp(item.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      Edit
                    </Button>
                    {!isArchived && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={archivingId === item.id}
                        onClick={() => void handleArchive(item.id, item.name)}
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
