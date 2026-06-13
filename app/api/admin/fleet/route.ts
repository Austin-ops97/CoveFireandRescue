import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit/server";
import {
  FleetValidationError,
  attachFleetPrimaryImageUrls,
  serializeFleetDoc,
  sortFleetForAdmin,
  validateFleetPayload,
} from "@/lib/fleet/server";
import type { FleetUnitFormState } from "@/lib/fleet/types";
import {
  requireManageContent,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

type PostBody = FleetUnitFormState;

function badRequest(message: string): Response {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function writeFleetAudit(
  action: "fleet.created" | "fleet.updated" | "fleet.archived",
  actor: VerifiedServerUser,
  targetId: string,
  message: string
): Promise<void> {
  await writeAuditLog({
    action,
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetType: "fleet",
    targetId,
    message,
  });
}

export async function GET(request: Request) {
  try {
    await requireManageContent(request);

    const snapshot = await adminDb.collection(COLLECTIONS.fleet).limit(100).get();

    const fleet = sortFleetForAdmin(snapshot.docs.map((doc) => serializeFleetDoc(doc)));
    const withImages = await attachFleetPrimaryImageUrls(fleet);

    return NextResponse.json({ fleet: withImages });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireManageContent(request);

    let body: PostBody;
    try {
      body = (await request.json()) as PostBody;
    } catch {
      return badRequest("Invalid JSON body.");
    }

    let validated;
    try {
      validated = validateFleetPayload(body);
    } catch (error) {
      if (error instanceof FleetValidationError) {
        return badRequest(error.message);
      }
      throw error;
    }

    const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    if (id) {
      const docRef = adminDb.collection(COLLECTIONS.fleet).doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return badRequest("Fleet unit not found.");
      }

      const previous = serializeFleetDoc(existing);
      const existingData = existing.data() ?? {};

      const imageFileIds =
        validated.imageFileIds !== undefined ? validated.imageFileIds : previous.imageFileIds;

      const writeData: Record<string, unknown> = {
        name: validated.name,
        unitNumber: validated.unitNumber,
        type: validated.type,
        year: validated.year,
        manufacturer: validated.manufacturer,
        model: validated.model,
        pumpCapacityGpm: validated.pumpCapacityGpm,
        waterCapacityGallons: validated.waterCapacityGallons,
        equipmentNotes: validated.equipmentNotes,
        status: validated.status,
        active: validated.active,
        sortOrder: validated.sortOrder,
        imageFileIds,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (existingData.createdAt !== undefined) {
        writeData.createdAt = existingData.createdAt;
      }

      await docRef.set(writeData, { merge: true });

      const saved = serializeFleetDoc(await docRef.get());

      await writeFleetAudit(
        "fleet.updated",
        actor,
        id,
        `Updated fleet unit "${saved.name}"`
      );

      return NextResponse.json({ fleetUnit: saved });
    }

    const docRef = adminDb.collection(COLLECTIONS.fleet).doc();
    const writeData: Record<string, unknown> = {
      name: validated.name,
      unitNumber: validated.unitNumber,
      type: validated.type,
      year: validated.year,
      manufacturer: validated.manufacturer,
      model: validated.model,
      pumpCapacityGpm: validated.pumpCapacityGpm,
      waterCapacityGallons: validated.waterCapacityGallons,
      equipmentNotes: validated.equipmentNotes,
      status: validated.status,
      active: validated.active,
      sortOrder: validated.sortOrder,
      imageFileIds: validated.imageFileIds ?? [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.set(writeData);

    const saved = serializeFleetDoc(await docRef.get());

    await writeFleetAudit(
      "fleet.created",
      actor,
      saved.id,
      `Created fleet unit "${saved.name}"`
    );

    return NextResponse.json({ fleetUnit: saved }, { status: 201 });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}
