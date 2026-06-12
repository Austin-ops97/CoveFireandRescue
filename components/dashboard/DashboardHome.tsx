"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertBanner, SkeletonGrid } from "@/components/ui";
import {
  DashboardSection,
  DashboardStatCard,
} from "@/components/dashboard/home/DashboardStatCard";
import { EmptyDashboardState } from "@/components/dashboard/home/EmptyDashboardState";
import { QuickActionGrid, type QuickAction } from "@/components/dashboard/home/QuickActionGrid";
import { RecentSubmissionsList } from "@/components/dashboard/home/RecentSubmissionsList";
import { useAuth } from "@/hooks/useAuth";
import { canManageContent } from "@/lib/auth/roles";
import { fetchDashboardSummary } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";

const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Submit checklist",
    description: "Complete a digital rounds or inspection form.",
    href: "/dashboard/rounds",
    emphasis: true,
  },
  {
    title: "Review submissions",
    description: "Inspect failed answers and flagged items.",
    href: "/dashboard/rounds/review",
  },
  {
    title: "Manage checklist templates",
    description: "Build and update reusable inspection sheets.",
    href: "/dashboard/checklist-templates",
  },
  {
    title: "Manage fleet",
    description: "Update apparatus details and photos.",
    href: "/dashboard/fleet",
  },
  {
    title: "Manage announcements",
    description: "Publish department news and notices.",
    href: "/dashboard/announcements",
  },
  {
    title: "Manage users",
    description: "Control member access and roles.",
    href: "/dashboard/users",
  },
  {
    title: "File library",
    description: "Upload and manage department documents.",
    href: "/dashboard/file-library",
  },
  {
    title: "Training records",
    description: "Track member hours and certifications.",
    href: "/dashboard/training-records",
  },
  {
    title: "Equipment tracking",
    description: "Manage gear inventory and maintenance.",
    href: "/dashboard/equipment-tracking",
  },
];

const MEMBER_QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Submit inspection",
    description: "Start a new digital rounds or checklist submission.",
    href: "/dashboard/rounds",
    emphasis: true,
  },
  {
    title: "Digital Rounds / Checklists",
    description: "Browse available inspection templates.",
    href: "/dashboard/rounds",
  },
  {
    title: "My History",
    description: "Review your past submissions and photos.",
    href: "/dashboard/rounds/history",
  },
];

export function DashboardHome() {
  const { role, profile } = useAuth();
  const isAdmin = canManageContent(role);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardSummary();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard summary.");
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

  const greeting = profile?.displayName
    ? `Welcome back, ${profile.displayName}`
    : "Welcome back";

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-brand-charcoal">{greeting}</h2>
          <p className="mt-1 text-sm text-brand-gray">Loading dashboard overview…</p>
        </div>
        <SkeletonGrid count={isAdmin ? 6 : 3} />
      </div>
    );
  }

  if (error) {
    return (
      <AlertBanner variant="error" title="Could not load dashboard overview">
        {error}
      </AlertBanner>
    );
  }

  if (!summary) {
    return null;
  }

  if (summary.role === "admin") {
    return (
      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-bold text-brand-charcoal">{greeting}</h2>
          <p className="mt-1 text-sm text-brand-gray">
            Operations overview for administrators.{" "}
            <Link href="/dashboard/rounds/review" className="font-medium text-brand-red hover:underline">
              Review flagged submissions
            </Link>
          </p>
        </div>

        <DashboardSection title="At a glance" description="Live counts across connected modules.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardStatCard
              label="Recent submissions"
              value={summary.recentSubmissionCount}
              hint="Last 30 days"
            />
            <DashboardStatCard
              label="Failed / flagged"
              value={summary.failedSubmissionCount}
              variant={summary.failedSubmissionCount > 0 ? "attention" : "default"}
              hint="Submissions needing attention"
            />
            <DashboardStatCard
              label="Active templates"
              value={summary.checklistTemplateCount}
            />
            <DashboardStatCard label="Fleet units" value={summary.fleetCount} />
            <DashboardStatCard label="Published announcements" value={summary.announcementCount} />
            <DashboardStatCard label="Leadership profiles" value={summary.leadershipCount} />
            <DashboardStatCard label="Library files" value={summary.documentCount} />
            <DashboardStatCard label="Training records" value={summary.trainingRecordCount} />
            <DashboardStatCard label="Active equipment" value={summary.equipmentCount} />
          </div>
        </DashboardSection>

        <DashboardSection
          title="Recent checklist submissions"
          description="Latest inspections from all members."
        >
          <RecentSubmissionsList
            submissions={summary.recentSubmissions}
            showInspector
            detailHref="/dashboard/rounds/review"
          />
        </DashboardSection>

        <DashboardSection title="Quick actions" description="Jump to common admin tasks.">
          <QuickActionGrid actions={ADMIN_QUICK_ACTIONS} />
        </DashboardSection>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-brand-charcoal">{greeting}</h2>
        <p className="mt-1 text-sm text-brand-gray">
          Submit inspections and review your submission history.
        </p>
      </div>

      <DashboardSection title="Your activity" description="Summary of your checklist work.">
        <div className="grid gap-3 sm:grid-cols-3">
          <DashboardStatCard
            label="Available checklists"
            value={summary.availableTemplateCount}
          />
          <DashboardStatCard
            label="Recent submissions"
            value={summary.myRecentSubmissionCount}
            hint="Last 30 days"
          />
          <DashboardStatCard
            label="Failed / flagged"
            value={summary.myFailedSubmissionCount}
            variant={summary.myFailedSubmissionCount > 0 ? "attention" : "success"}
            hint="Items needing follow-up"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="My recent submissions">
        {summary.recentSubmissions.length === 0 ? (
          <EmptyDashboardState
            title="No submissions yet"
            description="Complete your first inspection to see it listed here."
            actionLabel="Submit inspection"
            actionHref="/dashboard/rounds"
          />
        ) : (
          <RecentSubmissionsList submissions={summary.recentSubmissions} />
        )}
      </DashboardSection>

      <DashboardSection title="What you can do">
        <QuickActionGrid actions={MEMBER_QUICK_ACTIONS} />
      </DashboardSection>
    </div>
  );
}
