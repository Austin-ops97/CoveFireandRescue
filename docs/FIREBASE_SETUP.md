# Firebase Setup — Cove Fire & Rescue

Project: **CoveFireandRescue** (`covefireandrescue`)

This app uses:

- **Firebase Auth** — member login (Email/Password)
- **Firestore** — structured app data (users, roles, content metadata)
- **Firebase Admin SDK** — server-side ID token verification for `/api/*` routes
- **Backblaze B2** — file and image uploads (not Firebase Storage)

## Production: Vercel environment variables

Deployments use **Vercel Environment Variables** (GitHub → Vercel). Do not rely on `.env.local` in production.

Full instructions: **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)**

After deploy, check `GET /api/health` for `firebaseClientConfigured` and `firebaseAdminConfigured` (booleans only).

## Optional local development

Copy `.env.local.example` to `.env.local` only if you run the app on your machine (never commit `.env.local`).

### Client config (browser-safe)

These values come from Firebase Console → Project settings → Your apps → Web app config.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCl1OU9aSIUPQkk8-Ix20zU-JH4lDOPGMs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=covefireandrescue.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=covefireandrescue
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=covefireandrescue.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=580638538610
NEXT_PUBLIC_FIREBASE_APP_ID=1:580638538610:web:3254302733693f0c7d3beb
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YPEM0TGVTX
```

`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is optional. Auth and Firestore work without it; when set, Analytics initializes in the browser only.

### Server config (secrets — never use `NEXT_PUBLIC_`)

Generate a service account key from:

**Firebase Console → Project Settings → Service Accounts → Generate New Private Key**

Map the JSON fields to:

```env
FIREBASE_PROJECT_ID=project_id
FIREBASE_CLIENT_EMAIL=client_email
FIREBASE_PRIVATE_KEY=private_key
```

On Vercel, set `FIREBASE_PRIVATE_KEY` in **Settings → Environment Variables** (multi-line or `\n`-escaped — see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)).

Do **not** commit `FIREBASE_PRIVATE_KEY` or paste it into source code.

## Firebase Console checklist

Complete these steps in [Firebase Console](https://console.firebase.google.com/) for project `covefireandrescue`:

- [ ] **Enable Authentication**
- [ ] **Enable Email/Password** sign-in provider
- [ ] **Create Firestore database** (production or test mode per your rollout plan)
- [ ] **Create first admin user** in Firebase Authentication (Email/Password)
- [ ] **Copy the Firebase Auth UID** from the new user’s details
- [ ] **Create Firestore collection** `users`
- [ ] **Create document** with ID equal to that UID
- [ ] **Add fields:**

| Field         | Type      | Value                     |
|---------------|-----------|---------------------------|
| `uid`         | string    | Same UID as document ID   |
| `email`       | string    | Admin email address       |
| `displayName` | string    | Admin display name        |
| `role`        | string    | `admin`                   |
| `active`      | boolean   | `true`                    |
| `createdAt`   | timestamp | Server timestamp (or now) |
| `updatedAt`   | timestamp | Server timestamp (or now) |

- [ ] **Generate service account private key** and add Admin env vars in Vercel (see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md))
- [ ] **Deploy Firestore security rules** (see `firestore.rules.example`)

After setup, sign in at `/login` and confirm `/dashboard` and admin routes work.

See also [FIRST_ADMIN_SETUP.md](./FIRST_ADMIN_SETUP.md) for role and access notes.

## Architecture notes

| Layer              | Module                         | Purpose                          |
|--------------------|----------------------------------|----------------------------------|
| Client             | `lib/firebase/client.ts`         | Auth + Firestore in browser      |
| Client config      | `lib/firebase/config.ts`         | `NEXT_PUBLIC_FIREBASE_*` env vars |
| Server             | `lib/firebase/admin.ts`          | Lazy Admin Auth + Firestore      |
| Auth context       | `components/providers/AuthProvider.tsx` | Login state + profile     |
| Route protection   | `components/auth/RequireAuth.tsx` | Dashboard access gates      |
| API verification   | `lib/auth/server.ts`             | Bearer token + Firestore roles   |
| File uploads       | `lib/storage/*`                  | Backblaze B2 only                |

Firebase Storage is **not** used for uploads in this project.

## Verification

After setting Vercel env vars and redeploying:

- `GET /api/health` — client/admin/B2 configured flags (no secrets)
- `GET /api/admin/connectivity` — admin Bearer token; confirms Firestore (see [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md))

For local changes only:

```bash
npm run typecheck
npm run lint
npm run build
```
