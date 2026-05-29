import type { Announcement } from "@/lib/types";

export const announcements: Announcement[] = [
  {
    id: "1",
    title: "Welcome to Cove Fire & Rescue",
    excerpt:
      "Our new department website is live. Check back for community notices, training updates, and department news.",
    date: "2026-05-01",
    category: "Department Update",
  },
  {
    id: "2",
    title: "Community Open House — Date TBA",
    excerpt:
      "Join us for a station tour and meet our volunteers. Date and time will be announced soon.",
    date: "2026-05-15",
    category: "Event",
  },
  {
    id: "3",
    title: "Monthly Training Night",
    excerpt:
      "All members: training session scheduled for the first Tuesday of each month. Details posted in member area.",
    date: "2026-05-10",
    category: "Training",
  },
  {
    id: "4",
    title: "Burn Ban Status — Check Before Burning",
    excerpt:
      "Always verify current burn ban status with local authorities before any outdoor burning.",
    date: "2026-05-20",
    category: "Burn Ban",
  },
  {
    id: "5",
    title: "Road Closure Near Station — Plan Alternate Routes",
    excerpt:
      "Temporary road work may affect access to the station. Use alternate routes when responding or visiting.",
    date: "2026-05-18",
    category: "Community Notice",
  },
];
