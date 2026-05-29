"use client";

import { getFirebaseAuth, initFirebaseClient } from "@/lib/firebase/client";

export async function getFirebaseIdTokenForApi(): Promise<string> {
  initFirebaseClient();
  const currentUser = getFirebaseAuth().currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to call protected APIs.");
  }

  return currentUser.getIdToken();
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const idToken = await getFirebaseIdTokenForApi();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${idToken}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
