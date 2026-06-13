import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import {
  cpanelEmailAccountExists,
  getCpanelEmailDomain,
} from "@/lib/cpanel/server";
import { buildDepartmentEmailAddress } from "@/lib/email-provisioning/usernames";
import {
  buildMemberEmailUsernameCandidates,
} from "@/lib/email-provisioning/usernames";
import { COLLECTIONS } from "@/lib/firestore/collections";

export async function isDepartmentEmailUsernameTaken(
  emailUsername: string
): Promise<boolean> {
  const domain = getCpanelEmailDomain();
  if (!domain) return true;

  const fullEmail = buildDepartmentEmailAddress(emailUsername, domain).toLowerCase();

  const checks = await Promise.all([
    adminDb
      .collection(COLLECTIONS.users)
      .where("departmentEmailUsername", "==", emailUsername)
      .limit(1)
      .get(),
    adminDb
      .collection(COLLECTIONS.users)
      .where("departmentEmail", "==", fullEmail)
      .limit(1)
      .get(),
    adminDb.collection(COLLECTIONS.users).where("email", "==", fullEmail).limit(1).get(),
    cpanelEmailAccountExists(emailUsername),
  ]);

  return checks.some((result) =>
    typeof result === "boolean" ? result : !result.empty
  );
}

export async function resolveAvailableMemberEmailUsername(
  firstName: string,
  lastName: string,
  requestedUsername: string,
  allowAutoResolve: boolean
): Promise<string | Error> {
  const candidates = buildMemberEmailUsernameCandidates(firstName, lastName);
  const normalizedRequested = requestedUsername.trim().toLowerCase();

  if (!candidates.includes(normalizedRequested)) {
    if (await isDepartmentEmailUsernameTaken(normalizedRequested)) {
      return new Error("That department email address is already in use.");
    }
    return normalizedRequested;
  }

  if (!allowAutoResolve) {
    if (await isDepartmentEmailUsernameTaken(normalizedRequested)) {
      return new Error("That department email address is already in use.");
    }
    return normalizedRequested;
  }

  const startIndex = Math.max(0, candidates.indexOf(normalizedRequested));
  for (let index = startIndex; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    if (!(await isDepartmentEmailUsernameTaken(candidate))) {
      return candidate;
    }
  }

  return new Error("Could not find an available department email address for this member.");
}

export async function findFirstAvailableMemberEmailUsername(
  firstName: string,
  lastName: string
): Promise<string | null> {
  const candidates = buildMemberEmailUsernameCandidates(firstName, lastName);
  for (const candidate of candidates) {
    if (!(await isDepartmentEmailUsernameTaken(candidate))) {
      return candidate;
    }
  }
  return null;
}
