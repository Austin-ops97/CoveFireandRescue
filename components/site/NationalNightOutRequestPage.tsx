"use client";

import { useEffect, useState } from "react";
import { NationalNightOutForm } from "@/components/site/NationalNightOutForm";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { PageShell } from "@/components/site/PageShell";
import { SectionHeader } from "@/components/site/SectionHeader";
import { AlertBanner, SkeletonForm } from "@/components/ui";
import { fetchNationalNightOutSettings } from "@/lib/national-night-out/client";
import {
  NATIONAL_NIGHT_OUT_DISCLAIMER,
  NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL,
} from "@/lib/national-night-out/types";

export function NationalNightOutRequestPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const settings = await fetchNationalNightOutSettings();
        if (!cancelled) {
          setEnabled(settings.enabled);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load request availability.");
          setEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      eyebrow="Community Events"
      title="National Night Out Visit Request"
      description={`National Night Out occurs annually on ${NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL}. Residents can request a visit from Cove Fire & Rescue for their neighborhood or community gathering.`}
      narrow
    >
      <section className="mb-10">
        <Card>
          <p className="leading-relaxed text-brand-gray">
            This is Cove Fire &amp; Rescue&apos;s own National Night Out request system. It is not
            associated with or dependent upon the Sheriff&apos;s Department or any other agency.
            Completing this form asks our department to consider visiting your event based on
            staffing and emergency response needs.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-brand-gray">{NATIONAL_NIGHT_OUT_DISCLAIMER}</p>
        </Card>
      </section>

      <section className="mb-12">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            title="Request a Department Visit"
            subtitle="Provide event details so the department can review availability."
            className="mb-0 sm:mb-0"
          />
          <Button href="/national-night-out/status" variant="outline" size="sm" className="shrink-0">
            Check Request Status
          </Button>
        </div>

        {loading ? (
          <Card>
            <SkeletonForm />
          </Card>
        ) : error ? (
          <AlertBanner variant="error" title="Unable to load form">
            {error}
          </AlertBanner>
        ) : !enabled ? (
          <AlertBanner variant="info" title="Requests are not open">
            National Night Out visit requests are not currently being accepted. Please check back
            later, or contact the department for non-emergency questions.
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/contact" variant="outline" size="sm">
                Contact the Department
              </Button>
              <Button href="/national-night-out/status" variant="ghost" size="sm">
                Check Request Status
              </Button>
            </div>
          </AlertBanner>
        ) : (
          <Card>
            <NationalNightOutForm />
          </Card>
        )}
      </section>
    </PageShell>
  );
}
