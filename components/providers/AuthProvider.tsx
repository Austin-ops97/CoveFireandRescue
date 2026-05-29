"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserRole } from "@/lib/auth/roles";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { auth, getFirebaseDb, initFirebaseClient } from "@/lib/firebase/client";
import { getUserProfile } from "@/lib/firebase/users";
import type { UserProfile } from "@/lib/firebase/types";

export type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isMember: boolean;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolveRole(profile: UserProfile | null): UserRole | null {
  if (!profile) return null;
  if (profile.role === "admin" || profile.role === "member") {
    return profile.role;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const role = useMemo(() => resolveRole(profile), [profile]);
  const isAdmin = role === "admin" && profile?.active === true;
  const isMember =
    profile?.active === true && (role === "member" || role === "admin");

  const refreshProfile = useCallback(async () => {
    if (!user || !configured) {
      setProfile(null);
      return;
    }

    const db = getFirebaseDb();
    const nextProfile = await getUserProfile(db, user.uid);
    setProfile(nextProfile);
  }, [user, configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const ready = initFirebaseClient();
    if (!ready) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const db = getFirebaseDb();
        const existing = await getUserProfile(db, nextUser.uid);
        if (!cancelled) {
          setProfile(existing);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configured]);

  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        throw new Error("Firebase Auth is not configured.");
      }
      initFirebaseClient();
      await signInWithEmailAndPassword(auth, email, password);
    },
    [configured]
  );

  const signOutUser = useCallback(async () => {
    if (!configured) return;
    initFirebaseClient();
    await firebaseSignOut(auth);
    setProfile(null);
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user,
      profile,
      role,
      isAdmin,
      isMember,
      signInWithEmailPassword,
      signOutUser,
      refreshProfile,
    }),
    [
      configured,
      loading,
      user,
      profile,
      role,
      isAdmin,
      isMember,
      signInWithEmailPassword,
      signOutUser,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
