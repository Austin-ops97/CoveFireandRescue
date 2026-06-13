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
      className={`mx-auto px-4 py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-14 ${
        narrow ? "max-w-3xl" : "max-w-7xl"
      }`}
    >
      <header className="mb-6 border-b border-gray-200 pb-6 sm:mb-10 sm:pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
            <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-base leading-relaxed text-gray-500 sm:mt-3 sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:pt-1 [&>*]:w-full sm:[&>*]:w-auto">
              {actions}
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
