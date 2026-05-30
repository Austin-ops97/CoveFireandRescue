/**
 * Firebase client SDK — browser only.
 * Import from client components, hooks, and providers (not from Server Components).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  assertFirebaseEnv,
  firebaseConfig,
  isFirebaseConfigured,
} from "@/lib/firebase/config";

export let firebaseApp!: FirebaseApp;
export let auth!: Auth;
export let db!: Firestore;
export let analytics: Analytics | undefined;

let initialized = false;

async function initAnalyticsIfConfigured(app: FirebaseApp): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim()) {
    return;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.warn("Firebase Analytics initialization skipped.", error);
  }
}

function ensureBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error(
      "Firebase client SDK must only be initialized in the browser. Use server-side APIs for privileged operations."
    );
  }
}

/**
 * Initializes Firebase once per browser session. Safe to call multiple times.
 * Sets exported `firebaseApp`, `auth`, and `db` on first successful init.
 */
export function initFirebaseClient(): boolean {
  ensureBrowser();

  if (initialized) return true;

  if (!isFirebaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      assertFirebaseEnv();
    }
    return false;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  void initAnalyticsIfConfigured(firebaseApp);
  initialized = true;
  return true;
}

export function getFirebaseAuth(): Auth {
  if (!initialized && !initFirebaseClient()) {
    throw new Error("Firebase Auth is not configured.");
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!initialized && !initFirebaseClient()) {
    throw new Error("Firestore is not configured.");
  }
  return db;
}
