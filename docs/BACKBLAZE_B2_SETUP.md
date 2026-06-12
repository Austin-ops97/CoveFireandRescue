# Backblaze B2 Setup

Cove Fire & Rescue stores large files (fleet photos, leadership portraits, and future uploads) in **Backblaze B2**. **Firestore** stores file metadata only. The app does **not** use Firebase Storage for large files.

## Required environment variables

Set these in Vercel (and locally in `.env.local`):

| Variable | Description |
|----------|-------------|
| `B2_APPLICATION_KEY_ID` | Backblaze application key ID |
| `B2_APPLICATION_KEY` | Backblaze application key secret (server-only) |
| `B2_BUCKET_ID` | Target bucket ID |
| `B2_BUCKET_NAME` | Target bucket name |
| `B2_ENDPOINT` | B2 API endpoint (e.g. `https://api.backblazeb2.com`) |
| `B2_PUBLIC_BASE_URL` | Public base URL for browser-accessible files (e.g. friendly CDN or bucket public URL) |

These values are read only on the server (`lib/storage/b2.ts` uses `import "server-only"`). They must never be exposed to client bundles.

## Security recommendations

- Create a **dedicated B2 application key** restricted to the specific bucket used by this app.
- Keep the application key secret in server environment variables only.
- Make the bucket public **only if** you intend public image URLs (fleet and leadership photos on the public site).
- Use lifecycle rules later if you need automatic deletion or tiering for old files.

## Upload path

By default, files upload **through the Vercel API** (`POST /api/storage/b2/upload`) and then to Backblaze server-side. This avoids browser CORS configuration. **Max file size: 4.5 MB** (Vercel serverless body limit).

## CORS rules (optional — direct browser uploads only)

If you later enable direct browser-to-B2 uploads, CORS rules are required on the bucket. Without them, uploads fail with **"Load failed"** or a CORS policy error.

1. Install the [Backblaze B2 CLI](https://www.backblaze.com/docs/cloud-storage-command-line-tools) and authorize it (`b2 account authorize`).
2. Apply the rules in [`docs/b2-cors-rules.json`](./b2-cors-rules.json):

```bash
b2 update-bucket --cors-rules "$(cat docs/b2-cors-rules.json)" covefireandrescue allPublic
```

Replace `covefireandrescue` with your bucket name if different. Use `allPublic` or `allPrivate` to match your bucket type.

3. In the Backblaze web console, open the bucket → **CORS Rules** and confirm **custom rules** are active.

Add any extra preview domains (for example `https://*.vercel.app`) if you test uploads on Vercel preview URLs.

## How uploads work

1. An **admin** requests an upload URL from `POST /api/storage/b2/upload-url` (Firebase Admin verifies the session).
2. The server returns a short-lived B2 upload URL and authorization token plus the object key and public URL.
3. The browser uploads the file **directly to B2** (no large file passes through Vercel).
4. The client calls `POST /api/storage/b2/complete` to save metadata in the Firestore `files` collection.
5. Dashboard managers link returned file IDs to `fleet.imageFileIds` or `leadership.photoFileId`.
6. Public fleet and leadership APIs resolve file metadata server-side and return `primaryImageUrl` / `photoUrl`.

## Firebase vs B2

| System | Stores |
|--------|--------|
| Firestore `files` | Metadata: names, content type, size, B2 ids/keys, public URL, uploader, module, related record |
| Backblaze B2 | Actual file bytes |
| Firebase Storage | Not used for large files in this project |
