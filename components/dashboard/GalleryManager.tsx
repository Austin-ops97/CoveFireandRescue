"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import {
  AlertBanner,
  CheckboxField,
  EmptyState,
  SkeletonCardList,
} from "@/components/ui";
import { galleryCategories } from "@/lib/config/site";
import { deleteGalleryItem, fetchAdminGallery, saveGalleryItem } from "@/lib/gallery/client";
import { getCategoryLabel } from "@/lib/gallery/types";
import type { GalleryFormState, GalleryRecord } from "@/lib/gallery/types";
import { inputBase } from "@/lib/ui/classes";

const emptyForm: GalleryFormState = {
  title: "",
  imageUrl: "",
  category: "team",
  altText: "",
  visible: true,
};

export function GalleryManager() {
  const [items, setItems] = useState<GalleryRecord[]>([]);
  const [form, setForm] = useState<GalleryFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminGallery());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(record: GalleryRecord) {
    setForm({
      id: record.id,
      title: record.title,
      imageUrl: record.imageUrl,
      category: record.category,
      altText: record.altText,
      visible: record.visible,
    });
    setMessage(null);
  }

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
      await saveGalleryItem(form);
      setMessage(form.id ? "Gallery item updated." : "Gallery item added.");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save gallery item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this gallery photo?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteGalleryItem(id);
      setMessage("Gallery item deleted.");
      if (form.id === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete gallery item.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <h3 className="text-lg font-bold text-brand-charcoal">
          {form.id ? "Edit Gallery Photo" : "Add Gallery Photo"}
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
              <label htmlFor="gallery-title" className="block text-sm font-medium">
                Title
              </label>
              <input
                id="gallery-title"
                required
                className={`mt-1 ${inputBase}`}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="gallery-category" className="block text-sm font-medium">
                Category
              </label>
              <select
                id="gallery-category"
                className={`mt-1 ${inputBase}`}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as GalleryFormState["category"],
                  }))
                }
              >
                {galleryCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="gallery-url" className="block text-sm font-medium">
              Image URL
            </label>
            <input
              id="gallery-url"
              required
              type="url"
              placeholder="https://..."
              className={`mt-1 ${inputBase}`}
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="gallery-alt" className="block text-sm font-medium">
              Alt text
            </label>
            <input
              id="gallery-alt"
              required
              className={`mt-1 ${inputBase}`}
              value={form.altText}
              onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
            />
          </div>
          <CheckboxField
            id="gallery-visible"
            label="Visible on public gallery"
            checked={form.visible}
            onChange={(visible) => setForm((f) => ({ ...f, visible }))}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : form.id ? "Update Photo" : "Add Photo"}
            </Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      {loading ? (
        <SkeletonCardList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No gallery photos"
          description="Add image URLs to display photos on the public gallery page."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden p-0">
              <div className="aspect-video bg-brand-gray-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.altText}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="font-semibold text-brand-charcoal">{item.title}</p>
                <p className="text-xs text-brand-gray">
                  {getCategoryLabel(item.category)} · {item.visible ? "Public" : "Hidden"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => void handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
