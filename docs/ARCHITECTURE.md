# Cove Fire & Rescue — Architecture

## Stack

| Layer | Technology |
|--------|------------|
| Frontend / hosting | Next.js App Router on Vercel |
| Auth | Firebase Authentication |
| Structured data | Cloud Firestore |
| Large files | Backblaze B2 (server-side only) |

No Supabase, SQL, Prisma, Drizzle, Auth.js, or NextAuth.

## Environment

Copy `.env.local.example` → `.env.local`.

- `NEXT_PUBLIC_FIREBASE_*` — client-safe Firebase web config
- `B2_*` — server-only Backblaze credentials (never `NEXT_PUBLIC_`)

## Auth flow

- `components/providers/AuthProvider.tsx` — session + Firestore `users/{uid}` profile
- Profiles are **not** auto-created on login; admins create `users/{uid}` manually
- `components/auth/RequireAuth.tsx` — protects `/dashboard/*`
- `hooks/useAuth.ts` — context accessor

## Firestore

- Collection constants: `lib/firestore/collections.ts`
- Document types: `lib/firestore/types.ts`
- Security rules: `firestore.rules`

## Backblaze B2

- Server-only module: `lib/storage/b2.ts`
- Upload URL API placeholder: `POST /api/storage/b2/upload-url` (501 until Admin auth added)

## Health check

`GET /api/health` → `{ ok, service, storage, auth }`
