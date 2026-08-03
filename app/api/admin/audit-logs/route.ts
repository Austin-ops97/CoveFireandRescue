import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import type { AuditAction, AuditLogEntry } from "@/lib/audit/types";
import {
  requireServerRole,
  serverAuthErrorResponse,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";

const VISIBLE_AUDIT_ACTIONS: AuditAction[] = [
  "checklist.submission.created",
  "checklist.submission.deleted",
  "checklist.submission.restored",
  "checklist.submission.purged",
  "checklist.notification.acknowledged",
  "checklist.submission.review_acknowledged",
  "request_ticket.created",
  "request_ticket.updated",
];

function serializeTimestamp(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value ?? null;
}

function serializeAuditLogDoc(doc: DocumentSnapshot): AuditLogEntry {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    action: data.action as AuditAction,
    actorUid: typeof data.actorUid === "string" ? data.actorUid : "",
    actorRole: data.actorRole ?? "member",
    targetType: typeof data.targetType === "string" ? data.targetType : undefined,
    targetId: typeof data.targetId === "string" ? data.targetId : undefined,
    message: typeof data.message === "string" ? data.message : undefined,
    createdAt: serializeTimestamp(data.createdAt),
  };
}

function logTimestamp(value: unknown): number {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await requireServerRole(request, ["admin"]);

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType")?.trim();
    const targetId = searchParams.get("targetId")?.trim();
    const actionParam = searchParams.get("action")?.trim();
    const limitParam = searchParams.get("limit")?.trim();
    const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 500) : 200;

    const snapshot = await adminDb
      .collection(COLLECTIONS.auditLogs)
      .limit(500)
      .get();

    let logs = snapshot.docs.map((doc) => serializeAuditLogDoc(doc));

    logs = logs.filter((log) => VISIBLE_AUDIT_ACTIONS.includes(log.action));

    if (targetType) {
      logs = logs.filter((log) => log.targetType === targetType);
    }

    if (targetId) {
      logs = logs.filter((log) => log.targetId === targetId);
    }

    if (actionParam && VISIBLE_AUDIT_ACTIONS.includes(actionParam as AuditAction)) {
      logs = logs.filter((log) => log.action === actionParam);
    }

    logs.sort((a, b) => logTimestamp(b.createdAt) - logTimestamp(a.createdAt));

    return NextResponse.json({ logs: logs.slice(0, limit) });
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}
