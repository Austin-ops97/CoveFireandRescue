"use client";

import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  /** When true, section is always expanded (desktop behavior passthrough) */
  forceOpen?: boolean;
};

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
  className = "",
  badge,
  forceOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((current) => !current)}
        className={`flex w-full min-h-11 items-start justify-between gap-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 ${
          forceOpen ? "cursor-default" : "hover:bg-gray-50/80"
        }`}
        aria-expanded={isOpen}
        disabled={forceOpen}
      >
        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-brand-charcoal">{title}</h3>
            {badge}
          </div>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-brand-gray">{description}</p>
          ) : null}
        </div>
        {!forceOpen && (
          <svg
            className={`mt-1 h-5 w-5 shrink-0 text-brand-gray transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}
