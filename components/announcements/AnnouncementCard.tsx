import { Badge } from "@/components/site/Badge";
import { Card } from "@/components/site/Card";
import type { Announcement } from "@/lib/types";

interface AnnouncementCardProps {
  announcement: Announcement;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Card hover>
      <div className="flex flex-wrap items-center gap-2">
        <Badge label={announcement.category} category={announcement.category} />
        <time className="text-sm text-brand-gray" dateTime={announcement.date}>
          {formatDate(announcement.date)}
        </time>
      </div>
      <h3 className="mt-3 text-lg font-bold text-brand-charcoal">{announcement.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-gray">{announcement.excerpt}</p>
    </Card>
  );
}
