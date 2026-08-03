# Request Tickets

The Request Tickets module gives Cove Fire & Rescue members one place to send supply, facility, apparatus, equipment, technology, and general needs to administrators.

## Member workflow

1. Sign in and open **Dashboard → Requests**.
2. Enter a short title, category, priority, optional location or unit, and a detailed description.
3. Submit the request. The server assigns a tracking number such as `REQ-ABC123` and records the authenticated member automatically.
4. Return to the same page to track the request status and read any administrator response.

Members can only see tickets they submitted. Editor and viewer portal roles follow the same requester-scoped behavior.

## Administrator workflow

Administrators see the department-wide queue and overview counts for open, in-progress, urgent, and resolved requests. A navigation badge appears only for newly submitted requests that have not received an administrator update. Saving any administrator update clears that ticket from the badge count.

For each ticket, an administrator can:

- change priority;
- move the ticket through Open, In progress, Resolved, and Closed;
- leave or update a requester-visible response; and
- search and filter the queue; or
- permanently delete the request after confirming the action.

Closing a ticket preserves it in the normal history. Deleting a ticket removes it from both the administrator queue and the requester's history, but records the deletion in the audit log.

## Backend and permissions

- Collection: `requestTickets`
- List/create API: `GET` and `POST /api/request-tickets`
- Admin update/delete API: `PATCH` and `DELETE /api/request-tickets/[id]`
- Authentication: Firebase ID tokens via the shared authenticated API client
- Authorization: active dashboard roles may create; non-admins read only their own; admins read all and update
- Audit actions: `request_ticket.created`, `request_ticket.updated`, and `request_ticket.deleted`
- Firestore client rules: direct reads and writes are denied; the Firebase Admin SDK performs validated server operations

The list endpoints use single-field requester filtering and bounded reads, so this module does not require a new composite Firestore index.
