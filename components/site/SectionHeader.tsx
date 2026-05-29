interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  centered = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""} ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight text-brand-charcoal sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-brand-gray sm:text-lg">{subtitle}</p>
      )}
      <div
        className={`mt-3 h-1 w-16 bg-brand-red ${centered ? "mx-auto" : ""}`}
        aria-hidden
      />
    </div>
  );
}
