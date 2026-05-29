# Firestore Indexes

This project currently sorts many announcement queries **in memory** on the server to avoid requiring composite indexes during early development.

## Announcements

As the `announcements` collection grows, you may want composite indexes for server-side ordering instead of in-memory sorts.

### Suggested indexes (future)

| Collection       | Fields                                      | Use case                                      |
|------------------|---------------------------------------------|-----------------------------------------------|
| `announcements`  | `status` ASC, `pinned` DESC, `publishedAt` DESC | Public published feed, pinned first          |
| `announcements`  | `status` ASC, `updatedAt` DESC              | Admin lists filtered by status                |
| `announcements`  | `pinned` DESC, `updatedAt` DESC             | Admin “all statuses” sorted lists             |

### Current approach

- **Public API** (`GET /api/announcements`): queries `status == "published"` (limit 50), then sorts pinned first and by `publishedAt` / `updatedAt` in Node.
- **Admin API** (`GET /api/admin/announcements`): reads up to 100 documents, sorts in memory.

When Firestore returns an index error in the Firebase Console or logs, create the suggested composite index from the link provided in the error message.

## Fleet

As the `fleet` collection grows, you may want composite indexes for server-side ordering instead of in-memory sorts.

### Suggested indexes (future)

| Collection | Fields | Use case |
|------------|--------|----------|
| `fleet` | `status` ASC, `active` ASC, `sortOrder` ASC | Public active fleet list sorted by display order |
| `fleet` | `status` ASC, `active` ASC, `name` ASC | Public active fleet list sorted alphabetically |

### Current approach

- **Public API** (`GET /api/fleet`): queries `status == "active"` and `active == true` (limit 100), then sorts by `sortOrder` and `name` in Node.
- **Admin API** (`GET /api/admin/fleet`): reads up to 100 documents, sorts archived last, then by `sortOrder` and `name` in memory.

## Leadership

As the `leadership` collection grows, you may want composite indexes for server-side ordering instead of in-memory sorts.

### Suggested indexes (future)

| Collection   | Fields                                      | Use case                                              |
|--------------|---------------------------------------------|-------------------------------------------------------|
| `leadership` | `status` ASC, `active` ASC, `sortOrder` ASC | Public active leadership list sorted by display order |
| `leadership` | `status` ASC, `active` ASC, `name` ASC    | Public active leadership list sorted alphabetically   |

### Current approach

- **Public API** (`GET /api/leadership`): queries `status == "active"` and `active == true` (limit 100), then sorts by `sortOrder`, `rank`, and `name` in Node.
- **Admin API** (`GET /api/admin/leadership`): reads up to 100 documents, sorts archived last, then by `sortOrder` and `name` in memory.

## Checklist templates

As the `checklistTemplates` collection grows, you may want composite indexes for server-side ordering.

### Suggested indexes (future)

| Collection            | Fields                                              | Use case                                           |
|-----------------------|-----------------------------------------------------|----------------------------------------------------|
| `checklistTemplates`  | `active` ASC, `reusable` ASC, `scope` ASC, `sortOrder` ASC | Member template picker sorted by scope and order |

### Current approach

- **Member API** (`GET /api/checklist-templates`): queries `active == true` and `reusable == true` (limit 100), then sorts by scope, `sortOrder`, and name in Node.
- **Admin API** (`GET /api/admin/checklist-templates`): reads up to 100 documents, sorts in memory.

Legacy `roundTemplates` / `roundSubmissions` collections may exist from earlier builds but are no longer referenced by the app (see [CHECKLIST_SYSTEM.md](./CHECKLIST_SYSTEM.md)).

## Checklist submissions

As the `checklistSubmissions` collection grows, you may want composite indexes for filtered history and review queries.

### Suggested indexes (future)

| Collection               | Fields                                           | Use case                                      |
|--------------------------|--------------------------------------------------|-----------------------------------------------|
| `checklistSubmissions`   | `submittedAt` DESC                               | Recent submissions sorted by date             |
| `checklistSubmissions`   | `submittedBy` ASC, `submittedAt` DESC            | Member history for a specific inspector       |
| `checklistSubmissions`   | `templateId` ASC, `submittedAt` DESC             | Submissions for one template                  |
| `checklistSubmissions`   | `scope` ASC, `submittedAt` DESC                  | Submissions filtered by scope                 |
| `checklistSubmissions`   | `relatedFleetUnitId` ASC, `submittedAt` DESC     | Submissions for one apparatus                 |

### Current approach

- **Submissions API** (`GET /api/checklist-submissions`): reads up to 300 documents, filters by role and query params in Node, returns up to 200 results sorted by `submittedAt`.

## Files

The `files` collection stores Backblaze B2 metadata for uploaded assets.

### Suggested indexes (future)

| Collection | Fields | Use case |
|------------|--------|----------|
| `files` | `module` ASC, `relatedId` ASC | List files for a fleet unit, leadership member, or other module record |
| `files` | `uploadedAt` DESC | Admin file browser sorted by newest uploads |

### Current approach

- **Resolve API** (`GET /api/files/resolve?ids=...`): loads documents by ID with `getAll` (no composite index required).
- **Public fleet/leadership APIs**: resolve linked file IDs in memory after loading parent records.

## Audit logs

As the `auditLogs` collection grows, you may want indexes for admin audit viewers.

### Suggested indexes (future)

| Collection   | Fields                         | Use case                    |
|--------------|--------------------------------|-----------------------------|
| `auditLogs`  | `createdAt` DESC               | Recent activity feed        |
| `auditLogs`  | `actorUid` ASC, `createdAt` DESC | Actions by a specific user |

### Current approach

- Audit writes are best-effort from API routes; no list UI yet.

## Other collections

Document additional composite indexes here as new features ship.
