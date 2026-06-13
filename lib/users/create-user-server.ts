import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { VerifiedServerUser } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  CpanelError,
  buildDepartmentEmailAddress,
  cpanelAddEmailPop,
  isCpanelConfigured,
} from "@/lib/cpanel/server";
import {
  isDepartmentEmailUsernameTaken,
  resolveAvailableMemberEmailUsername,
} from "@/lib/email-provisioning/availability";
import {
  writeDepartmentEmailAudit,
  writeEmailCreationFailedAudit,
  writePortalUserCreatedAudit,
  writePortalUserCreationFailedAudit,
} from "@/lib/email-provisioning/audit";
import type { CreatePortalUserInput } from "@/lib/email-provisioning/validation";
import { usernameSupportsAutoResolve } from "@/lib/email-provisioning/validation";
import { COLLECTIONS } from "@/lib/firestore/collections";
import {
  UserAdminError,
  createFirebaseAuthUserWithEmail,
  getAuthLastSignIn,
} from "@/lib/users/admin-server";
import { buildDisplayName, toManagedUserProfile } from "@/lib/users/profile";
import type { ManagedUserProfile } from "@/lib/users/types";

export class CreateUserError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CreateUserError";
    this.status = status;
    this.code = code;
  }
}

function pendingUserDocId(): string {
  return `pending_${adminDb.collection(COLLECTIONS.users).doc().id}`;
}

export async function createPortalUserWithDepartmentEmail(
  input: CreatePortalUserInput,
  actor: VerifiedServerUser
): Promise<{ user: ManagedUserProfile; message: string; departmentEmail: string }> {
  if (!isCpanelConfigured()) {
    throw new CreateUserError(
      503,
      "cpanel_not_configured",
      "Department email provisioning is not configured on this server."
    );
  }

  if (input.accountType === "alias") {
    return createAliasMailbox(input, actor);
  }

  return createMemberAccount(input, actor);
}

async function createMemberAccount(
  input: Extract<CreatePortalUserInput, { accountType: "member" }>,
  actor: VerifiedServerUser
): Promise<{ user: ManagedUserProfile; message: string; departmentEmail: string }> {
  const allowAutoResolve = usernameSupportsAutoResolve(
    input.firstName,
    input.lastName,
    input.departmentEmailUsername
  );

  const resolvedUsername = await resolveAvailableMemberEmailUsername(
    input.firstName,
    input.lastName,
    input.departmentEmailUsername,
    allowAutoResolve
  );

  if (resolvedUsername instanceof Error) {
    throw new CreateUserError(409, "email_unavailable", resolvedUsername.message);
  }

  const departmentEmail = buildDepartmentEmailAddress(resolvedUsername);
  const displayName = buildDisplayName(input.firstName, input.lastName);

  try {
    await cpanelAddEmailPop(resolvedUsername, input.password, input.quotaMb);
  } catch (error) {
    const errorSummary =
      error instanceof CpanelError
        ? error.message
        : "Department email could not be created. Please try again later.";

    await writeEmailCreationFailedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: actor.uid,
      emailAddress: departmentEmail,
      errorSummary,
    });

    if (error instanceof CpanelError) {
      throw new CreateUserError(error.status, error.code, error.message);
    }

    throw new CreateUserError(502, "email_creation_failed", errorSummary);
  }

  await writeDepartmentEmailAudit({
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetUserId: actor.uid,
    emailAddress: departmentEmail,
    result: "success",
  });

  try {
    const authUser = await createFirebaseAuthUserWithEmail({
      email: departmentEmail,
      password: input.password,
      displayName,
      active: input.active,
    });

    const profileData: Record<string, unknown> = {
      uid: authUser.uid,
      email: departmentEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName,
      phone: null,
      title: null,
      role: input.role,
      active: input.active,
      createdBy: actor.uid,
      departmentEmail,
      departmentEmailUsername: resolvedUsername,
      emailProvisioningStatus: "provisioned",
      emailProvisioningError: null,
      authProvisioningStatus: "active",
      authProvisioningError: null,
      isDepartmentAlias: false,
      isPendingAuth: false,
      departmentEmailQuotaMb: input.quotaMb,
      departmentEmailProvisionedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection(COLLECTIONS.users).doc(authUser.uid).set(profileData);

    await writePortalUserCreatedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: authUser.uid,
      emailAddress: departmentEmail,
      result: "success",
    });

    const lastLoginAt = await getAuthLastSignIn(authUser.uid);
    const saved = await adminDb.collection(COLLECTIONS.users).doc(authUser.uid).get();

    return {
      user: toManagedUserProfile(authUser.uid, saved.data() ?? {}, lastLoginAt),
      message: "User created and department email provisioned successfully.",
      departmentEmail,
    };
  } catch (error) {
    const errorSummary =
      error instanceof UserAdminError
        ? error.message
        : "Portal account could not be created. The department mailbox was preserved.";

    const pendingId = pendingUserDocId();
    await adminDb
      .collection(COLLECTIONS.users)
      .doc(pendingId)
      .set({
        uid: pendingId,
        email: null,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        phone: null,
        title: null,
        role: input.role,
        active: input.active,
        createdBy: actor.uid,
        departmentEmail,
        departmentEmailUsername: resolvedUsername,
        emailProvisioningStatus: "provisioned",
        emailProvisioningError: null,
        authProvisioningStatus: "failed",
        authProvisioningError: errorSummary,
        isDepartmentAlias: false,
        isPendingAuth: true,
        departmentEmailQuotaMb: input.quotaMb,
        departmentEmailProvisionedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await writePortalUserCreationFailedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: pendingId,
      emailAddress: departmentEmail,
      errorSummary,
    });

    const saved = await adminDb.collection(COLLECTIONS.users).doc(pendingId).get();

    return {
      user: toManagedUserProfile(pendingId, saved.data() ?? {}, null),
      message:
        "Department email was created, but portal setup is incomplete. Retry portal setup from the user profile.",
      departmentEmail,
    };
  }
}

async function createAliasMailbox(
  input: Extract<CreatePortalUserInput, { accountType: "alias" }>,
  actor: VerifiedServerUser
): Promise<{ user: ManagedUserProfile; message: string; departmentEmail: string }> {
  if (await isDepartmentEmailUsernameTaken(input.aliasUsername)) {
    throw new CreateUserError(
      409,
      "email_unavailable",
      "That department alias address is already in use."
    );
  }

  const departmentEmail = buildDepartmentEmailAddress(input.aliasUsername);

  try {
    await cpanelAddEmailPop(input.aliasUsername, input.password, input.quotaMb);
  } catch (error) {
    const errorSummary =
      error instanceof CpanelError
        ? error.message
        : "Department alias email could not be created. Please try again later.";

    await writeEmailCreationFailedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: actor.uid,
      emailAddress: departmentEmail,
      errorSummary,
    });

    if (error instanceof CpanelError) {
      throw new CreateUserError(error.status, error.code, error.message);
    }

    throw new CreateUserError(502, "email_creation_failed", errorSummary);
  }

  const aliasId = `alias_${input.aliasUsername}`;
  await adminDb
    .collection(COLLECTIONS.users)
    .doc(aliasId)
    .set({
      uid: aliasId,
      email: null,
      firstName: null,
      lastName: null,
      displayName: input.displayName,
      phone: null,
      title: null,
      role: "member",
      active: true,
      createdBy: actor.uid,
      departmentEmail,
      departmentEmailUsername: input.aliasUsername,
      emailProvisioningStatus: "provisioned",
      emailProvisioningError: null,
      authProvisioningStatus: "none",
      authProvisioningError: null,
      isDepartmentAlias: true,
      isPendingAuth: false,
      departmentEmailQuotaMb: input.quotaMb,
      departmentEmailProvisionedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  await writeDepartmentEmailAudit({
    actorUid: actor.uid,
    actorRole: actor.role!,
    targetUserId: aliasId,
    emailAddress: departmentEmail,
    result: "success",
  });

  const saved = await adminDb.collection(COLLECTIONS.users).doc(aliasId).get();

  return {
    user: toManagedUserProfile(aliasId, saved.data() ?? {}, null),
    message: "Department alias email created successfully.",
    departmentEmail,
  };
}

export async function retryPendingPortalUserCreation(
  pendingUid: string,
  password: string,
  actor: VerifiedServerUser
): Promise<{ user: ManagedUserProfile; message: string }> {
  const docRef = adminDb.collection(COLLECTIONS.users).doc(pendingUid);
  const existing = await docRef.get();

  if (!existing.exists) {
    throw new CreateUserError(404, "user_not_found", "User profile not found.");
  }

  const data = existing.data() ?? {};
  if (data.isPendingAuth !== true || data.authProvisioningStatus !== "failed") {
    throw new CreateUserError(
      400,
      "retry_not_allowed",
      "This user is not eligible for portal setup retry."
    );
  }

  const departmentEmail =
    typeof data.departmentEmail === "string" ? data.departmentEmail : null;
  const firstName = typeof data.firstName === "string" ? data.firstName : null;
  const lastName = typeof data.lastName === "string" ? data.lastName : null;
  const displayName =
    typeof data.displayName === "string"
      ? data.displayName
      : buildDisplayName(firstName, lastName);
  const role = data.role;
  const active = data.active === true;

  if (!departmentEmail || !firstName || !lastName) {
    throw new CreateUserError(
      400,
      "invalid_pending_profile",
      "Pending user profile is incomplete."
    );
  }

  if (role !== "admin" && role !== "editor" && role !== "viewer" && role !== "member") {
    throw new CreateUserError(400, "invalid_pending_profile", "Pending user role is invalid.");
  }

  try {
    const authUser = await createFirebaseAuthUserWithEmail({
      email: departmentEmail,
      password,
      displayName,
      active,
    });

    const profileData: Record<string, unknown> = {
      uid: authUser.uid,
      email: departmentEmail,
      firstName,
      lastName,
      displayName,
      phone: data.phone ?? null,
      title: data.title ?? null,
      role,
      active,
      createdBy: data.createdBy ?? actor.uid,
      departmentEmail,
      departmentEmailUsername: data.departmentEmailUsername ?? null,
      emailProvisioningStatus: data.emailProvisioningStatus ?? "provisioned",
      emailProvisioningError: null,
      authProvisioningStatus: "active",
      authProvisioningError: null,
      isDepartmentAlias: false,
      isPendingAuth: false,
      departmentEmailQuotaMb: data.departmentEmailQuotaMb ?? null,
      departmentEmailProvisionedAt: data.departmentEmailProvisionedAt ?? null,
      createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection(COLLECTIONS.users).doc(authUser.uid).set(profileData);
    await docRef.delete();

    await writePortalUserCreatedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: authUser.uid,
      emailAddress: departmentEmail,
      result: "success",
    });

    const lastLoginAt = await getAuthLastSignIn(authUser.uid);
    const saved = await adminDb.collection(COLLECTIONS.users).doc(authUser.uid).get();

    return {
      user: toManagedUserProfile(authUser.uid, saved.data() ?? {}, lastLoginAt),
      message: "Portal account created successfully.",
    };
  } catch (error) {
    const errorSummary =
      error instanceof UserAdminError
        ? error.message
        : "Portal account could not be created. Please try again later.";

    await docRef.update({
      authProvisioningStatus: "failed",
      authProvisioningError: errorSummary,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writePortalUserCreationFailedAudit({
      actorUid: actor.uid,
      actorRole: actor.role!,
      targetUserId: pendingUid,
      emailAddress: departmentEmail,
      errorSummary,
    });

    if (error instanceof UserAdminError) {
      throw new CreateUserError(error.status, error.code, errorSummary);
    }

    throw new CreateUserError(502, "portal_user_creation_failed", errorSummary);
  }
}

export function mapCreateUserError(error: unknown): Response | null {
  if (!(error instanceof CreateUserError)) return null;
  return Response.json({ error: error.message, code: error.code }, { status: error.status });
}
