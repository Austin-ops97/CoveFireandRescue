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
  archiveFleetUnit,
  fetchAdminFleet,
  saveFleetUnit,
} from "@/lib/fleet/client";
import { resolveStoredFiles, uploadImageToB2 } from "@/lib/storage/client";
import {
  FLEET_STATUSES,
  FLEET_TYPES,
  getFleetStatusLabel,
} from "@/lib/fleet/types";
import type { FleetUnitFormState, FleetUnitRecord } from "@/lib/fleet/types";

const emptyForm: FleetUnitFormState = {
  name: "",
  unitNumber: "",
  type: "Engine",
  year: "",
  manufacturer: "",
  model: "",
  pumpCapacityGpm: "",
  waterCapacityGallons: "",
  equipmentNotes: "",
  imageFileIds: [],
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

function FleetStatusBadge({ status }: { status: FleetUnitRecord["status"] }) {
  return <StatusBadge label={getFleetStatusLabel(status)} variant={status} />;
}

function recordToForm(record: FleetUnitRecord): FleetUnitFormState {
  return {
    id: record.id,
    name: record.name,
    unitNumber: record.unitNumber,
    type: record.type,
    year: record.year,
    manufacturer: record.manufacturer,
    model: record.model ?? "",
    pumpCapacityGpm:
      record.pumpCapacityGpm !== null && record.pumpCapacityGpm !== undefined
        ? String(record.pumpCapacityGpm)
        : "",
    waterCapacityGallons:
      record.waterCapacityGallons !== null && record.waterCapacityGallons !== undefined
        ? String(record.waterCapacityGallons)
        : "",
    equipmentNotes: record.equipmentNotes,
    imageFileIds: record.imageFileIds,
    status: record.status,
    active: record.active,
    sortOrder: String(record.sortOrder),
  };
}

function validateForm(form: FleetUnitFormState): string | null {
  if (!form.name.trim()) return "Unit name is required.";
  if (form.name.trim().length > 100) return "Unit name must be 100 characters or fewer.";
  if (!form.type.trim()) return "Type is required.";
  if (form.equipmentNotes.length > 5000) {
    return "Equipment notes must be 5000 characters or fewer.";
  }
  return null;
}

function formatCapacity(value: number | null | undefined, suffix: string): string | null {
  if (value === null || value === undefined) return null;
  return `${value.toLocaleString()} ${suffix}`;
}

const inputClassName = inputBase;

export function FleetManager() {
  const [fleet, setFleet] = useState<FleetUnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FleetUnitFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadFleet = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchAdminFleet();
      setFleet(items);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load fleet units.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFleet();
  }, [loadFleet]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
    setUploadError(null);
    setImagePreviews({});
  }

  async function loadImagePreviews(fileIds: string[]) {
    if (fileIds.length === 0) {
      setImagePreviews({});
      return;
    }

    try {
      const files = await resolveStoredFiles(fileIds);
      const previews: Record<string, string> = {};
      for (const id of fileIds) {
        if (files[id]?.publicUrl) {
          previews[id] = files[id].publicUrl;
        }
      }
      setImagePreviews(previews);
    } catch {
      setImagePreviews({});
    }
  }

  function handleEdit(record: FleetUnitRecord) {
    setForm(recordToForm(record));
    setEditingId(record.id);
    setSaveError(null);
    setUploadError(null);
    setSuccessMessage(null);
    if (record.imageFileIds.length === 0) {
      setImagePreviews({});
      return;
    }
    if (record.primaryImageUrl && record.imageFileIds[0]) {
      const previews: Record<string, string> = {
        [record.imageFileIds[0]]: record.primaryImageUrl,
      };
      setImagePreviews(previews);
      if (record.imageFileIds.length > 1) {
        void loadImagePreviews(record.imageFileIds);
      }
      return;
    }
    void loadImagePreviews(record.imageFileIds);
  }

  async function handleImageUpload(file: File) {
    const fleetId = editingId ?? form.id;
    if (!fleetId) {
      setUploadError("Save the fleet unit first before uploading photos.");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    setSaveError(null);

    try {
      const uploaded = await uploadImageToB2({
        file,
        module: "fleet",
        relatedId: fleetId,
      });

      const nextImageFileIds = [...form.imageFileIds, uploaded.id];
      setForm((prev) => ({ ...prev, imageFileIds: nextImageFileIds }));
      setImagePreviews((prev) => ({ ...prev, [uploaded.id]: uploaded.publicUrl }));

      await saveFleetUnit({
        ...form,
        id: fleetId,
        name: form.name.trim(),
        unitNumber: form.unitNumber.trim(),
        type: form.type.trim(),
        year: form.year.trim(),
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        equipmentNotes: form.equipmentNotes,
        imageFileIds: nextImageFileIds,
      });

      await loadFleet(true);
      setSuccessMessage("Fleet photo uploaded and saved.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload fleet photo.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage(fileId: string) {
    const fleetId = editingId ?? form.id;
    if (!fleetId) return;

    const nextImageFileIds = form.imageFileIds.filter((id) => id !== fileId);
    setForm((prev) => ({ ...prev, imageFileIds: nextImageFileIds }));
    setImagePreviews((prev) => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
    setUploadError(null);
    setSaveError(null);

    try {
      await saveFleetUnit({
        ...form,
        id: fleetId,
        name: form.name.trim(),
        unitNumber: form.unitNumber.trim(),
        type: form.type.trim(),
        year: form.year.trim(),
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        equipmentNotes: form.equipmentNotes,
        imageFileIds: nextImageFileIds,
      });
      await loadFleet(true);
      setSuccessMessage("Fleet photo removed.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to remove fleet photo.");
      setForm((prev) => ({ ...prev, imageFileIds: form.imageFileIds }));
      void loadImagePreviews(form.imageFileIds);
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
      const saved = await saveFleetUnit({
        ...form,
        name: form.name.trim(),
        unitNumber: form.unitNumber.trim(),
        type: form.type.trim(),
        year: form.year.trim(),
        manufacturer: form.manufacturer.trim(),
        model: form.model.trim(),
        equipmentNotes: form.equipmentNotes,
        imageFileIds: form.imageFileIds,
      });
      await loadFleet(true);
      if (!editingId) {
        setForm(recordToForm(saved));
        setEditingId(saved.id);
        setSuccessMessage(`Created "${saved.name}". You can upload photos now.`);
      } else {
        resetForm();
        setSuccessMessage(`Saved "${saved.name}" (${getFleetStatusLabel(saved.status)}).`);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save fleet unit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(id: string, name: string) {
    if (!window.confirm(`Archive "${name}"? It will be removed from the public fleet page.`)) {
      return;
    }

    setArchivingId(id);
    setSaveError(null);
    setSuccessMessage(null);

    try {
      await archiveFleetUnit(id);
      await loadFleet(true);
      if (editingId === id) resetForm();
      setSuccessMessage(`Archived "${name}".`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to archive fleet unit.");
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <InfoBanner>
        Only <strong className="font-medium text-brand-charcoal">active</strong> fleet units appear
        on the public fleet page.
      </InfoBanner>

      <ListToolbar
        title="All fleet units"
        countLabel={loading ? undefined : `${fleet.length} total`}
        onRefresh={() => void loadFleet(true)}
        refreshing={refreshing}
        refreshDisabled={loading || refreshing}
      />

      {successMessage && <AlertBanner variant="success">{successMessage}</AlertBanner>}

      {loadError && (
        <AlertBanner variant="error" title="Could not load fleet units" onRetry={() => void loadFleet(true)}>
          {loadError}
        </AlertBanner>
      )}

      <Card>
        <h2 className="text-base font-semibold text-brand-charcoal">
          {editingId ? "Edit fleet unit" : "New fleet unit"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-charcoal">
                Unit Name <span className="text-brand-red">*</span>
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
              <label
                htmlFor="unitNumber"
                className="block text-sm font-semibold text-brand-charcoal"
              >
                Unit Number
              </label>
              <input
                id="unitNumber"
                name="unitNumber"
                type="text"
                maxLength={50}
                value={form.unitNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, unitNumber: event.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-brand-charcoal">
                Type <span className="text-brand-red">*</span>
              </label>
              <select
                id="type"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className={inputClassName}
              >
                {FLEET_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-brand-charcoal">
                Year
              </label>
              <input
                id="year"
                name="year"
                type="text"
                maxLength={20}
                value={form.year}
                onChange={(event) => setForm((prev) => ({ ...prev, year: event.target.value }))}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="manufacturer"
                className="block text-sm font-semibold text-brand-charcoal"
              >
                Manufacturer
              </label>
              <input
                id="manufacturer"
                name="manufacturer"
                type="text"
                maxLength={100}
                value={form.manufacturer}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, manufacturer: event.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-semibold text-brand-charcoal">
                Model
              </label>
              <input
                id="model"
                name="model"
                type="text"
                maxLength={100}
                value={form.model}
                onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pumpCapacityGpm"
                className="block text-sm font-semibold text-brand-charcoal"
              >
                Pump Capacity (GPM)
              </label>
              <input
                id="pumpCapacityGpm"
                name="pumpCapacityGpm"
                type="text"
                inputMode="numeric"
                value={form.pumpCapacityGpm}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pumpCapacityGpm: event.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label
                htmlFor="waterCapacityGallons"
                className="block text-sm font-semibold text-brand-charcoal"
              >
                Water Capacity (Gallons)
              </label>
              <input
                id="waterCapacityGallons"
                name="waterCapacityGallons"
                type="text"
                inputMode="numeric"
                value={form.waterCapacityGallons}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, waterCapacityGallons: event.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="equipmentNotes"
              className="block text-sm font-semibold text-brand-charcoal"
            >
              Equipment Notes
            </label>
            <textarea
              id="equipmentNotes"
              name="equipmentNotes"
              rows={4}
              maxLength={5000}
              value={form.equipmentNotes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, equipmentNotes: event.target.value }))
              }
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
                    status: event.target.value as FleetUnitFormState["status"],
                  }))
                }
                className={inputClassName}
              >
                {FLEET_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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

          <CheckboxField
            id="fleetActive"
            label="Active (eligible for public display when status is Active)"
            checked={form.active}
            onChange={(active) => setForm((prev) => ({ ...prev, active }))}
          />

          <ManagerPhotoUpload
            label="Fleet photos"
            photos={form.imageFileIds.map((fileId) => ({
              fileId,
              previewUrl: imagePreviews[fileId] ?? null,
            }))}
            disabled={saving}
            uploading={uploadingImage}
            uploadError={uploadError}
            recordSaved={Boolean(editingId || form.id)}
            maxPhotos={20}
            hint="JPEG, PNG, WebP, HEIC, or HEIF up to 4.5 MB. The first photo appears on the public fleet page."
            onUpload={(file) => void handleImageUpload(file)}
            onRemove={(fileId) => void handleRemoveImage(fileId)}
          />

          {saveError && (
            <p className="text-sm font-medium text-brand-red" role="alert">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create fleet unit"}
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

      {!loading && !loadError && fleet.length === 0 && (
        <EmptyState
          title="No fleet units yet"
          description="Add your first apparatus using the form above. Active units will appear on the public fleet page."
        />
      )}

      {!loading && !loadError && fleet.length > 0 && (
        <div className="space-y-4">
          {fleet.map((item) => {
            const isArchived = item.status === "archived";
            const pumpLabel = formatCapacity(item.pumpCapacityGpm, "GPM");
            const waterLabel = formatCapacity(item.waterCapacityGallons, "gal");

            return (
              <Card key={item.id} className={isArchived ? "opacity-70" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {item.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.primaryImageUrl}
                      alt={`${item.name} apparatus`}
                      className="h-20 w-28 shrink-0 rounded-lg border border-gray-200 object-cover sm:h-24 sm:w-32"
                    />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center text-xs text-brand-gray sm:h-24 sm:w-32">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FleetStatusBadge status={item.status} />
                      <StatusBadge label={item.type} variant="neutral" />
                      {!item.active && item.status !== "archived" && (
                        <StatusBadge label="Inactive flag" variant="warning" />
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-brand-charcoal">
                      {item.name}
                      {item.unitNumber ? (
                        <span className="ml-2 text-base font-semibold text-brand-gray">
                          #{item.unitNumber}
                        </span>
                      ) : null}
                    </h3>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {item.year && (
                        <div>
                          <dt className="text-brand-gray">Year</dt>
                          <dd className="font-medium text-brand-charcoal">{item.year}</dd>
                        </div>
                      )}
                      {item.manufacturer && (
                        <div>
                          <dt className="text-brand-gray">Manufacturer</dt>
                          <dd className="font-medium text-brand-charcoal">{item.manufacturer}</dd>
                        </div>
                      )}
                      {item.model && (
                        <div>
                          <dt className="text-brand-gray">Model</dt>
                          <dd className="font-medium text-brand-charcoal">{item.model}</dd>
                        </div>
                      )}
                      {pumpLabel && (
                        <div>
                          <dt className="text-brand-gray">Pump</dt>
                          <dd className="font-medium text-brand-charcoal">{pumpLabel}</dd>
                        </div>
                      )}
                      {waterLabel && (
                        <div>
                          <dt className="text-brand-gray">Water</dt>
                          <dd className="font-medium text-brand-charcoal">{waterLabel}</dd>
                        </div>
                      )}
                    </dl>
                    {item.equipmentNotes && (
                      <p className="mt-3 line-clamp-3 text-sm text-brand-gray">
                        {item.equipmentNotes}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-brand-gray">
                      {item.imageFileIds.length > 0
                        ? `${item.imageFileIds.length} photo${item.imageFileIds.length === 1 ? "" : "s"} · `
                        : ""}
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
