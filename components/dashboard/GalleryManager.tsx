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
import { uploadImageToB2 } from "@/lib/storage/client";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    setUploadError(null);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    setUploadError(null);
    setError(null);
    setMessage(null);

    try {
      const uploaded = await uploadImageToB2({
        file,
        module: "gallery",
        relatedId: form.id ?? null,
      });
      setForm((current) => ({
        ...current,
        imageUrl: uploaded.publicUrl,
        altText:
          !current.altText.trim() && current.title.trim() ? current.title.trim() : current.altText,
      }));
      setMessage("Image uploaded. Finish the form and save the gallery photo.");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.imageUrl.trim()) {
      setError("Upload an image or enter an image URL.");
      return;
    }

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
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-charcoal">Photo</p>
            <div>
              <label htmlFor="gallery-upload" className="block text-sm font-medium">
                Upload image
              </label>
              <input
                id="gallery-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                disabled={uploadingImage || saving}
                onChange={(event) => void handleImageUpload(event)}
                className="mt-1 block w-full text-sm text-brand-gray file:mr-3 file:rounded-md file:border-0 file:bg-brand-red file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <p className="mt-1 text-xs text-brand-gray">
                JPEG, PNG, WebP, HEIC, or HEIF up to 4.5 MB.
              </p>
            </div>
            <div>
              <label htmlFor="gallery-url" className="block text-sm font-medium">
                Or image URL
              </label>
              <input
                id="gallery-url"
                type="url"
                placeholder="https://..."
                className={`mt-1 ${inputBase}`}
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
            </div>
            {form.imageUrl && (
              <div className="overflow-hidden rounded-md border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt={form.altText || "Gallery preview"}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
            {uploadError && (
              <p className="text-sm font-medium text-brand-red" role="alert">
                {uploadError}
              </p>
            )}
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
            <Button type="submit" variant="primary" disabled={saving || uploadingImage}>
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
          description="Upload photos or add image URLs to display them on the public gallery page."
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
