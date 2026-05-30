# Login Troubleshooting — Cove Fire & Rescue

Use this checklist when members see login errors such as “invalid email or password” on production (Vercel).

## How login works

1. The browser calls Firebase Auth **Email/Password** via `signInWithEmailAndPassword`.
2. Email is trimmed; the password is sent unchanged.
3. Firebase Auth must succeed **before** the app loads the Firestore profile at `users/{uid}`.
4. A valid Auth user without a Firestore role document may sign in to Firebase but will not get member/admin access in the app.

## Checklist

### Firebase Console — Authentication

- [ ] **Email/Password** provider is enabled (Authentication → Sign-in method).
- [ ] The user exists under **Authentication → Users** (same email they use to log in).
- [ ] The account is not disabled.
- [ ] If unsure about the password, reset it in Firebase Console (Authentication → Users → reset password). Do not share passwords in chat or logs.

### Firebase project

- [ ] Production should use project **`covefireandrescue`**.
- [ ] On the login page, expand **Debug configuration** and confirm:
  - **Project ID:** `covefireandrescue`
  - **Auth Domain:** `covefireandrescue.firebaseapp.com`
- [ ] If these values differ, Vercel env vars point at the wrong Firebase project.

### Vercel environment variables

- [ ] All `NEXT_PUBLIC_FIREBASE_*` client vars match the **covefireandrescue** web app config (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) and [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)).
- [ ] Server-only Admin vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are set for Production (see [FIREBASE_ADMIN_ENV.md](./FIREBASE_ADMIN_ENV.md)).
- [ ] **Redeploy** after changing any environment variable (Vercel does not rebuild automatically).

### Health check

- [ ] `GET /api/health` returns:
  - `firebaseClientConfigured: true`
  - `firebaseAdminConfigured: true` (needed for protected API routes, not for the initial Auth sign-in)
- [ ] Response exposes booleans only — no secret values.

### Firestore user profile (after Auth succeeds)

- [ ] Document exists at `users/{uid}` with fields such as `role` (`admin` or `member`) and `active: true`.
- [ ] See [FIRST_ADMIN_SETUP.md](./FIRST_ADMIN_SETUP.md) for creating the first admin profile.

## Error messages

| Message | Likely cause |
|--------|----------------|
| “The email or password is incorrect, or this account does not exist in this Firebase project.” | Wrong credentials, user missing in **this** project, or wrong Firebase project in Vercel. |
| “No account exists for this email in this Firebase project.” | User not created in Firebase Auth for `covefireandrescue`. |
| “The password is incorrect.” | Password does not match (Firebase may also return `auth/invalid-credential` instead). |
| “Firebase Authentication is not fully configured…” | Email/Password sign-in not enabled in Firebase Console. |
| “Login failed. Check Firebase Auth setup and Vercel environment variables.” | Missing client config, network issue, or unmapped Auth error. |

**Important:** “Invalid email/password” style messages mean **Firebase Auth failed** — the app never reached the Firestore role check. Fix Auth and project config first.

## Local development

- Copy `.env.local.example` to `.env.local` with the same `covefireandrescue` web app keys.
- On the login page, **Debug configuration** shows Project ID, Auth Domain, and (in development) whether API key and App ID are present — never passwords or Admin secrets.

## Security notes

- Do not enable public signup; accounts are created manually by administrators.
- Do not log passwords, ID tokens, or Firebase Admin private keys.
- Do not commit `.env.local` or service account JSON files.
