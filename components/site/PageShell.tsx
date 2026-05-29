import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  narrow?: boolean;
}

export function PageShell({ title, description, children, narrow = false }: PageShellProps) {
  return (
    <div className={`mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${narrow ? "max-w-3xl" : "max-w-7xl"}`}>
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-brand-charcoal sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-3xl text-lg text-brand-gray">{description}</p>
        )}
        <div className="mt-4 h-1 w-20 bg-brand-red" aria-hidden />
      </header>
      {children}
    </div>
  );
}
