import type { UserRole } from "@/lib/auth/roles";

export type { UserRole };

export type FirestoreTimestamp = unknown;

export type UserProfile = {
  uid: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string | null;
  phone?: string | null;
  title?: string | null;
  role: UserRole;
  active: boolean;
  createdBy?: string | null;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

export type UserProfileInput = Omit<UserProfile, "createdAt" | "updatedAt"> & {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
};

/** Firestore document: public/managed announcements */
export type AnnouncementDocument = {
  title: string;
  excerpt: string;
  body?: string;
  category: string;
  published: boolean;
  publishedAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  createdBy: string;
};

/** Firestore document: fleet apparatus */
export type FleetUnitDocument = {
  unitName: string;
  year?: string;
  manufacturer?: string;
  pumpCapacity?: string;
  waterCapacity?: string;
  equipmentNotes?: string;
  imageKey?: string;
  sortOrder?: number;
  active: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};

/** Firestore document: leadership profile */
export type LeadershipMemberDocument = {
  name: string;
  rank: string;
  bio: string;
  photoKey?: string;
  sortOrder?: number;
  active: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
};
