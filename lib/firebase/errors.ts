const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential":
    "The email or password is incorrect, or this account does not exist in this Firebase project.",
  "auth/user-not-found": "No account exists for this email in this Firebase project.",
  "auth/wrong-password": "The password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/too-many-requests":
    "Too many failed attempts. Try again later or reset the password in Firebase.",
  "auth/network-request-failed":
    "Network error. Check connection and Firebase configuration.",
  "auth/configuration-not-found":
    "Firebase Authentication is not fully configured. Enable Email/Password sign-in in Firebase Console.",
  "auth/user-disabled": "This account has been disabled. Contact your administrator.",
};

const DEFAULT_AUTH_ERROR_MESSAGE =
  "Login failed. Check Firebase Auth setup and Vercel environment variables.";

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  if (error instanceof Error && error.message === "Firebase Auth is not configured.") {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

  return DEFAULT_AUTH_ERROR_MESSAGE;
}
