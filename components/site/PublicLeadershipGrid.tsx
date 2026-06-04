"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonGrid } from "@/components/ui";
import { fetchPublicLeadership } from "@/lib/leadership/client";
import type { LeadershipMemberRecord } from "@/lib/leadership/types";

function PublicLeadershipCard({ member }: { member: LeadershipMemberRecord }) {
  return (
    <Card className="flex h-full flex-col">
      {member.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoUrl}
          alt={`${member.name} portrait`}
          className="mb-4 aspect-[4/5] w-full rounded-md object-cover"
        />
      ) : (
        <div
          className="mb-4 flex aspect-[4/5] w-full items-center justify-center rounded-md bg-brand-gray-light text-brand-gray"
          aria-label={`Photo placeholder for ${member.name}`}
        >
          <span className="text-sm font-medium">Photo coming soon</span>
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-orange">{member.rank}</p>
      <h3 className="mt-1 text-xl font-bold text-brand-charcoal">{member.name}</h3>
      {member.title ? (
        <p className="mt-1 text-sm font-medium text-brand-gray">{member.title}</p>
      ) : null}
      {member.bio ? (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-gray">{member.bio}</p>
      ) : null}
      {(member.email || member.phone) && (
        <ul className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm text-brand-gray">
          {member.email ? (
            <li>
              <a
                href={`mailto:${member.email}`}
                className="font-medium text-brand-blue hover:underline"
              >
                {member.email}
              </a>
            </li>
          ) : null}
          {member.phone ? (
            <li>
              <a href={`tel:${member.phone}`} className="font-medium text-brand-blue hover:underline">
                {member.phone}
              </a>
            </li>
          ) : null}
        </ul>
      )}
    </Card>
  );
}

export function PublicLeadershipGrid() {
  const [leadership, setLeadership] = useState<LeadershipMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await fetchPublicLeadership();
        if (!cancelled) setLeadership(items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load leadership.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <SkeletonGrid count={4} />;
  }

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load leadership">
        {error}
      </AlertBanner>
    );
  }

  if (leadership.length === 0) {
    return (
      <EmptyState
        title="Leadership profiles coming soon"
        description="Command staff bios will be published here as they are added by department leadership."
      />
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {leadership.map((member) => (
        <PublicLeadershipCard key={member.id} member={member} />
      ))}
    </div>
  );
}
