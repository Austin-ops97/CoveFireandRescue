# First Admin Setup

Cove Fire & Rescue uses Firebase Authentication for sign-in and Firestore `users/{uid}` documents for roles and active status. The first administrator must be created manually.

## Steps

1. Open the [Firebase Console](https://console.firebase.google.com/) for your project.
2. Go to **Build → Authentication**.
3. Click **Add user** and create the first account with **Email/Password**.
4. Open the new user’s details and copy the **User UID**.
5. Go to **Build → Firestore Database**.
6. Create a collection named `users` (if it does not exist).
7. Add a document with **Document ID** equal to the Firebase Auth UID you copied.
8. Add these fields:

| Field         | Type      | Value                          |
|---------------|-----------|--------------------------------|
| `uid`         | string    | Same UID as document ID        |
| `email`       | string    | Admin email address            |
| `displayName` | string    | Admin display name             |
| `role`        | string    | `admin`                        |
| `active`      | boolean   | `true`                         |
| `createdAt`   | timestamp | Server timestamp (or now)      |
| `updatedAt`   | timestamp | Server timestamp (or now)      |

9. Visit `/login` on the site and sign in with the email and password you created.
10. Confirm you can open `/dashboard` and the admin-only **User Access** page at `/dashboard/users`.

## Role and access notes

- **Members** should use `role: "member"` and `active: true` to access member dashboard features.
- **Inactive** users should have `active: false`. They can still sign in to Firebase Auth, but the app and server APIs will deny dashboard and protected API access.
- Only assign `role: "admin"` to personnel who should manage users, announcements, fleet, leadership, and other admin tools.
- Never rely on client-supplied role or `active` values. Server API routes read roles from Firestore via the Firebase Admin SDK.

## Service account for server APIs

For `/api/*` routes that verify ID tokens, add these **server-only** variables to `.env.local` and Vercel (not `NEXT_PUBLIC_`):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Generate them from **Project settings → Service accounts → Generate new private key** in Firebase Console.

On Vercel, set `FIREBASE_PRIVATE_KEY` with escaped newlines:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
