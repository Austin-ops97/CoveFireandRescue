# Cove Fire & Rescue — client brief report

## Changes Made

- Transactional email now goes out through the existing HostGator cPanel SMTP mailbox (`lib/email`). Header From and the SMTP envelope stay on `CPANEL_EMAIL_DOMAIN`. Reply-To can be a monitored address. Header values are stripped of line breaks. Outside production, mail is logged and not sent.
- `EMAIL_DELIVERABILITY.md` explains the cPanel DNS steps without inventing SPF, DKIM, or DMARC values.
- Authenticated **Roster** tab at `/dashboard/roster` for every dashboard role. Admins and editors can add, edit, and delete. Members and viewers can view, print, and export. Search, rank filter, activity-status filter, and sort by unit number or name. Print hides navigation and controls. Export is a UTF-8 CSV that Excel opens.
- National Night Out status changes email the requester. Stored statuses are `pending` (shown as Submitted), `under_review`, `approved`, and `denied`. A denial can include a reason. Repeating a status that was already emailed does not send another message.
- Public **Check Request Status** at `/national-night-out/status`. It requires the Request ID and the email on the request, returns a generic miss, and is rate-limited. Officer notes, addresses, and internal IDs are not returned.
- Firestore rules deny client access to `rosterMembers`. Writes stay on the Admin SDK routes.

## Database Changes

Firestore is schemaless. There is no Prisma schema and no SQL migration.

New collection `rosterMembers`. The document id is the unit number.

| Field | Type |
| --- | --- |
| `unitNumber` | number, 8901–8999 |
| `firstName`, `lastName`, `phone`, `email`, `rank` | strings |
| `activityStatus` | `active` or `non_active` |
| `createdAt`, `updatedAt`, `createdBy`, `updatedBy` | metadata |

Existing `nationalNightOutRequests` documents are unchanged until the next write. New optional fields:

| Field | Purpose |
| --- | --- |
| `status` | existing `pending`, `approved`, `denied`, plus `under_review` |
| `statusNote` | emailed to the requester; omitted from the public status page |
| `lastNotifiedStatus`, `lastNotifiedAt`, `lastNotificationError` | stops duplicate status emails |

`pending` remains the stored value for a new request so current documents still load. The label is now Submitted.

## Email Deliverability

The repository does not use Resend or another transactional vendor. Department mail is HostGator cPanel. The site previously did not send mail; spam on `@covefireandrescue.org` is the cPanel domain’s DNS and reputation.

Code now:

- Sends website notices through that authenticated mailbox.
- Refuses a From address that is not on `CPANEL_EMAIL_DOMAIN`.
- Sets the envelope sender to `EMAIL_SMTP_USER` on that domain.
- Sets Reply-To to `EMAIL_REPLY_TO` or the public department contact address.
- Does not send real mail unless `EMAIL_DELIVERY_MODE=send` (the default only in production).

Still manual: copy the SPF, DKIM, and any DMARC records from cPanel **Email Deliverability** into the DNS host for the domain, and confirm the cPanel MX records were not removed when the website moved to Vercel. Exact record strings are not in this repo. See `EMAIL_DELIVERABILITY.md`.

## Environment Variables

Names only.

Already used for cPanel mail:

- `CPANEL_API_TOKEN`
- `CPANEL_USERNAME`
- `CPANEL_HOST`
- `CPANEL_PORT`
- `CPANEL_EMAIL_DOMAIN`
- `CPANEL_MAIL_HOST`
- `CPANEL_MAIL_SMTP_PORT`
- `CPANEL_MAIL_IMAP_PORT`
- `CPANEL_MAIL_POP3_PORT`

Added for website sending:

- `EMAIL_SMTP_USER`
- `EMAIL_SMTP_PASSWORD`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_DELIVERY_MODE`

`NEXT_PUBLIC_SITE_URL` is optional and is used for the status-check link inside the email.

## Deployment

1. Merge this pull request into `main`.
2. In the Vercel project, set `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`, and `EMAIL_DELIVERY_MODE=send` for Production. Set `EMAIL_FROM` and `EMAIL_REPLY_TO` only if they should differ from the defaults in `EMAIL_DELIVERABILITY.md`. Confirm `CPANEL_EMAIL_DOMAIN` and `CPANEL_MAIL_HOST` are already set.
3. Redeploy the Vercel production deployment (a merge to `main` does this if the Git integration is connected).
4. Publish Firestore rules from this commit: `firebase deploy --only firestore:rules`.
5. Create the sending mailbox in cPanel before the first live status email.
6. Follow `EMAIL_DELIVERABILITY.md` for DNS. That step is outside Vercel.

## Database Migration

No migration command. Do not delete or recreate Firestore.

Production-safe process:

1. Deploy the app. Existing Night Out documents keep working.
2. Deploy rules only:

```bash
firebase deploy --only firestore:rules
```

3. Roster documents are created when an officer adds a member. Night Out notification fields are written the next time a request is submitted or its status changes.

There is no composite index to create. Status lookup uses a single-field equality query on `requestId`.

## Testing

| Check | Result |
| --- | --- |
| `npm test` | Passed. 13 tests. |
| `npx tsx scripts/verify-nno-workflow.ts` | Passed. Existing Night Out workflow plus under-review, duplicate-notification, and lookup checks. |
| `npx tsc --noEmit` | Passed. |
| `npm run lint` | Passed. Two existing unused-variable warnings remain in `SubmissionDetailModal.tsx` and `lib/users/admin-server.ts`. |
| `npm run build` | Passed. |

The new tests cover roster create, edit, removal, duplicate checks, role gates, search/filter/sort, CSV export, matching and non-matching status lookup, invalid request IDs, status notification decisions, duplicate status suppression, the existing submission payload, and From-domain alignment.

Real SMTP was not contacted. Delivery mode defaults to log outside production.

## Manual Verification Checklist

Roster

- Sign in as a member or viewer, open **Roster**, and confirm the list loads and Add/Edit/Delete are absent.
- Sign in as an admin or editor. Add unit 8901–8999, edit the rank, and remove the member after confirming the dialog.
- Search by name and phone. Filter by rank and Active / Non-Active. Sort by unit number and by name.

Roster print/export

- Choose **Print Roster** and confirm the page shows only Unit Number, Name, Phone #, Email, Rank, and Activity Status.
- Choose **Export Excel / CSV**, open the file in Excel, and confirm those same columns.

Night Out status lookup

- Submit a request, then open **Check Request Status**. The Request ID plus the same email shows Submitted, the event type, October 6, and the dates.
- Repeat with a different email, and with a made-up Request ID. Both responses should be the same “couldn’t find a request” message, with no address or notes.

Night Out approval email

- With `EMAIL_DELIVERY_MODE=log`, change a request to Under Review, Approved, and Denied and confirm the dashboard says the email was recorded locally.
- Set the same status again and confirm it says no additional email was sent.
- Deny with a note and confirm that note is not on the public status page.
- After DNS and `EMAIL_DELIVERY_MODE=send`, repeat one change to a mailbox you control and check the headers for SPF and DKIM pass.

Email deliverability

- In cPanel **Email Deliverability**, confirm SPF and DKIM are valid for the department domain.
- Confirm MX still points at the cPanel mail host after the Vercel cutover.
- `GET /api/health` shows `transactionalEmailConfigured: true` only after the SMTP mailbox variables are set, and it does not return secret values.
