import { Card } from "@/components/site/Card";
import type { LeadershipMember } from "@/lib/types";

interface LeadershipCardProps {
  member: LeadershipMember;
}

export function LeadershipCard({ member }: LeadershipCardProps) {
  return (
    <Card className="flex flex-col">
      <div
        className="mb-4 flex aspect-[4/5] w-full items-center justify-center rounded-md bg-brand-gray-light text-brand-gray"
        aria-label={`Photo placeholder for ${member.name}`}
      >
        <span className="text-sm font-medium">Photo</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-red">
        {member.rank}
      </p>
      <h3 className="mt-1 text-xl font-bold text-brand-charcoal">{member.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-gray">{member.bio}</p>
    </Card>
  );
}
