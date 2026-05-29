import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

export type VerifiedServerUser = {
  uid: string;
  email: string | null;
  role: "admin" | "member" | null;
  active: boolean;
  displayName: string | null;
};

export class ServerAuthError extends Error {
  readonly status: 401 | 403 | 500;
  readonly code: string;

  constructor(status: 401 | 403 | 500, code: string, message: string) {
    super(message);
    this.name = "ServerAuthError";
    this.status = status;
    this.code = code;
  }
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function readProfileRole(value: unknown): "admin" | "member" | null {
  if (value === "admin" || value === "member") return value;
  return null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new ServerAuthError(401, "invalid_token", "Invalid or expired authentication token.");
  }
}

export async function getUserProfileByUid(uid: string): Promise<VerifiedServerUser | null> {
  const snapshot = await adminDb.collection(COLLECTIONS.users).doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    uid,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    role: readProfileRole(data.role),
    active: data.active === true,
  };
}

async function buildVerifiedUserFromToken(
  decoded: DecodedIdToken
): Promise<VerifiedServerUser> {
  const profile = await getUserProfileByUid(decoded.uid);

  if (profile) {
    return profile;
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    displayName: decoded.name ?? null,
    role: null,
    active: false,
  };
}

export async function getVerifiedServerUserFromRequest(
  request: Request
): Promise<VerifiedServerUser | null> {
  const idToken = extractBearerToken(request);
  if (!idToken) return null;

  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    return buildVerifiedUserFromToken(decoded);
  } catch (error) {
    if (error instanceof ServerAuthError) return null;
    throw error;
  }
}

export async function requireServerUser(request: Request): Promise<VerifiedServerUser> {
  const idToken = extractBearerToken(request);
  if (!idToken) {
    throw new ServerAuthError(401, "missing_token", "Authentication required.");
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  return buildVerifiedUserFromToken(decoded);
}

export async function requireServerRole(
  request: Request,
  allowedRoles: Array<"admin" | "member">
): Promise<VerifiedServerUser> {
  const user = await requireServerUser(request);

  if (!user.active) {
    throw new ServerAuthError(403, "inactive_user", "User profile is inactive.");
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new ServerAuthError(403, "insufficient_role", "Insufficient permissions.");
  }

  return user;
}

export function serverAuthErrorResponse(error: unknown): Response {
  if (error instanceof ServerAuthError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error("Unexpected server auth error:", error);

  return Response.json(
    { error: "An unexpected server error occurred.", code: "internal_error" },
    { status: 500 }
  );
}
