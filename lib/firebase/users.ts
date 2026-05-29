import { doc, getDoc, type Firestore } from "firebase/firestore";
import { userDocPath } from "@/lib/firestore/collections";
import type { UserProfile } from "@/lib/firebase/types";

export function userProfileRef(db: Firestore, uid: string) {
  return doc(db, userDocPath(uid));
}

export async function getUserProfile(
  db: Firestore,
  uid: string
): Promise<UserProfile | null> {
  const snapshot = await getDoc(userProfileRef(db, uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}
