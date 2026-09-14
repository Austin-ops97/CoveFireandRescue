"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { fetchNationalNightOutSettings } from "@/lib/national-night-out/client";
import { NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL } from "@/lib/national-night-out/types";

export function NationalNightOutBanner() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const settings = await fetchNationalNightOutSettings();
        if (!cancelled) {
          setEnabled(settings.enabled);
        }
      } catch {
        if (!cancelled) {
          setEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || !enabled) {
    return null;
  }

  return (
    <section
      aria-label="National Night Out visit requests"
      className="border-b border-gray-200 bg-gray-100"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.1em] text-navy-900">
            National Night Out — {NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL}
          </p>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-brand-gray sm:text-base">
            We&apos;re now accepting requests for our department to visit your neighborhood or
            community event during National Night Out.
          </p>
        </div>
        <div className="shrink-0">
          <Button href="/national-night-out" variant="secondary" size="md" className="w-full sm:w-auto">
            Request a Visit
          </Button>
        </div>
      </div>
    </section>
  );
}
