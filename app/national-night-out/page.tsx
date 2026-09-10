import type { Metadata } from "next";
import { NationalNightOutRequestPage } from "@/components/site/NationalNightOutRequestPage";
import { siteConfig } from "@/lib/config/site";
import { NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL } from "@/lib/national-night-out/types";

export const metadata: Metadata = {
  title: "National Night Out Visit Request",
  description: `Request a Cove Fire & Rescue visit for your neighborhood or community National Night Out event on ${NATIONAL_NIGHT_OUT_EVENT_DATE_LABEL}.`,
  keywords: [...siteConfig.seo.keywords, "National Night Out", "community event"],
};

export default function NationalNightOutPage() {
  return <NationalNightOutRequestPage />;
}
