"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/site/Button";
import { AlertBanner, CheckboxField } from "@/components/ui";
import { submitNationalNightOutRequest } from "@/lib/national-night-out/client";
import {
  NATIONAL_NIGHT_OUT_DISCLAIMER,
  type NationalNightOutFormPayload,
} from "@/lib/national-night-out/types";
import { inputBase, textareaBase } from "@/lib/ui/classes";

type FormState = {
  requesterName: string;
  phone: string;
  email: string;
  neighborhood: string;
  address: string;
  city: string;
  zipCode: string;
  preferredTime: string;
  estimatedAttendance: string;
  accessInstructions: string;
  comments: string;
  disclaimerAccepted: boolean;
  website: string;
};

const EMPTY_FORM: FormState = {
  requesterName: "",
  phone: "",
  email: "",
  neighborhood: "",
  address: "",
  city: "",
  zipCode: "",
  preferredTime: "",
  estimatedAttendance: "",
  accessInstructions: "",
  comments: "",
  disclaimerAccepted: false,
  website: "",
};

function validateClient(form: FormState): string | null {
  if (!form.requesterName.trim()) return "Full name is required.";
  if (!form.phone.trim()) return "Phone number is required.";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "A valid email address is required.";
  }
  if (!form.neighborhood.trim()) return "Neighborhood / subdivision name is required.";
  if (!form.address.trim()) return "Event address is required.";
  if (!form.city.trim()) return "City is required.";
  if (!/^\d{5}(-\d{4})?$/.test(form.zipCode.trim())) return "A valid ZIP code is required.";
  if (!form.preferredTime.trim()) return "Preferred visit time is required.";
  if (!form.estimatedAttendance.trim()) return "Estimated number of attendees is required.";
  if (!form.disclaimerAccepted) {
    return "You must acknowledge that submitting this request does not guarantee a department visit.";
  }
  return null;
}

export function NationalNightOutForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  const canSubmit = useMemo(() => !submitting && form.disclaimerAccepted, [form.disclaimerAccepted, submitting]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    const clientError = validateClient(form);
    if (clientError) {
      setFieldError(clientError);
      return;
    }

    setFieldError(null);
    setSubmitting(true);

    const payload: NationalNightOutFormPayload = {
      requesterName: form.requesterName,
      phone: form.phone,
      email: form.email,
      neighborhood: form.neighborhood,
      address: form.address,
      city: form.city,
      zipCode: form.zipCode,
      preferredTime: form.preferredTime,
      estimatedAttendance: form.estimatedAttendance,
      accessInstructions: form.accessInstructions,
      comments: form.comments,
      disclaimerAccepted: form.disclaimerAccepted,
      website: form.website,
    };

    try {
      const result = await submitNationalNightOutRequest(payload);
      setSuccessRequestId(result.requestId);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successRequestId) {
    return (
      <AlertBanner variant="success" title="Request submitted">
        Your National Night Out request has been submitted. This request does not guarantee a
        department visit. The department will review your request and determine availability.
        {successRequestId !== "NNO-IGNORED" ? (
          <>
            {" "}
            Your request ID is <span className="font-semibold text-brand-charcoal">{successRequestId}</span>.
            Save this ID and the email you used so you can check your request status later.
            <div className="mt-4">
              <Button href="/national-night-out/status" variant="outline" size="sm">
                Check Request Status
              </Button>
            </div>
          </>
        ) : null}
      </AlertBanner>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="relative space-y-5" noValidate>
      {(error || fieldError) && (
        <AlertBanner variant="error" title="Could not submit request">
          {error || fieldError}
        </AlertBanner>
      )}

      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="nno-website">Website</label>
        <input
          id="nno-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nno-name" className="block text-sm font-medium text-brand-charcoal">
            Full name <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-name"
            name="requesterName"
            required
            maxLength={120}
            autoComplete="name"
            className={`mt-1 ${inputBase}`}
            value={form.requesterName}
            onChange={(event) => updateField("requesterName", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-phone" className="block text-sm font-medium text-brand-charcoal">
            Phone number <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-phone"
            name="phone"
            type="tel"
            required
            maxLength={30}
            autoComplete="tel"
            className={`mt-1 ${inputBase}`}
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-email" className="block text-sm font-medium text-brand-charcoal">
            Email address <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className={`mt-1 ${inputBase}`}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="nno-neighborhood" className="block text-sm font-medium text-brand-charcoal">
            Neighborhood / subdivision name <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-neighborhood"
            name="neighborhood"
            required
            maxLength={200}
            className={`mt-1 ${inputBase}`}
            value={form.neighborhood}
            onChange={(event) => updateField("neighborhood", event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="nno-address" className="block text-sm font-medium text-brand-charcoal">
            Event address <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-address"
            name="address"
            required
            maxLength={300}
            autoComplete="street-address"
            className={`mt-1 ${inputBase}`}
            value={form.address}
            onChange={(event) => updateField("address", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-city" className="block text-sm font-medium text-brand-charcoal">
            City <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-city"
            name="city"
            required
            maxLength={120}
            autoComplete="address-level2"
            className={`mt-1 ${inputBase}`}
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-zip" className="block text-sm font-medium text-brand-charcoal">
            ZIP code <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-zip"
            name="zipCode"
            required
            maxLength={10}
            autoComplete="postal-code"
            inputMode="numeric"
            className={`mt-1 ${inputBase}`}
            value={form.zipCode}
            onChange={(event) => updateField("zipCode", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-time" className="block text-sm font-medium text-brand-charcoal">
            Preferred visit time <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-time"
            name="preferredTime"
            required
            maxLength={200}
            placeholder="Example: 6:00–7:00 PM"
            className={`mt-1 ${inputBase}`}
            value={form.preferredTime}
            onChange={(event) => updateField("preferredTime", event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nno-attendance" className="block text-sm font-medium text-brand-charcoal">
            Estimated number of attendees <span className="text-brand-red">*</span>
          </label>
          <input
            id="nno-attendance"
            name="estimatedAttendance"
            required
            maxLength={50}
            placeholder="Example: 40–50"
            className={`mt-1 ${inputBase}`}
            value={form.estimatedAttendance}
            onChange={(event) => updateField("estimatedAttendance", event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="nno-access" className="block text-sm font-medium text-brand-charcoal">
            Gate / access instructions
          </label>
          <textarea
            id="nno-access"
            name="accessInstructions"
            rows={3}
            maxLength={2000}
            className={`mt-1 ${textareaBase}`}
            value={form.accessInstructions}
            onChange={(event) => updateField("accessInstructions", event.target.value)}
            placeholder="Gate codes, parking notes, or how to reach the gathering location"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="nno-comments" className="block text-sm font-medium text-brand-charcoal">
            Additional information / comments
          </label>
          <textarea
            id="nno-comments"
            name="comments"
            rows={4}
            maxLength={3000}
            className={`mt-1 ${textareaBase}`}
            value={form.comments}
            onChange={(event) => updateField("comments", event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
        <p className="text-sm font-semibold text-brand-charcoal">Important disclaimer</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-gray">{NATIONAL_NIGHT_OUT_DISCLAIMER}</p>
        <div className="mt-4">
          <CheckboxField
            id="nno-disclaimer"
            checked={form.disclaimerAccepted}
            onChange={(checked) => updateField("disclaimerAccepted", checked)}
            label="I understand that submitting this request does not guarantee a department visit."
          />
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={!canSubmit} className="w-full sm:w-auto">
        {submitting ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
}
