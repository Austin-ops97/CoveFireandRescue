# Cove Fire & Rescue

Official department website foundation built with Next.js App Router, TypeScript, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Project Structure

- `app/` — Routes and pages (App Router)
- `components/site/` — Shared layout and UI components
- `lib/data/` — Static placeholder data
- `lib/firebase/` — Firebase config placeholder (not wired yet)
- `public/manifest.webmanifest` — PWA manifest

## Environment

Copy `.env.local.example` to `.env.local` and add:

- Firebase web app keys (`NEXT_PUBLIC_FIREBASE_*`)
- Backblaze B2 server keys (`B2_*` — never expose to the client)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full stack overview.

## Backend foundation (Prompt 2)

- Firebase Auth + Firestore client (`lib/firebase/`)
- User profiles and roles (`users` collection)
- Backblaze B2 server abstraction (`lib/storage/b2.ts`)
- `AuthProvider` + dashboard `RequireAuth`
- `GET /api/health` — config status (no secrets)

## Member request tickets

- Authenticated members can submit supply, facility, apparatus, equipment, technology, and general requests from `/dashboard/requests`.
- Members can track only their own tickets and see administrator responses.
- Administrators receive a shared queue, can change priority and status, and can publish progress or resolution notes.
- Ticket records live in Firestore `requestTickets`; access is enforced by authenticated server API routes and all create/update actions are audit logged.

## Next Steps

1. Create Firebase project + enable Email/Password auth
2. Deploy `firestore.rules`
3. Add `.env.local` and create member accounts
4. Prompt 3: admin CRUD, B2 uploads, live content
