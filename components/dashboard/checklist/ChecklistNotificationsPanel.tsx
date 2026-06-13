"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/site/Button";
import { Card } from "@/components/site/Card";
import { AlertBanner, EmptyState, SkeletonCardList, StatusBadge } from "@/components/ui";
import { mobileActionStack } from "@/lib/ui/classes";
import {
  acknowledgeChecklistNotification,
  fetchChecklistNotifications,
} from "@/lib/notifications/client";
import {
  getChecklistScopeLabel,
  type ChecklistNotificationRecord,
} from "@/lib/checklist/types";

function formatTimestamp(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  }
  return "—";
}

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-green-600"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function NotificationCard({
  notification,
  acknowledging,
  onAcknowledge,
}: {
  notification: ChecklistNotificationRecord;
  acknowledging: boolean;
  onAcknowledge: (id: string) => void;
}) {
  const isUnread = notification.status === "unread";
  const isDeleted = notification.status === "submission_deleted";

  return (
    <Card
      className={
        isUnread
          ? "border-l-4 border-l-brand-red bg-red-50/40"
          : isDeleted
            ? "border-l-4 border-l-gray-300 opacity-80"
            : "border-l-4 border-l-green-600"
      }
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {isUnread && <StatusBadge label="Unread" variant="attention" />}
          {notification.hasAttention && (
            <StatusBadge label="Needs attention" variant="attention" />
          )}
          {!notification.hasAttention && isUnread && (
            <StatusBadge label="Clear" variant="pass" />
          )}
          {notification.status === "acknowledged" && (
            <StatusBadge label="Acknowledged" variant="pass" />
          )}
          {isDeleted && (
            <StatusBadge label="Submission Deleted" variant="neutral" />
          )}
          <StatusBadge
            label={getChecklistScopeLabel(notification.scope)}
            variant="neutral"
          />
        </div>

        <h3 className="mt-2 text-lg font-bold text-brand-charcoal">
          {notification.templateName}
        </h3>

        <p className="mt-1 text-sm text-brand-gray">
          {formatTimestamp(notification.createdAt)}
          {notification.submittedByName ? ` · ${notification.submittedByName}` : ""}
          {notification.relatedFleetUnitName ? ` · ${notification.relatedFleetUnitName}` : ""}
        </p>

        {notification.status === "acknowledged" && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
            <CheckIcon />
            <span>
              Acknowledged by {notification.acknowledgedByName ?? "Administrator"} on{" "}
              {formatTimestamp(notification.acknowledgedAt)}
            </span>
          </div>
        )}

        {isDeleted && notification.acknowledgedByName && (
          <p className="mt-2 text-sm text-brand-gray">
            Previously acknowledged by {notification.acknowledgedByName} on{" "}
            {formatTimestamp(notification.acknowledgedAt)}
          </p>
        )}
      </div>

      <div className={`mt-4 border-t border-gray-100 pt-4 ${mobileActionStack}`}>
          {isUnread && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              disabled={acknowledging}
              onClick={() => onAcknowledge(notification.id)}
            >
              {acknowledging ? "Acknowledging…" : "Acknowledge"}
            </Button>
          )}
          {!isDeleted && (
            <Button
              href={`/dashboard/rounds/review?submission=${encodeURIComponent(notification.submissionId)}`}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              View submission
            </Button>
          )}
        </div>
    </Card>
  );
}

export function ChecklistNotificationsPanel() {
  const [notifications, setNotifications] = useState<ChecklistNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const items = await fetchChecklistNotifications();
      setNotifications(items);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleAcknowledge(id: string) {
    setAcknowledgingId(id);
    setActionError(null);

    try {
      const updated = await acknowledgeChecklistNotification(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to acknowledge notification."
      );
    } finally {
      setAcknowledgingId(null);
    }
  }

  const unreadCount = notifications.filter((item) => item.status === "unread").length;

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href="/dashboard" className="font-medium text-brand-red hover:underline">
          ← Back to Dashboard
        </Link>
        {" · "}
        <Link href="/dashboard/rounds/review" className="font-medium text-brand-red hover:underline">
          Review submissions
        </Link>
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-charcoal">Checklist Notifications</h2>
          <p className="mt-1 text-sm text-brand-gray">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All notifications acknowledged"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => void loadNotifications()}
        >
          Refresh
        </Button>
      </div>

      {actionError && (
        <AlertBanner variant="error" title="Action failed">
          {actionError}
        </AlertBanner>
      )}

      {loading && <SkeletonCardList count={4} />}

      {loadError && (
        <AlertBanner variant="error" title="Could not load notifications">
          {loadError}
        </AlertBanner>
      )}

      {!loading && !loadError && notifications.length === 0 && (
        <EmptyState
          title="No notifications"
          description="New checklist submissions will appear here for administrator review."
        />
      )}

      {!loading &&
        !loadError &&
        notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            acknowledging={acknowledgingId === notification.id}
            onAcknowledge={handleAcknowledge}
          />
        ))}
    </div>
  );
}
