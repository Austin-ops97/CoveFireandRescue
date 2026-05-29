import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  AnnouncementValidationError,
  serializeAnnouncementDoc,
  sortAnnouncementsForDisplay,
  validateAnnouncementPayload,
} from "@/lib/announcements/server";
import type { AnnouncementFormState } from "@/lib/announcements/types";
import {
  requireServerRole,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type PostBody = AnnouncementFormState;

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

function actorDisplayName(actor: VerifiedServerUser): string | null {
  return actor.displayName ?? actor.email ?? null;
}

async function writeAnnouncementAudit(
  action:
    | "announcement.created"
    | "announcement.updated"
    | "announcement.published"
    | "announcement.archived",
  actor: VerifiedServerUser,
  targetId: string,
  message: string
): Promise<void> {
  await writeAuditLog({
    action,
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetType: "announcement",
    targetId,
    message,
  });
}

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const snapshot = await adminDb.collection(COLLECTIONS.announcements).limit(100).get();

    const announcements = sortAnnouncementsForDisplay(
      snapshot.docs.map((doc) => serializeAnnouncementDoc(doc))
    );

    return NextResponse.json({ announcements });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireServerRole(request, ["admin"]);

    let body: PostBody;
    try {
      body = (await request.json()) as PostBody;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateAnnouncementPayload(body);
    } catch (error) {
      if (error instanceof AnnouncementValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.announcements).doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return badRequest("Announcement not found.");
      }

      const previous = serializeAnnouncementDoc(existing);
      const previousStatus = previous.status;

      const writeData: Record<string, unknown> = {
        title: validated.title,
        body: validated.body,
        category: validated.category,
        status: validated.status,
        pinned: validated.pinned,
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: previous.createdBy,
        createdByName: previous.createdByName ?? null,
        imageFileIds: previous.imageFileIds,
      };

      const existingData = existing.data() ?? {};
      if (existingData.createdAt !== undefined) {
        writeData.createdAt = existingData.createdAt;
      }

      if (
        validated.status === "published" &&
        existingData.publishedAt === undefined &&
        previous.publishedAt === undefined
      ) {
        writeData.publishedAt = FieldValue.serverTimestamp();
      }

      await docRef.set(writeData, { merge: true });

      const saved = serializeAnnouncementDoc(await docRef.get());

      await writeAnnouncementAudit(
        "announcement.updated",
        actor,
        id,
        `Updated announcement "${saved.title}"`
      );

      if (previousStatus !== "published" && validated.status === "published") {
        await writeAnnouncementAudit(
          "announcement.published",
          actor,
          id,
          `Published announcement "${saved.title}"`
        );
      }

      if (previousStatus !== "archived" && validated.status === "archived") {
        await writeAnnouncementAudit(
          "announcement.archived",
          actor,
          id,
          `Archived announcement "${saved.title}"`
        );
      }

      return NextResponse.json({ announcement: saved });
    }

    const docRef = adminDb.collection(COLLECTIONS.announcements).doc();
    const writeData: Record<string, unknown> = {
      title: validated.title,
      body: validated.body,
      category: validated.category,
      status: validated.status,
      pinned: validated.pinned,
      imageFileIds: [],
      createdBy: actor.uid,
      createdByName: actorDisplayName(actor),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (validated.status === "published") {
      writeData.publishedAt = FieldValue.serverTimestamp();
    }

    await docRef.set(writeData);

    const saved = serializeAnnouncementDoc(await docRef.get());

    await writeAnnouncementAudit(
      "announcement.created",
      actor,
      saved.id,
      `Created announcement "${saved.title}"`
    );

    if (validated.status === "published") {
      await writeAnnouncementAudit(
        "announcement.published",
        actor,
        saved.id,
        `Published announcement "${saved.title}"`
      );
    }

    if (validated.status === "archived") {
      await writeAnnouncementAudit(
        "announcement.archived",
        actor,
        saved.id,
        `Archived announcement "${saved.title}"`
      );
    }

    return NextResponse.json({ announcement: saved }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}
