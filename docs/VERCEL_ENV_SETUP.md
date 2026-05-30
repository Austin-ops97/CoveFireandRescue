# Vercel Environment Variables — Cove Fire & Rescue

Production and preview deployments use **Vercel Environment Variables** only. This project is configured for GitHub → Vercel deploys; every push creates a new live deployment.

Do **not** commit `.env.local`, `service-account.json`, or private keys. `.env.local.example` is a reference template for optional local development only.

## Where to add variables

1. Open [Vercel Dashboard](https://vercel.com/) → your project.
2. **Settings** → **Environment Variables**.
3. Add each variable below for **Production** (and **Preview** if you want preview deployments to work the same way).
4. **Redeploy** after saving changes (Deployments → … → Redeploy, or push a new commit).

## Firebase client (browser-safe)

These are public web app config values. Use the `NEXT_PUBLIC_` prefix so Next.js exposes them to the client.

| Variable | Example value (Cove project) |
|----------|------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCl1OU9aSIUPQkk8-Ix20zU-JH4lDOPGMs` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `covefireandrescue.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `covefireandrescue` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `covefireandrescue.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `580638538610` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:580638538610:web:3254302733693f0c7d3beb` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-YPEM0TGVTX` (optional but recommended) |

## Firebase Admin (server-only)

Never use `NEXT_PUBLIC_` for these. They are only read on the server (`lib/firebase/admin.ts`).

| Variable | Value |
|----------|--------|
| `FIREBASE_PROJECT_ID` | `covefireandrescue` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@covefireandrescue.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | PEM private key from service account JSON (see below) |

Generate the key once in **Firebase Console → Project Settings → Service Accounts → Generate New Private Key**. Copy fields from the downloaded JSON, then delete the JSON file from your machine or store it outside the repo.

### `FIREBASE_PRIVATE_KEY` format

1. Open the service account JSON and copy the `private_key` field value.
2. Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines.
3. Paste into Vercel as **one** environment variable named `FIREBASE_PRIVATE_KEY`.
4. If Vercel accepts a multi-line value directly, use it as-is.
5. If Admin auth fails after deploy, convert line breaks to escaped `\n` (single line), for example:

   ```
   -----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
   ```

The app normalizes escaped newlines with `replace(/\\n/g, "\n")` in `lib/firebase/admin.ts`.

Do **not** paste your real private key into git, docs, or chat.

## Backblaze B2 (server-only)

Required for file uploads. Add when B2 is ready (see [BACKBLAZE_B2_SETUP.md](./BACKBLAZE_B2_SETUP.md)).

| Variable | Description |
|----------|-------------|
| `B2_APPLICATION_KEY_ID` | Application key ID |
| `B2_APPLICATION_KEY` | Application key secret |
| `B2_BUCKET_ID` | Bucket ID |
| `B2_BUCKET_NAME` | Bucket name |
| `B2_ENDPOINT` | API endpoint (e.g. `https://api.backblazeb2.com`) |
| `B2_PUBLIC_BASE_URL` | Public URL base for browser-accessible files |

## Verify after deploy

### Public health check (no secrets)

```text
GET https://<your-domain>/api/health
```

Example response:

```json
{
  "ok": true,
  "service": "cove-fire-rescue",
  "firebaseClientConfigured": true,
  "firebaseAdminConfigured": true,
  "b2Configured": false
}
```

Only booleans are returned — never env values or secrets.

### Admin Firestore connectivity (authenticated)

Sign in as an admin in the app, then call with your Firebase ID token:

```text
GET https://<your-domain>/api/admin/connectivity
Authorization: Bearer <firebase-id-token>
```

Success:

```json
{
  "ok": true,
  "firebaseAdmin": true,
  "firestore": true
}
```

## Related docs

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) — Firebase Console checklist
- [FIREBASE_ADMIN_ENV.md](./FIREBASE_ADMIN_ENV.md) — Admin credentials and safety rules
- [BACKBLAZE_B2_SETUP.md](./BACKBLAZE_B2_SETUP.md) — B2 bucket and keys
