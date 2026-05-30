# Firebase Admin Environment Variables

Cove Fire & Rescue uses the Firebase Admin SDK on the server only (API routes, server helpers). Admin credentials must **never** appear in client code, git, or the browser.

## Production: Vercel (primary)

This project is deployed via **GitHub → Vercel**. Set all variables in:

**Vercel → Project → Settings → Environment Variables**

See **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** for the full list, example client values, and step-by-step instructions.

Server-only Admin variables:

| Name                   | Value                                      |
|------------------------|--------------------------------------------|
| `FIREBASE_PROJECT_ID`  | `covefireandrescue`                        |
| `FIREBASE_CLIENT_EMAIL`| `firebase-adminsdk-fbsvc@covefireandrescue.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | PEM from service account JSON (see below)  |

Redeploy after changing environment variables.

## Optional local development

Copy `.env.local.example` to `.env.local` (gitignored) only if you run the app locally. Production does **not** use `.env.local`.

```env
FIREBASE_PROJECT_ID=covefireandrescue
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@covefireandrescue.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="PASTE_PRIVATE_KEY_HERE_WITH_ESCAPED_NEWLINES"
```

Generate the private key from:

**Firebase Console → Project Settings → Service Accounts → Generate New Private Key**

Download the JSON once, copy the three fields above, then **delete the JSON file** from your machine or store it outside the repo. Do **not** commit `service-account.json` or any `*.service-account.json` file.

## Private key format

`FIREBASE_PRIVATE_KEY` must include the PEM markers:

```
-----BEGIN PRIVATE KEY-----
...key body...
-----END PRIVATE KEY-----
```

On Vercel:

- Paste as a single environment variable.
- If multi-line paste works in the Vercel UI, use it as-is.
- If Admin auth fails after deploy, convert line breaks to `\n` on one line.

In `.env.local` (local only), escaped newlines inside double quotes are common:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

The app converts `\n` back to newlines in `lib/firebase/admin.ts` via `replace(/\\n/g, "\n")`.

Do **not** include your real private key in documentation or git.

## Safety rules

- Do **not** hardcode `FIREBASE_PRIVATE_KEY` in source code.
- Do **not** commit `.env.local`.
- Do **not** place `service-account.json` in the repository.
- Do **not** use the `NEXT_PUBLIC_` prefix for Admin credentials.
- Admin modules import `"server-only"` and are only used from server code.

## Verify deployment

After Vercel env vars are set and the app is redeployed:

1. `GET /api/health` — confirms `firebaseAdminConfigured: true` (booleans only).
2. `GET /api/admin/connectivity` with an admin Bearer token — confirms Firestore access.

Optional locally: `npm run check:env` (never prints secret values).

See also [FIREBASE_SETUP.md](./FIREBASE_SETUP.md), [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md), and [FIRST_ADMIN_SETUP.md](./FIRST_ADMIN_SETUP.md).
