import assert from "node:assert/strict";
import test from "node:test";
import { resolveMailIdentity } from "../lib/email/identity";
import { sanitizeHeaderValue } from "../lib/email/sanitize";

test("From must match the authenticated cPanel domain and Reply-To may differ", () => {
  const aligned = resolveMailIdentity({
    sendingDomain: "CoveFireAndRescue.org",
    smtpUser: "notifications@covefireandrescue.org",
    fromAddress: null,
    replyTo: null,
    fallbackReplyTo: "cvfd@chamberstx.gov",
  });

  assert.equal(aligned.ok, true);
  if (!aligned.ok) return;
  assert.equal(aligned.identity.fromAddress, "notifications@covefireandrescue.org");
  assert.equal(aligned.identity.envelopeFrom, "notifications@covefireandrescue.org");
  assert.equal(aligned.identity.sendingDomain, "covefireandrescue.org");
  assert.equal(aligned.identity.replyTo, "cvfd@chamberstx.gov");
  assert.equal(aligned.identity.fromName, "Cove Fire & Rescue");

  const misaligned = resolveMailIdentity({
    sendingDomain: "covefireandrescue.org",
    smtpUser: "notifications@covefireandrescue.org",
    fromAddress: "department@gmail.com",
    replyTo: null,
    fallbackReplyTo: "cvfd@chamberstx.gov",
  });
  assert.equal(misaligned.ok, false);

  const injected = sanitizeHeaderValue("Night Out\r\nBcc: attacker@example.com");
  assert.equal(injected.includes("\n"), false);
  assert.equal(injected.includes("\r"), false);
});
