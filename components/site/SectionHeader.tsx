interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  centered?: boolean;
  className?: string;
  dark?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  centered = false,
  className = "",
  dark = false,
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 sm:mb-10 ${centered ? "text-center" : ""} ${className}`}>
      {eyebrow && (
        <p
          className={`section-eyebrow mb-3 text-[0.82rem] font-extrabold uppercase tracking-[0.12em] ${
            dark ? "text-gold-500" : "text-gold-600"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`section-title text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2.05rem] ${
          dark ? "text-white" : "text-navy-900"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 max-w-2xl text-base leading-relaxed ${
            dark ? "text-white/75" : "text-gray-500"
          } ${centered ? "mx-auto" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
