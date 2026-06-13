import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  requireDashboardAccess,
  serverAuthErrorResponse,
  type VerifiedServerUser,
} from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import { serializeAnnouncementDoc } from "@/lib/announcements/server";
import {
  serializeChecklistSubmissionDoc,
  serializeChecklistTemplateDoc,
  sortSubmissionsNewestFirst,
  submissionHasAttentionItems,
} from "@/lib/checklist/server";
import type { ChecklistTemplateRecord } from "@/lib/checklist/types";
import {
  toDashboardRecentSubmission,
  type DashboardSummary,
  type DashboardSummaryAdmin,
  type DashboardSummaryMember,
} from "@/lib/dashboard/types";
import { serializeEquipmentDoc } from "@/lib/equipment/server";
import { serializeFleetDoc } from "@/lib/fleet/server";
import { serializeLeadershipDoc } from "@/lib/leadership/server";
import { listStoredFilesByModule } from "@/lib/storage/server";

const RECENT_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const RECENT_LIST_LIMIT = 5;

function submissionTimestamp(value: unknown): number {
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

function buildTemplateMap(docs: QueryDocumentSnapshot[]): Map<string, ChecklistTemplateRecord> {
  const map = new Map<string, ChecklistTemplateRecord>();
  for (const doc of docs) {
    const template = serializeChecklistTemplateDoc(doc);
    map.set(template.id, template);
  }
  return map;
}

async function buildAdminSummary(): Promise<DashboardSummaryAdmin> {
  const [
    fleetSnapshot,
    announcementSnapshot,
    leadershipSnapshot,
    templateSnapshot,
    submissionSnapshot,
    trainingSnapshot,
    equipmentSnapshot,
    documentFiles,
  ] = await Promise.all([
    adminDb.collection(COLLECTIONS.fleet).limit(200).get(),
    adminDb.collection(COLLECTIONS.announcements).limit(200).get(),
    adminDb.collection(COLLECTIONS.leadership).limit(200).get(),
    adminDb.collection(COLLECTIONS.checklistTemplates).limit(200).get(),
    adminDb.collection(COLLECTIONS.checklistSubmissions).limit(300).get(),
    adminDb.collection(COLLECTIONS.trainingRecords).limit(300).get(),
    adminDb.collection(COLLECTIONS.equipment).limit(300).get(),
    listStoredFilesByModule("documents"),
  ]);

  const fleetCount = fleetSnapshot.docs
    .map((doc) => serializeFleetDoc(doc))
    .filter((item) => item.status === "active" && item.active).length;

  const announcementCount = announcementSnapshot.docs
    .map((doc) => serializeAnnouncementDoc(doc))
    .filter((item) => item.status === "published").length;

  const leadershipCount = leadershipSnapshot.docs
    .map((doc) => serializeLeadershipDoc(doc))
    .filter((item) => item.status === "active" && item.active).length;

  const checklistTemplateCount = templateSnapshot.docs
    .map((doc) => serializeChecklistTemplateDoc(doc))
    .filter((item) => item.active).length;

  const templateMap = buildTemplateMap(templateSnapshot.docs);
  const submissions = sortSubmissionsNewestFirst(
    submissionSnapshot.docs
      .map((doc) => serializeChecklistSubmissionDoc(doc))
      .filter((item) => !item.isDeleted)
  );

  const recentCutoff = Date.now() - RECENT_DAYS_MS;
  const recentSubmissions = submissions.filter(
    (item) => submissionTimestamp(item.submittedAt) >= recentCutoff
  );

  const failedSubmissions = submissions.filter((item) =>
    submissionHasAttentionItems(item, templateMap.get(item.templateId))
  );

  const trainingRecordCount = trainingSnapshot.docs.length;
  const equipmentCount = equipmentSnapshot.docs
    .map((doc) => serializeEquipmentDoc(doc))
    .filter((item) => item.status !== "retired").length;

  return {
    role: "admin",
    fleetCount,
    announcementCount,
    leadershipCount,
    checklistTemplateCount,
    recentSubmissionCount: recentSubmissions.length,
    failedSubmissionCount: failedSubmissions.length,
    documentCount: documentFiles.length,
    trainingRecordCount,
    equipmentCount,
    recentSubmissions: submissions.slice(0, RECENT_LIST_LIMIT).map((item) =>
      toDashboardRecentSubmission(
        item,
        submissionHasAttentionItems(item, templateMap.get(item.templateId))
      )
    ),
  };
}

async function buildMemberSummary(user: VerifiedServerUser): Promise<DashboardSummaryMember> {
  const [templateSnapshot, submissionSnapshot] = await Promise.all([
    adminDb
      .collection(COLLECTIONS.checklistTemplates)
      .where("active", "==", true)
      .where("reusable", "==", true)
      .limit(100)
      .get(),
    adminDb.collection(COLLECTIONS.checklistSubmissions).limit(300).get(),
  ]);

  const templateMap = buildTemplateMap(templateSnapshot.docs);
  const availableTemplateCount = templateMap.size;

  const mySubmissions = sortSubmissionsNewestFirst(
    submissionSnapshot.docs
      .map((doc) => serializeChecklistSubmissionDoc(doc))
      .filter((item) => item.submittedBy === user.uid && !item.isDeleted)
  );

  const recentCutoff = Date.now() - RECENT_DAYS_MS;
  const myRecentSubmissions = mySubmissions.filter(
    (item) => submissionTimestamp(item.submittedAt) >= recentCutoff
  );

  const myFailedSubmissions = mySubmissions.filter((item) =>
    submissionHasAttentionItems(item, templateMap.get(item.templateId))
  );

  return {
    role: "member",
    availableTemplateCount,
    myRecentSubmissionCount: myRecentSubmissions.length,
    myFailedSubmissionCount: myFailedSubmissions.length,
    recentSubmissions: mySubmissions.slice(0, RECENT_LIST_LIMIT).map((item) =>
      toDashboardRecentSubmission(
        item,
        submissionHasAttentionItems(item, templateMap.get(item.templateId))
      )
    ),
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireDashboardAccess(request);

    const summary: DashboardSummary =
      user.role === "admin"
        ? await buildAdminSummary()
        : await buildMemberSummary(user);

    return NextResponse.json(summary);
  } catch (error) {
    return serverAuthErrorResponse(error);
  }
}
