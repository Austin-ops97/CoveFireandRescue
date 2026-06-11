"use client";

import { useState } from "react";
import { Button } from "@/components/site/Button";
import { AlertBanner } from "@/components/ui";
import { submitContactMessage } from "@/lib/contact/client";
import { inputBase, textareaBase } from "@/lib/ui/classes";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await submitContactMessage({ name, email, phone: phone || undefined, message });
      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AlertBanner variant="success" title="Message sent">
        Thank you for contacting Cove Fire &amp; Rescue. For emergencies, always call 911. We will
        respond to non-emergency messages as soon as possible.
      </AlertBanner>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <AlertBanner variant="error" title="Could not send message">
          {error}
        </AlertBanner>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-brand-charcoal">
          Name <span className="text-brand-red">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          className={`mt-1 ${inputBase}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-brand-charcoal">
          Email <span className="text-brand-red">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className={`mt-1 ${inputBase}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium text-brand-charcoal">
          Phone
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          className={`mt-1 ${inputBase}`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-brand-charcoal">
          Message <span className="text-brand-red">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`mt-1 ${textareaBase}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" disabled={submitting} className="w-full">
        {submitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
