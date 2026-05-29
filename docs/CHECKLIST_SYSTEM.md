# Checklist System

Digital rounds and inspection checklists for Cove Fire & Rescue. Templates are built by admins; members submit completed inspections with optional photos.

## Template builder workflow

1. Sign in as an **admin** and open **Dashboard → Checklist Templates** (`/dashboard/checklist-templates`).
2. Create a template: name, description, scope (fleet, station, equipment, general), sections, and fields.
3. Use the **validation summary** panel to fix issues before saving (missing titles, select options, labels).
4. **Duplicate** an existing template, section, or field to speed up similar sheets.
5. Mark templates **Active** and **Reusable** so members can select them when submitting.
6. **Archive** templates that should no longer accept new submissions (soft-delete: `active: false`).

Field types: pass/fail, pass/fail/N/A, yes/no, checkbox, text, number, select, photo, signature (typed name).

## Submission workflow

1. **Admin** or **member** opens **Dashboard → Digital Rounds / Checklists** (`/dashboard/rounds`).
2. Select a template and, for fleet-scoped sheets, an apparatus.
3. Complete all sections. Answers **auto-save to localStorage** as a draft; reload restores work with a “Draft restored” notice.
4. Client-side validation highlights missing required fields, invalid numbers, bad selects, and required photos before submit.
5. On success, the draft is cleared and the submission is stored in Firestore `checklistSubmissions`.

Fleet-scoped submissions require an active fleet unit. If a draft references an archived unit, the UI shows **Archived Unit** and blocks submit until a valid unit is chosen.

## Photo upload workflow

1. Field-level photos and “additional photos” use the same Backblaze B2 flow:
   - `POST /api/storage/b2/upload-url` (authenticated member or admin)
   - Direct upload to B2 from the browser
   - `POST /api/storage/b2/complete` to write metadata in `files`
2. Limits: **15 MB** per image; **10 photos** max per submission (general + field photos combined in practice per field/general buckets).
3. UI shows upload progress, success, errors, preview, and remove-before-submit.
4. Stored files use module `rounds` in B2 paths (legacy name; data lives in `checklistSubmissions`).

## History workflow

- **Dashboard → Checklist History** (`/dashboard/rounds/history`)
- Filter by date (quick presets: Today, Last 7/30 days, This Month), template, scope, fleet unit, search.
- Filters and sort order persist in **localStorage**.
- Open **View details** for a modal with answers, photos, notes, submitter, and fleet unit.

Members see only their own submissions. Admins see all.

## Review workflow

- **Dashboard → Checklist Review** (`/dashboard/rounds/review`) — **admin only**
- Defaults to attention-only (fail / no answers).
- Summary widgets: total inspections, failures, photos, failure breakdown by fleet unit and template, recent activity.
- Same filters and detail modal as history.

## Permission model

| Action | Admin | Member |
|--------|-------|--------|
| Dashboard (member modules) | Yes | Yes |
| Submit checklist | Yes | Yes |
| View own history | Yes | Yes |
| View all submissions / review | Yes | No |
| Manage templates | Yes | No |
| B2 upload (checklist photos) | Yes | Yes |
| Resolve file URLs (`/api/files/resolve`) | Yes | Yes |
| Fleet / leadership / users / announcements admin | Yes | No |

All checklist Firestore access goes through **server API routes** with Firebase Admin SDK. Client SDK does not read `checklistTemplates` or `checklistSubmissions` directly.

## Collections

- `checklistTemplates` — reusable sheet definitions
- `checklistSubmissions` — completed inspections
- `files` — B2 metadata for uploaded images

Legacy `roundTemplates` / `roundSubmissions` collections are unused by the current app.

## Related docs

- [FIRESTORE_INDEXES.md](./FIRESTORE_INDEXES.md) — query limits and recommended composite indexes
- [BACKBLAZE_B2_SETUP.md](./BACKBLAZE_B2_SETUP.md) — storage configuration
