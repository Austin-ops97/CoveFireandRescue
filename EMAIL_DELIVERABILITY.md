# Email deliverability — covefireandrescue.org

This document is based on the mail setup in this repository. It does not invent SPF, DKIM, or DMARC record values. Those values are created by the mail host for this specific account and must be copied from that host.

## What sends mail today

The website does not use Resend, SendGrid, Mailgun, Postmark, Amazon SES, or another third-party transactional provider. Nothing in the repository configures one.

Department addresses on `@covefireandrescue.org` are HostGator cPanel mailboxes:

- Provisioning uses the cPanel UAPI (`lib/cpanel/server.ts`) with `CPANEL_HOST`, `CPANEL_USERNAME`, `CPANEL_API_TOKEN`, and `CPANEL_EMAIL_DOMAIN`.
- Member setup instructions use SMTP on the cPanel mail host (`lib/email-provisioning/mail-settings.ts`).
- The default host is `mail.<CPANEL_EMAIL_DOMAIN>` unless `CPANEL_MAIL_HOST` is set. The example in `.env.local.example` is `mail.covefireandrescue.org`.
- The default SMTP port is `465` (implicit TLS) unless `CPANEL_MAIL_SMTP_PORT` is set. IMAP `993` and POP3 `995` are for mailbox clients, not for the website.

The public site itself is hosted on Vercel. Vercel is not the mail server. Mail for `@covefireandrescue.org` stays on the HostGator cPanel server named by `CPANEL_HOST` / `CPANEL_MAIL_HOST`.

Before this change, the website did not send messages. Spam reports for `@covefireandrescue.org` are about mail sent from those cPanel mailboxes (people using the department address in a mail client, or mail forwarded from it). Website notices now use that same authenticated mailbox, so they pass or fail on the same DNS.

## Exact DNS records the provider expects

cPanel generates the records. This repository does not contain the server IP, the DKIM public key, or the live DNS zone, so those strings are not listed here.

In HostGator cPanel for the account that owns `CPANEL_EMAIL_DOMAIN`:

1. Open **Email** → **Email Deliverability**.
2. Select the domain (`covefireandrescue.org` when `CPANEL_EMAIL_DOMAIN` is that domain).
3. Copy the records cPanel shows for that domain. Install them at the DNS host that is actually authoritative for the domain (cPanel Zone Editor if HostGator hosts DNS, or the registrar if DNS was moved for Vercel).

Also open **Email** → **Email Routing** (or Zone Editor) and confirm the MX records cPanel shows for the domain are still published. Pointing the website at Vercel must not delete or replace those MX records. Vercel does not receive this department mail.

If Email Deliverability says a record is valid, do not replace it with a hand-written record. If it says a record is missing or broken, publish the value on that screen.

### SPF

- Publish the single SPF TXT record cPanel shows for the domain apex.
- There must be only one SPF TXT record on that name. A second TXT that also starts with `v=spf1` makes SPF fail.
- The record has to authorize the HostGator server that actually submits the message. cPanel's suggested record does that for this account. Do not add an `include:` for a provider this app does not use.
- The website sends by logging into that same server as a mailbox on the domain, so the app does not need an extra SPF mechanism of its own.

### DKIM

- Turn on DKIM in **Email Deliverability** if it is not already enabled.
- Publish the DKIM TXT record cPanel shows, at the host name cPanel shows. The selector and the public key are unique to this server. Copy them. Do not reuse a sample key from documentation.
- cPanel will not sign mail with a key that is not published, and receivers will treat unsigned `@covefireandrescue.org` mail as easier to spam-folder.

### DMARC

cPanel may show a DMARC TXT record at `_dmarc.<domain>`. If it does, publish that record.

If cPanel does not show one yet, add DMARC only after SPF and DKIM both show as valid. A reasonable first policy is monitoring (`p=none`) with a report mailbox you actually read, then move to `quarantine` or `reject` after legitimate mail passes. The report address and policy are your choice; they are not a record stored in this repository.

### Alignment

SPF checks the envelope sender (return-path). DKIM checks the signature. DMARC requires at least one of those to agree with the visible From domain.

For this app, after the DNS above is valid:

| Check | Expected |
| --- | --- |
| Header From domain | `CPANEL_EMAIL_DOMAIN` |
| SMTP envelope / return-path | `EMAIL_SMTP_USER`, which must be on that same domain |
| DKIM signing domain | The domain cPanel signs, which should be `CPANEL_EMAIL_DOMAIN` |
| Reply-To | May be a different monitored address. Reply-To is not the alignment domain. |

The From domain matches the authenticated sending domain only when `EMAIL_FROM` (or `EMAIL_SMTP_USER`, when From is omitted) is `@<CPANEL_EMAIL_DOMAIN>`. The application refuses to send when that is not true.

## Application changes

- `lib/email` sends website notices through the existing cPanel SMTP settings. It does not add a second mail provider.
- Header From uses a mailbox on `CPANEL_EMAIL_DOMAIN`. The SMTP envelope uses `EMAIL_SMTP_USER` on that domain.
- Reply-To is `EMAIL_REPLY_TO`, or the public department contact address when Reply-To is unset, so replies are not forced back into an unmonitored mailbox.
- Subjects and addresses are stripped of carriage returns and line feeds before they are placed in headers.
- `EMAIL_DELIVERY_MODE=log` records the notice and does not contact the mail server. That is the default when `NODE_ENV` is not `production`. Production defaults to `send` only when you set that mode or leave it unset.
- Failed sends do not include the mailbox password in the error stored on the request.
- `GET /api/health` reports `transactionalEmailConfigured` as true or false and does not return addresses or secrets.

## Environment variable names

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

Create the SMTP mailbox in cPanel first (a dedicated mailbox such as the local-part you choose on `CPANEL_EMAIL_DOMAIN`). Put that full address in `EMAIL_SMTP_USER` and its password in `EMAIL_SMTP_PASSWORD`. Leave `EMAIL_FROM` empty to use that same address, which is the simplest alignment.

## How to test after DNS is in place

1. In cPanel **Email Deliverability**, confirm SPF and DKIM are valid for `CPANEL_EMAIL_DOMAIN`, and publish DMARC if you add it.
2. In Vercel, set the variables above. Use `EMAIL_DELIVERY_MODE=send` only when you intend to deliver real mail. Redeploy.
3. Confirm `GET /api/health` shows `"transactionalEmailConfigured": true`.
4. Submit a National Night Out request with a mailbox you control, or change an existing request's status while signed in as an admin.
5. On the received message, view the original headers. You want `spf=pass`, `dkim=pass`, and `dmarc=pass` (once DMARC exists), with the From domain equal to `CPANEL_EMAIL_DOMAIN`.
6. Optionally send one message to a deliverability checker you trust and compare it with a message sent from the same mailbox in a normal mail client. Both should authenticate as the cPanel domain.

Do not test by flipping production requests to Approved or Denied for real residents until `EMAIL_DELIVERY_MODE` and the mailbox are the ones you mean to use. Local development stays in `log` mode unless you explicitly set `EMAIL_DELIVERY_MODE=send`.
