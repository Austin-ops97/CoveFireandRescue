import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/** True when all Firebase Admin env vars are set (does not initialize the SDK). */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim()
  );
}

function assertAdminEnv(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!privateKeyRaw) missing.push("FIREBASE_PRIVATE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missing.join(", ")}. ` +
        "Add them in Vercel → Project → Settings → Environment Variables (server-only, no NEXT_PUBLIC_ prefix). " +
        "See docs/VERCEL_ENV_SETUP.md."
    );
  }

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: privateKeyRaw!.replace(/\\n/g, "\n"),
  };
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const { projectId, clientEmail, privateKey } = assertAdminEnv();

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

let cachedApp: App | undefined;
let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

function ensureAdmin(): { app: App; auth: Auth; db: Firestore } {
  if (!cachedApp) {
    cachedApp = createAdminApp();
    cachedAuth = getAuth(cachedApp);
    cachedDb = getFirestore(cachedApp);
  }

  return { app: cachedApp, auth: cachedAuth!, db: cachedDb! };
}

function createAdminProxy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = resolve();
      const value = Reflect.get(instance, prop);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

/** Lazily initialized Firebase Admin app (server-only). */
export const adminApp: App = createAdminProxy(() => ensureAdmin().app);

/** Lazily initialized Firebase Admin Auth (server-only). */
export const adminAuth: Auth = createAdminProxy(() => ensureAdmin().auth);

/** Lazily initialized Firebase Admin Firestore (server-only). */
export const adminDb: Firestore = createAdminProxy(() => ensureAdmin().db);
