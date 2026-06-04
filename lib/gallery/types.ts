import { galleryCategories, type GalleryCategory } from "@/lib/config/site";

export function getCategoryLabel(category: GalleryCategory): string {
  return galleryCategories.find((c) => c.value === category)?.label ?? "Photo";
}

export type GalleryRecord = {
  id: string;
  title: string;
  imageUrl: string;
  category: GalleryCategory;
  altText: string;
  uploadedAt?: unknown;
  visible: boolean;
};

export type GalleryFormState = {
  id?: string;
  title: string;
  imageUrl: string;
  category: GalleryCategory;
  altText: string;
  visible: boolean;
};
