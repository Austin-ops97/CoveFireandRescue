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
    <div className={`mb-8 sm:mb-10 ${centered ? "text-center" : ""} ${className}`}>
      <h2 className="border-b-2 border-brand-gold/35 pb-2 text-xl font-bold tracking-tight text-brand-blue sm:text-2xl lg:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-2 max-w-2xl text-base leading-relaxed text-brand-gray ${
            centered ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
