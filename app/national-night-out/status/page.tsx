import type { Metadata } from "next";
import { NationalNightOutStatusLookupPage } from "@/components/site/NationalNightOutStatusLookupPage";

export const metadata: Metadata = {
  title: "Check Night Out Request Status",
  description:
    "Look up your Cove Fire & Rescue National Night Out visit request status using your Request ID and email.",
};

export default function NationalNightOutStatusPage() {
  return <NationalNightOutStatusLookupPage />;
}
