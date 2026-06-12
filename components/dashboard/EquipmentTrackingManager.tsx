"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList, StatusBadge } from "@/components/ui";
import {
  deleteEquipmentItem,
  fetchEquipmentItems,
  saveEquipmentItem,
} from "@/lib/equipment/client";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUSES,
  getEquipmentStatusLabel,
  type EquipmentFormState,
  type EquipmentItem,
} from "@/lib/equipment/types";
import { inputBase } from "@/lib/ui/classes";

const emptyForm: EquipmentFormState = {
  name: "",
  category: "Tools",
  location: "",
  serialNumber: "",
  status: "active",
  lastMaintenanceAt: "",
  nextMaintenanceDue: "",
  notes: "",
};

function formatDate(value: unknown): string {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function toDateInput(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function recordToForm(record: EquipmentItem): EquipmentFormState {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    location: record.location,
    serialNumber: record.serialNumber ?? "",
    status: record.status,
    lastMaintenanceAt: toDateInput(record.lastMaintenanceAt),
    nextMaintenanceDue: toDateInput(record.nextMaintenanceDue),
    notes: record.notes ?? "",
  };
}

export function EquipmentTrackingManager() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchEquipmentItems());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(emptyForm);
    setMessage(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveEquipmentItem(form);
      setMessage(form.id ? "Equipment updated." : "Equipment added.");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save equipment item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this equipment item?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteEquipmentItem(id);
      setMessage("Equipment item deleted.");
      if (form.id === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete equipment item.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <h3 className="text-lg font-bold text-brand-charcoal">
          {form.id ? "Edit Equipment Item" : "Add Equipment Item"}
        </h3>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {error && (
            <AlertBanner variant="error" title="Error">
              {error}
            </AlertBanner>
          )}
          {message && (
            <AlertBanner variant="success" title="Saved">
              {message}
            </AlertBanner>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Item name
              </label>
              <input
                id="name"
                className={inputBase}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium">
                Category
              </label>
              <select
                id="category"
                className={inputBase}
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value }))
                }
              >
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium">
                Location
              </label>
              <input
                id="location"
                className={inputBase}
                value={form.location}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, location: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium">
                Serial number
              </label>
              <input
                id="serialNumber"
                className={inputBase}
                value={form.serialNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, serialNumber: event.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                className={inputBase}
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as EquipmentFormState["status"],
                  }))
                }
              >
                {EQUIPMENT_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lastMaintenanceAt" className="block text-sm font-medium">
                Last maintenance
              </label>
              <input
                id="lastMaintenanceAt"
                type="date"
                className={inputBase}
                value={form.lastMaintenanceAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lastMaintenanceAt: event.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="nextMaintenanceDue" className="block text-sm font-medium">
                Next maintenance due
              </label>
              <input
                id="nextMaintenanceDue"
                type="date"
                className={inputBase}
                value={form.nextMaintenanceDue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nextMaintenanceDue: event.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className={inputBase}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : form.id ? "Update item" : "Add item"}
            </Button>
            {form.id ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {loading ? (
        <SkeletonCardList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No equipment tracked yet"
          description="Add tools, gear, and apparatus equipment to track location, status, and maintenance."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-brand-charcoal">{item.name}</h4>
                  <StatusBadge
                    label={getEquipmentStatusLabel(item.status)}
                    variant={
                      item.status === "active"
                        ? "active"
                        : item.status === "maintenance"
                          ? "warning"
                          : "archived"
                    }
                  />
                </div>
                <p className="mt-1 text-sm text-brand-gray">
                  {item.category} · {item.location}
                  {item.serialNumber ? ` · SN ${item.serialNumber}` : ""}
                </p>
                <p className="mt-1 text-sm text-brand-gray">
                  Last maintenance {formatDate(item.lastMaintenanceAt)} · Next due{" "}
                  {formatDate(item.nextMaintenanceDue)}
                </p>
                {item.notes ? (
                  <p className="mt-2 text-sm text-brand-gray">{item.notes}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(recordToForm(item))}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
