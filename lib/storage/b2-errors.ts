/** Whether a failed B2 delete is safe to ignore when removing Firestore metadata. */
export function shouldClearMetadataAfterB2DeleteFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Never drop metadata when credentials or permissions are wrong.
  if (
    message.includes("(401)") ||
    message.includes("(403)") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return false;
  }

  // Retryable / infrastructure failures should not remove metadata.
  if (
    message.includes("(429)") ||
    message.includes("(500)") ||
    message.includes("(502)") ||
    message.includes("(503)") ||
    message.includes("(504)") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout")
  ) {
    return false;
  }

  // Missing objects, stale file ids, or other client-side delete failures.
  if (message.includes("(400)") || message.includes("(404)")) {
    return true;
  }

  return (
    message.includes("file_not_present") ||
    message.includes("file_not_found") ||
    message.includes("not_found") ||
    message.includes("no_such") ||
    message.includes("not found") ||
    message.includes("does not exist") ||
    message.includes("bad_file_id") ||
    message.includes("bad_request")
  );
}
