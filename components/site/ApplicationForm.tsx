"use client";

import { useState } from "react";
import { Button } from "@/components/site/Button";
import { AlertBanner, CheckboxField } from "@/components/ui";
import { submitApplication } from "@/lib/applications/client";
import { inputBase } from "@/lib/ui/classes";

export function ApplicationForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressOrCity, setAddressOrCity] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [priorExperience, setPriorExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await submitApplication({
        fullName,
        email,
        phone,
        addressOrCity,
        ageConfirmed,
        priorExperience,
        availability,
        reasonForJoining,
        consent,
      });
      setSuccess(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setAddressOrCity("");
      setAgeConfirmed(false);
      setPriorExperience("");
      setAvailability("");
      setReasonForJoining("");
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AlertBanner variant="success" title="Application received">
        Thank you for your interest in Cove Fire &amp; Rescue. A department representative will
        review your submission and follow up when possible.
      </AlertBanner>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <AlertBanner variant="error" title="Could not submit application">
          {error}
        </AlertBanner>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-brand-charcoal">
            Full name <span className="text-brand-red">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            className={`mt-1 ${inputBase}`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-charcoal">
            Email <span className="text-brand-red">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={`mt-1 ${inputBase}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-brand-charcoal">
            Phone <span className="text-brand-red">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={`mt-1 ${inputBase}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="addressOrCity" className="block text-sm font-medium text-brand-charcoal">
            Address or city <span className="text-brand-red">*</span>
          </label>
          <input
            id="addressOrCity"
            name="addressOrCity"
            required
            className={`mt-1 ${inputBase}`}
            value={addressOrCity}
            onChange={(e) => setAddressOrCity(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="priorExperience" className="block text-sm font-medium text-brand-charcoal">
          Prior fire / EMS experience
        </label>
        <textarea
          id="priorExperience"
          name="priorExperience"
          rows={3}
          className={`mt-1 ${inputBase}`}
          placeholder="None required — share any relevant background."
          value={priorExperience}
          onChange={(e) => setPriorExperience(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-brand-charcoal">
          Availability
        </label>
        <textarea
          id="availability"
          name="availability"
          rows={3}
          className={`mt-1 ${inputBase}`}
          placeholder="Days/times you can typically respond or attend training."
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="reasonForJoining" className="block text-sm font-medium text-brand-charcoal">
          Why do you want to join Cove Fire &amp; Rescue? <span className="text-brand-red">*</span>
        </label>
        <textarea
          id="reasonForJoining"
          name="reasonForJoining"
          required
          rows={4}
          className={`mt-1 ${inputBase}`}
          value={reasonForJoining}
          onChange={(e) => setReasonForJoining(e.target.value)}
        />
      </div>

      <CheckboxField
        id="ageConfirmed"
        label="I confirm I meet the department's minimum age requirements for membership."
        checked={ageConfirmed}
        onChange={setAgeConfirmed}
      />

      <CheckboxField
        id="consent"
        label="I understand this is a volunteer application and that submission does not guarantee membership. I consent to the department reviewing my information."
        checked={consent}
        onChange={setConsent}
      />

      <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}
