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
- `requestTickets` stores authenticated member requests, admin responses, priority, and status. All access uses server API routes so requesters cannot read other members' tickets or change admin-managed fields.

## Request ticket flow

1. Any active dashboard user submits a request from `/dashboard/requests`.
2. `POST /api/request-tickets` verifies the Firebase ID token, validates the request, and stamps the authenticated requester identity.
3. Non-admin users receive only their own tickets from `GET /api/request-tickets`; administrators receive the department-wide queue.
4. Only administrators can call `PATCH /api/request-tickets/[id]` to update status, priority, and the requester-visible response.
5. Creates and updates are written to `auditLogs`, and unresolved ticket counts appear on the appropriate dashboard overview.

## Backblaze B2

- Server-only module: `lib/storage/b2.ts`
- Upload URL API placeholder: `POST /api/storage/b2/upload-url` (501 until Admin auth added)

## Health check

`GET /api/health` → `{ ok, service, storage, auth }`
