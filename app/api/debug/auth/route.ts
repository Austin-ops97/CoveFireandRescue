import { NextResponse } from "next/server";
import {
  getUserProfileByUid,
  verifyFirebaseIdToken,
} from "@/lib/auth/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { firebaseConfig } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firestore/collections";

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function GET(request: Request) {
  const firebaseProjectId =
    adminAuth.app.options.projectId?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    "(not set)";

  const base = {
    firebaseProjectId,
    clientFirebaseProjectId: firebaseConfig.projectId || "(not set)",
    currentLookupCollection: COLLECTIONS.users,
    currentUid: null as string | null,
    authenticatedEmail: null as string | null,
    profileFound: false,
    profileData: null as Record<string, unknown> | null,
    firestoreDocumentPath: null as string | null,
    adminDocumentExists: null as boolean | null,
    adminDocumentData: null as Record<string, unknown> | null,
  };

  const idToken = extractBearerToken(request);
  if (!idToken) {
    return NextResponse.json({
      ...base,
      error: "Missing Authorization Bearer token. Sign in and call with Firebase ID token.",
    });
  }

  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    const uid = decoded.uid;
    const firestoreDocumentPath = `${COLLECTIONS.users}/${uid}`;
    const profile = await getUserProfileByUid(uid);
    const adminSnapshot = await adminDb
      .collection(COLLECTIONS.users)
      .doc(uid)
      .get();
    const adminDocumentExists = adminSnapshot.exists;
    const adminDocumentData = adminSnapshot.exists
      ? ((adminSnapshot.data() ?? {}) as Record<string, unknown>)
      : null;

    console.info("[debug/auth] profile lookup", {
      firebaseProjectId,
      clientFirebaseProjectId: firebaseConfig.projectId || "(not set)",
      firebaseAuthUid: uid,
      firebaseAuthEmail: decoded.email ?? null,
      firestoreCollection: COLLECTIONS.users,
      firestoreDocumentPath,
      profileFound: Boolean(profile),
      profileData: profile,
      adminDocumentExists,
      adminDocumentData,
    });

    return NextResponse.json({
      ...base,
      currentUid: uid,
      authenticatedEmail: decoded.email ?? null,
      profileFound: Boolean(profile),
      profileData: profile,
      firestoreDocumentPath,
      adminDocumentExists,
      adminDocumentData,
    });
  } catch (error) {
    console.error("[debug/auth] token verification failed", error);

    return NextResponse.json(
      {
        ...base,
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify authentication token.",
      },
      { status: 401 }
    );
  }
}
