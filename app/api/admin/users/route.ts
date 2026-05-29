import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  requireServerRole,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type SafeUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "admin" | "member";
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
};

type CreateUserPayload = {
  uid?: unknown;
  email?: unknown;
  displayName?: unknown;
  role?: unknown;
  active?: unknown;
};

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function toSafeUserProfile(uid: string, data: Record<string, unknown>): SafeUserProfile {
  const role = data.role === "admin" || data.role === "member" ? data.role : "member";

  return {
    uid,
    email: typeof data.email === "string" ? data.email : null,
    displayName: typeof data.displayName === "string" ? data.displayName : null,
    role,
    active: data.active === true,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function normalizeOptionalString(
  value: unknown,
  fieldName: string
): { ok: true; value: string | null } | { ok: false; response: Response } {
  if (value === null || value === undefined) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      response: badRequest(`${fieldName} must be a string or null.`),
    };
  }

  const trimmed = value.trim();
  return { ok: true, value: trimmed === "" ? null : trimmed };
}

function parseCreateUserPayload(body: CreateUserPayload): SafeUserProfile | Response {
  if (typeof body.uid !== "string" || !body.uid.trim()) {
    return badRequest("uid is required.");
  }

  const emailResult = normalizeOptionalString(body.email, "email");
  if (!emailResult.ok) return emailResult.response;

  const displayNameResult = normalizeOptionalString(body.displayName, "displayName");
  if (!displayNameResult.ok) return displayNameResult.response;

  if (body.role !== "admin" && body.role !== "member") {
    return badRequest("role must be admin or member.");
  }

  if (typeof body.active !== "boolean") {
    return badRequest("active must be a boolean.");
  }

  return {
    uid: body.uid.trim(),
    email: emailResult.value,
    displayName: displayNameResult.value,
    role: body.role,
    active: body.active,
    createdAt: null,
    updatedAt: null,
  };
}

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb.collection(COLLECTIONS.users).limit(100).get();

    const users = snapshot.docs.map((doc) => toSafeUserProfile(doc.id, doc.data()));

    return NextResponse.json({ users });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor: VerifiedServerUser = await requireServerRole(request, ["admin"]);

    let body: CreateUserPayload;
    try {
      body = (await request.json()) as CreateUserPayload;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const parsed = parseCreateUserPayload(body);
    if (parsed instanceof Response) {
      return parsed;
    }

    const docRef = adminDb.collection(COLLECTIONS.users).doc(parsed.uid);
    const existing = await docRef.get();
    const isCreate = !existing.exists;

    const writeData: Record<string, unknown> = {
      uid: parsed.uid,
      email: parsed.email,
      displayName: parsed.displayName,
      role: parsed.role,
      active: parsed.active,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isCreate) {
      writeData.createdAt = FieldValue.serverTimestamp();
    } else {
      const existingCreatedAt = existing.data()?.createdAt;
      if (existingCreatedAt !== undefined) {
        writeData.createdAt = existingCreatedAt;
      } else {
        writeData.createdAt = FieldValue.serverTimestamp();
      }
    }

    await docRef.set(writeData, { merge: true });

    const saved = await docRef.get();
    const profile = toSafeUserProfile(parsed.uid, saved.data() ?? {});

    await writeAuditLog({
      action: isCreate ? "user.profile.created" : "user.profile.updated",
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetType: "user",
      targetId: parsed.uid,
      message: isCreate
        ? `Created user profile for ${parsed.uid}`
        : `Updated user profile for ${parsed.uid}`,
    });

    return NextResponse.json({ user: profile }, { status: isCreate ? 201 : 200 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}
