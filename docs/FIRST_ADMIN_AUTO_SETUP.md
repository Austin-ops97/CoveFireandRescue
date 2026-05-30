# First Admin Auto Setup (Temporary Bootstrap)

Use this flow when Firebase Authentication works but Firestore has no matching `users/{uid}` profile yet — for example, when the dashboard shows:

> Access pending. Your Firebase account is signed in, but no Cove Fire & Rescue member profile was found.

This is a **temporary bootstrap** path. It creates the first active admin profile for the currently signed-in Firebase Auth user. It is **not** public signup.

## Prerequisites

- Firebase client keys in `.env.local` (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- Firebase Admin service account keys in `.env.local` for server API routes (see [FIREBASE_ADMIN_ENV.md](./FIREBASE_ADMIN_ENV.md))
- A Firebase Auth user already created (Console or your existing auth flow)
- **No active admin** in Firestore yet (`role: "admin"` and `active: true`)

## Steps

1. Sign in at `/login` with your Firebase Auth email and password.
2. Visit [`/setup/first-admin`](/setup/first-admin).
3. Confirm the signed-in email is correct.
4. Click **Create First Admin Profile**.
5. On success, open [`/dashboard`](/dashboard).

The API creates `users/{uid}` for your verified Firebase Auth UID with:

| Field         | Value                          |
|---------------|--------------------------------|
| `uid`         | From verified ID token         |
| `email`       | From token (or `null`)         |
| `displayName` | Token name, email, or fallback |
| `role`        | `admin`                        |
| `active`      | `true`                         |
| `createdAt`   | Server timestamp               |
| `updatedAt`   | Server timestamp               |

An audit log entry (`user.profile.created`) is written when the audit helper is available.

## Safety behavior

- **POST only** — `GET`, `PUT`, `PATCH`, and `DELETE` return `405`.
- **Token required** — `Authorization: Bearer <Firebase ID token>` must be valid.
- **UID from token only** — the client cannot supply a UID in the request body.
- **One-time gate** — if any user already has `role: "admin"` and `active: true`, the route returns `403`:
  > First admin already exists. This setup route is disabled.
- **No secrets exposed** — server uses Firebase Admin env vars only on the server.

## After bootstrap

- Additional users should be managed from the admin **User Access** page at `/dashboard/users`, or manually in Firestore.
- Remove `/setup/first-admin` and `/api/setup/first-admin` before production handoff if you no longer need the bootstrap path.
- See also [FIRST_ADMIN_SETUP.md](./FIRST_ADMIN_SETUP.md) for manual Console setup.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Authentication required` | Not signed in, or missing Bearer token |
| `Invalid or expired authentication token` | Sign out and sign in again |
| `First admin already exists…` | Bootstrap already completed; use `/dashboard` or ask an admin to create your profile |
| `500` / server error | Check Firebase Admin env vars and server logs |
