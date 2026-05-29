"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/site/Badge";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
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

function StatusBadge({ status }: { status: FleetUnitRecord["status"] }) {
  const styles: Record<FleetUnitRecord["status"], string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-amber-100 text-amber-900",
    archived: "bg-brand-gray/20 text-brand-gray",
  };

  return <Badge label={getFleetStatusLabel(status)} className={styles[status]} />;
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

const inputClassName = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

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
    void loadImagePreviews(record.imageFileIds);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

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
      <Card className="border-l-4 border-l-brand-red">
        <p className="text-sm text-brand-gray">
          Only <strong className="text-brand-charcoal">active</strong> fleet units appear on the
          public fleet page.
        </p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">All fleet units</h2>
          <p className="mt-1 text-sm text-brand-gray">
            {loading ? "Loading…" : `${fleet.length} total`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || refreshing}
          onClick={() => void loadFleet(true)}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {successMessage && (
        <Card className="border-l-4 border-l-green-600 bg-green-50/50">
          <p className="text-sm font-medium text-green-900">{successMessage}</p>
        </Card>
      )}

      {loadError && (
        <Card className="border-l-4 border-l-brand-red bg-red-50/40">
          <p className="text-sm font-medium text-brand-charcoal">Could not load fleet units</p>
          <p className="mt-1 text-sm text-brand-gray">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void loadFleet(true)}
          >
            Try again
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold text-brand-charcoal">
          {editingId ? "Edit fleet unit" : "New fleet unit"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand-charcoal">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            />
            Active (eligible for public display when status is Active)
          </label>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-charcoal">Fleet photos</p>
            {editingId || form.id ? (
              <>
                <input
                  id="fleetPhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  disabled={uploadingImage || saving}
                  onChange={(event) => void handleImageUpload(event)}
                  className="block w-full text-sm text-brand-gray file:mr-3 file:rounded-md file:border-0 file:bg-brand-red file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="text-xs text-brand-gray">
                  JPEG, PNG, WebP, HEIC, or HEIF up to 15 MB. The first photo is shown on the
                  public fleet page.
                </p>
              </>
            ) : (
              <p className="text-sm text-brand-gray">
                Save the fleet unit first before uploading photos.
              </p>
            )}

            {form.imageFileIds.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {form.imageFileIds.map((fileId, index) => {
                  const previewUrl = imagePreviews[fileId];
                  return (
                    <div key={fileId} className="overflow-hidden rounded-md border border-gray-200">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={`Fleet photo ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-brand-gray-light text-sm text-brand-gray">
                          Photo attached
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {uploadError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {uploadError}
              </p>
            )}
          </div>

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

      {loading && !loadError && (
        <Card>
          <p className="text-sm text-brand-gray">Loading fleet units…</p>
        </Card>
      )}

      {!loading && !loadError && fleet.length === 0 && (
        <Card>
          <h3 className="font-bold text-brand-charcoal">No fleet units yet</h3>
          <p className="mt-2 text-sm text-brand-gray">
            Add your first apparatus using the form above.
          </p>
        </Card>
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
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      <Badge
                        label={item.type}
                        className="bg-brand-gray-light text-brand-charcoal"
                      />
                      {!item.active && item.status !== "archived" && (
                        <Badge label="Inactive flag" className="bg-amber-50 text-amber-900" />
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
