"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/site/Button";

type MobileFilterPanelProps = {
  title: string;
  summary?: string;
  children: ReactNode;
  onApply?: () => void;
  applyLabel?: string;
};

/** Collapsible filter panel on mobile; always expanded on md+ */
export function MobileFilterPanel({
  title,
  summary,
  children,
  onApply,
  applyLabel = "Apply filters",
}: MobileFilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <span>
            {title}
            {summary ? ` · ${summary}` : ""}
          </span>
          <svg
            className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
        {open && (
          <div className="mt-4 space-y-4">
            {children}
            {onApply && (
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => {
                  onApply();
                  setOpen(false);
                }}
              >
                {applyLabel}
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="hidden md:block md:mt-4">{children}</div>
    </>
  );
}
