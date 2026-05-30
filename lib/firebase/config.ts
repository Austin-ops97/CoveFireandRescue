/**
 * Firebase web app configuration (client-safe public keys only).
 */

export const FIREBASE_ENV_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number];

const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  ...(measurementId ? { measurementId } : {}),
};

export const isFirebaseConfigured = (): boolean =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

export function getMissingFirebaseEnvKeys(): FirebaseEnvKey[] {
  return FIREBASE_ENV_KEYS.filter((key) => !process.env[key]?.trim());
}

/**
 * Throws in development when required Firebase env vars are missing.
 * Call before initializing the client SDK.
 */
export function assertFirebaseEnv(): void {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length === 0) return;

  throw new Error(
    [
      "Missing required Firebase environment variables:",
      missing.join(", "),
      "",
      "Copy .env.local.example to .env.local and add your Firebase web app config.",
    ].join("\n")
  );
}

export type FirebaseClientDebugInfo = {
  projectId: string;
  authDomain: string;
  hasApiKey: boolean;
  hasAppId: boolean;
};

/** Safe public values for login troubleshooting (never includes secrets). */
export function getFirebaseClientDebugInfo(): FirebaseClientDebugInfo {
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "(not set)",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "(not set)",
    hasApiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()),
    hasAppId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()),
  };
}
