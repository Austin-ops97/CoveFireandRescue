/**
 * Client-safe Firebase exports.
 * Import `lib/firebase/client` only from client components.
 */
export {
  assertFirebaseEnv,
  firebaseConfig,
  FIREBASE_ENV_KEYS,
  getMissingFirebaseEnvKeys,
  isFirebaseConfigured,
} from "@/lib/firebase/config";
export type {
  UserProfile,
  UserProfileInput,
  UserRole,
} from "@/lib/firebase/types";
export { COLLECTIONS, userDocPath } from "@/lib/firestore/collections";
