import { doc, getDoc, type Firestore } from "firebase/firestore";
import { COLLECTIONS, userDocPath } from "@/lib/firestore/collections";
import type { UserProfile } from "@/lib/firebase/types";

export function userProfileRef(db: Firestore, uid: string) {
  return doc(db, userDocPath(uid));
}

export async function getUserProfile(
  db: Firestore,
  uid: string,
  debugContext?: { email?: string | null }
): Promise<UserProfile | null> {
  const path = userDocPath(uid);
  console.info("[auth/profile] lookup start", {
    firebaseAuthUid: uid,
    firebaseAuthEmail: debugContext?.email ?? null,
    firestoreCollection: COLLECTIONS.users,
    firestoreDocumentPath: path,
  });

  const snapshot = await getDoc(userProfileRef(db, uid));
  const profileData = snapshot.exists() ? (snapshot.data() as UserProfile) : null;

  console.info("[auth/profile] lookup result", {
    firebaseAuthUid: uid,
    firebaseAuthEmail: debugContext?.email ?? null,
    firestoreCollection: COLLECTIONS.users,
    firestoreDocumentPath: path,
    documentExists: snapshot.exists(),
    profileData,
  });

  if (!profileData) return null;
  return profileData;
}
