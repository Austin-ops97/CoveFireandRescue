import type { ReactNode } from "react";
import { SectionLabel } from "@/components/site/SectionLabel";

interface PageShellProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  narrow?: boolean;
  actions?: ReactNode;
}

export function PageShell({
  title,
  description,
  eyebrow,
  children,
  narrow = false,
  actions,
}: PageShellProps) {
  return (
    <div
      className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14 ${
        narrow ? "max-w-3xl" : "max-w-7xl"
      }`}
    >
      <header className="mb-8 border-b border-gray-200 pb-8 sm:mb-10 sm:pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
            <h1 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-gray-500 sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">{actions}</div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
