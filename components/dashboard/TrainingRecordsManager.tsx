"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList } from "@/components/ui";
import {
  deleteTrainingRecord,
  fetchTrainingRecords,
  saveTrainingRecord,
} from "@/lib/training/client";
import { TRAINING_RECORD_TYPES, type TrainingRecord, type TrainingRecordFormState } from "@/lib/training/types";
import { inputBase } from "@/lib/ui/classes";

const emptyForm: TrainingRecordFormState = {
  memberName: "",
  title: "",
  type: "hours",
  hours: "",
  completedAt: "",
  expiresAt: "",
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

function recordToForm(record: TrainingRecord): TrainingRecordFormState {
  return {
    id: record.id,
    memberName: record.memberName,
    title: record.title,
    type: record.type,
    hours: record.hours != null ? String(record.hours) : "",
    completedAt: toDateInput(record.completedAt),
    expiresAt: toDateInput(record.expiresAt),
    notes: record.notes ?? "",
  };
}

export function TrainingRecordsManager() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [form, setForm] = useState<TrainingRecordFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await fetchTrainingRecords());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load training records.");
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
      await saveTrainingRecord(form);
      setMessage(form.id ? "Training record updated." : "Training record added.");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save training record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this training record?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteTrainingRecord(id);
      setMessage("Training record deleted.");
      if (form.id === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete training record.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <h3 className="text-lg font-bold text-brand-charcoal">
          {form.id ? "Edit Training Record" : "Add Training Record"}
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
              <label htmlFor="memberName" className="block text-sm font-medium">
                Member name
              </label>
              <input
                id="memberName"
                className={inputBase}
                value={form.memberName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, memberName: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="recordType" className="block text-sm font-medium">
                Record type
              </label>
              <select
                id="recordType"
                className={inputBase}
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    type: event.target.value as TrainingRecordFormState["type"],
                  }))
                }
              >
                {TRAINING_RECORD_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium">
                {form.type === "certification" ? "Certification name" : "Course / training title"}
              </label>
              <input
                id="title"
                className={inputBase}
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </div>
            {form.type === "hours" ? (
              <div>
                <label htmlFor="hours" className="block text-sm font-medium">
                  Hours completed
                </label>
                <input
                  id="hours"
                  type="number"
                  min="0.1"
                  step="0.1"
                  className={inputBase}
                  value={form.hours}
                  onChange={(event) => setForm((prev) => ({ ...prev, hours: event.target.value }))}
                  required
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="completedAt" className="block text-sm font-medium">
                Completed date
              </label>
              <input
                id="completedAt"
                type="date"
                className={inputBase}
                value={form.completedAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, completedAt: event.target.value }))
                }
              />
            </div>
            {form.type === "certification" ? (
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium">
                  Expiration date
                </label>
                <input
                  id="expiresAt"
                  type="date"
                  className={inputBase}
                  value={form.expiresAt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, expiresAt: event.target.value }))
                  }
                />
              </div>
            ) : null}
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
              {saving ? "Saving…" : form.id ? "Update record" : "Add record"}
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
      ) : records.length === 0 ? (
        <EmptyState
          title="No training records yet"
          description="Track member training hours and certifications as members complete courses."
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-brand-charcoal">{record.title}</h4>
                  <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-semibold uppercase text-brand-blue">
                    {record.type === "certification" ? "Certification" : "Hours"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-gray">
                  {record.memberName}
                  {record.type === "hours" && record.hours != null ? ` · ${record.hours} hrs` : ""}
                  {record.completedAt ? ` · Completed ${formatDate(record.completedAt)}` : ""}
                  {record.expiresAt ? ` · Expires ${formatDate(record.expiresAt)}` : ""}
                </p>
                {record.notes ? (
                  <p className="mt-2 text-sm text-brand-gray">{record.notes}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(recordToForm(record))}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletingId === record.id}
                  onClick={() => void handleDelete(record.id)}
                >
                  {deletingId === record.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
