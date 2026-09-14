# Email Deliverability — Cove Fire & Rescue

This document explains how website-generated email works in this project, what was changed in application code, and which **DNS / account** steps you must complete manually. DNS records cannot be fixed in code.

## Current findings (from repository inspection)

| Topic | Finding |
|--------|---------|
| Previous website email sending | **None.** Forms (contact, applications, National Night Out) stored data in Firestore only. No Resend, SendGrid, Nodemailer, or SMTP send path existed. |
| `@covefireandrescue.org` mailboxes | Created via **cPanel / HostGator** email provisioning (`CPANEL_*` env vars). Those are normal mailbox accounts, not the website transactional sender. |
| FROM addresses (new) | Default: `Cove Fire & Rescue <noreply@covefireandrescue.org>` (override with `EMAIL_FROM`). |
| Reply-To (new) | Optional via `EMAIL_REPLY_TO` (recommended: a monitored department inbox such as `cvfd@chamberstx.gov` or a Cove mailbox). |
| Provider (new) | **Resend** (`RESEND_API_KEY`). |

Spam for ordinary `@covefireandrescue.org` mailbox mail (Outlook, Gmail clients, etc.) is usually caused by **missing or misaligned SPF / DKIM / DMARC on the HostGator/cPanel side**, not by this Next.js app. Website-generated mail now uses Resend and requires Resend domain verification.

---

## 1. DNS records currently expected by Resend

Exact hostnames and values are generated in your Resend dashboard when you add a domain. Do **not** invent them.

Typical Resend domain verification records (placeholders — copy the live values from Resend → Domains):

| Purpose | Type | Host / Name (example) | Value (example pattern) |
|---------|------|------------------------|-------------------------|
| DKIM | `TXT` or `CNAME` | `resend._domainkey` (or provider-specific selector) | Unique public key / CNAME target from Resend |
| SPF (Return-Path / mail from) | `MX` and/or `TXT` | Often a send subdomain such as `send` or `bounces` | Values shown in Resend for that domain |
| Optional custom return-path | `CNAME` / `MX` | Custom subdomain if configured in Resend | Target provided by Resend |

**Action:** In [Resend Domains](https://resend.com/domains), add `covefireandrescue.org` (or a dedicated subdomain such as `mail.covefireandrescue.org` / `updates.covefireandrescue.org`), then copy the exact records Resend displays into your DNS provider.

Resend recommends a **subdomain** for transactional mail to isolate reputation from day-to-day mailbox traffic.

---

## 2. Which records to verify/add in your DNS provider

1. Open your DNS host for `covefireandrescue.org` (often HostGator / cPanel Zone Editor, Cloudflare, etc.).
2. Add every record Resend lists for the domain until the domain status is **Verified**.
3. Separately verify HostGator/cPanel mailbox authentication if members send from `@covefireandrescue.org` mail clients:
   - SPF TXT on the root domain authorizing HostGator/cPanel sending IPs
   - DKIM enabled in cPanel Email Deliverability
   - DMARC TXT at `_dmarc.covefireandrescue.org`

If both Resend and HostGator send for the same organizational domain, **merge SPF carefully** into a single SPF TXT record (multiple SPF TXT records break authentication). Prefer:

- Resend on a subdomain (`send.covefireandrescue.org` or similar), and
- cPanel SPF/`include:` mechanisms on the apex for mailbox mail.

---

## 3. SPF requirements

- Exactly **one** SPF `TXT` record per hostname.
- Apex SPF for mailbox mail must include your hosting provider’s authorized senders.
- Resend’s SPF/return-path records usually apply to the **sending subdomain** Resend gives you — add those as shown; do not guess.
- `EMAIL_FROM` must use a domain (or subdomain) that Resend has verified so SPF alignment can pass.

---

## 4. DKIM requirements

- Publish the DKIM record(s) Resend provides and wait for DNS propagation.
- Confirm Resend shows DKIM as verified.
- For cPanel mailboxes, enable DKIM under cPanel → Email Deliverability for `covefireandrescue.org`.

---

## 5. DMARC recommendations

Add (or tighten gradually):

| Name | Type | Value (start here) |
|------|------|--------------------|
| `_dmarc.covefireandrescue.org` | `TXT` | `v=DMARC1; p=none; rua=mailto:dmarcreports@covefireandrescue.org;` |

After mail passes SPF/DKIM consistently:

1. Move to `p=quarantine;`
2. Eventually `p=reject;`

Use a real mailbox for `rua=` aggregate reports. See Resend’s DMARC guide: https://resend.com/docs/dashboard/domains/dmarc

---

## 6. SPF / DKIM / DMARC alignment

Alignment is correct when:

- The visible **From** domain matches (or is a parent of) the DKIM signing domain (**DKIM alignment**).
- The envelope / Return-Path domain aligns with the From domain for SPF (**SPF alignment**), or DKIM alignment alone satisfies DMARC.

If the app sends `From: noreply@covefireandrescue.org` but Resend only verified `onboarding.resend.dev`, messages will fail alignment and often land in spam. **Verify your own domain in Resend** and set `EMAIL_FROM` to that domain.

---

## 7. Does the FROM domain match the authenticated sending domain?

| Setting | Expected |
|---------|----------|
| `EMAIL_FROM` | Address on the Resend-verified domain (default `noreply@covefireandrescue.org`) |
| Resend domain | Must include that same domain or an aligned subdomain |
| `EMAIL_REPLY_TO` | May be a different monitored address (does not need to be the Resend sending identity) |

Application default aligns From with `covefireandrescue.org`. You must complete Resend domain verification for that to authenticate.

---

## 8. Application changes made

- Added Resend-based transactional email helper (`lib/email/*`).
- National Night Out status emails (Submitted, Under Review, Approved, Denied) use that helper.
- Default From: `Cove Fire & Rescue <noreply@covefireandrescue.org>`.
- Optional Reply-To via `EMAIL_REPLY_TO`.
- Dry-run / safe behavior when `RESEND_API_KEY` is missing, `EMAIL_DRY_RUN=true`, or non-production without `EMAIL_ALLOW_NON_PRODUCTION=true`.
- Optional `EMAIL_SAFE_RECIPIENT` rewrites all recipients while testing.
- Health endpoint reports `transactionalEmailConfigured` (boolean only — no secrets).

---

## 9. How to test deliverability afterward

1. Add `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_REPLY_TO` in Vercel; redeploy.
2. Confirm domain **Verified** in Resend.
3. Submit a National Night Out request (or change a request status in the admin dashboard).
4. Check the inbox **and** spam folder for Gmail, Outlook, and Apple Mail.
5. Inspect message headers for `spf=pass`, `dkim=pass`, and `dmarc=pass`.
6. Optional tools: [mail-tester.com](https://www.mail-tester.com/), Google Postmaster Tools, Resend dashboard delivery logs.
7. For mailbox spam (not website mail): send a test from a cPanel `@covefireandrescue.org` account and verify the same header results; fix cPanel Email Deliverability if they fail.

---

## Environment variable names (no secret values)

| Name | Required for sending | Purpose |
|------|----------------------|---------|
| `RESEND_API_KEY` | Yes | Resend API key |
| `EMAIL_FROM` | Recommended | From header (defaults to Cove Fire noreply on covefireandrescue.org) |
| `EMAIL_REPLY_TO` | Recommended | Reply-To for requester responses |
| `EMAIL_DRY_RUN` | Optional | Force no-send logging (`true`) |
| `EMAIL_SAFE_RECIPIENT` | Optional | Redirect all outbound mail to one test inbox |
| `EMAIL_ALLOW_NON_PRODUCTION` | Optional | Allow real sends outside `NODE_ENV=production` when an API key is present |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Absolute links in status emails |

Never commit API keys. Never paste secret values into git, tickets, or chat.
