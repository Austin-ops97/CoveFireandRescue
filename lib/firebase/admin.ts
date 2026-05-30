import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const PRIVATE_KEY_BEGIN = "-----BEGIN PRIVATE KEY-----";
const PRIVATE_KEY_END = "-----END PRIVATE KEY-----";

/** True when all Firebase Admin env vars are set (does not initialize the SDK). */
export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim()
  );
}

export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  key = key.replace(/\\n/g, "\n");

  return key;
}

export function validatePrivateKey(privateKey: string): void {
  if (
    !privateKey.includes(PRIVATE_KEY_BEGIN) ||
    !privateKey.includes(PRIVATE_KEY_END)
  ) {
    throw new Error(
      "Firebase Admin private key is malformed. Check Vercel FIREBASE_PRIVATE_KEY formatting."
    );
  }
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

  const privateKey = normalizePrivateKey(privateKeyRaw!);
  validatePrivateKey(privateKey);

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey,
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

export type FirebaseAdminConnectivityResult =
  | {
      ok: true;
      firebaseAdminInitialized: true;
      firestoreReadOk: true;
      usersCollectionReadable: true;
    }
  | {
      ok: false;
      firebaseAdminInitialized: boolean;
      firestoreReadOk: boolean;
      usersCollectionReadable: boolean;
      step: string;
      code: string;
      message: string;
    };

function readErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string" || typeof code === "number") {
      return String(code);
    }
  }
  return "unknown";
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/** Safe connectivity probe for Firebase Admin SDK (no secrets returned). */
export async function testFirebaseAdminConnectivity(): Promise<
  FirebaseAdminConnectivityResult & { firebaseProjectId?: string }
> {
  try {
    ensureAdmin();
  } catch (error) {
    return {
      ok: false,
      firebaseAdminInitialized: false,
      firestoreReadOk: false,
      usersCollectionReadable: false,
      step: "admin-init",
      code: readErrorCode(error),
      message: readErrorMessage(
        error,
        "Firebase Admin SDK failed to initialize. Check server environment variables."
      ),
    };
  }

  try {
    const { auth } = ensureAdmin();
    if (!auth.app.options.projectId) {
      throw new Error("Firebase Admin Auth project ID is not configured.");
    }
  } catch (error) {
    return {
      ok: false,
      firebaseAdminInitialized: true,
      firestoreReadOk: false,
      usersCollectionReadable: false,
      step: "admin-auth",
      code: readErrorCode(error),
      message: readErrorMessage(
        error,
        "Firebase Admin Auth configuration check failed."
      ),
    };
  }

  try {
    const { db } = ensureAdmin();
    await db.collection("users").limit(1).get();
  } catch (error) {
    return {
      ok: false,
      firebaseAdminInitialized: true,
      firestoreReadOk: false,
      usersCollectionReadable: false,
      step: "firestore-read",
      code: readErrorCode(error),
      message: readErrorMessage(
        error,
        "Firestore Admin read failed. Check service account IAM permissions and Firestore setup."
      ),
    };
  }

  return {
    ok: true,
    firebaseAdminInitialized: true,
    firestoreReadOk: true,
    usersCollectionReadable: true,
    firebaseProjectId: ensureAdmin().auth.app.options.projectId ?? undefined,
  };
}

/** Lazily initialized Firebase Admin app (server-only). */
export const adminApp: App = createAdminProxy(() => ensureAdmin().app);

/** Lazily initialized Firebase Admin Auth (server-only). */
export const adminAuth: Auth = createAdminProxy(() => ensureAdmin().auth);

/** Lazily initialized Firebase Admin Firestore (server-only). */
export const adminDb: Firestore = createAdminProxy(() => ensureAdmin().db);
