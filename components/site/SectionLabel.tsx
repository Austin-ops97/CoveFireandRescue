interface SectionLabelProps {
  children: string;
  className?: string;
  dark?: boolean;
}

/** Small gold accent label above section titles */
export function SectionLabel({ children, className = "", dark = false }: SectionLabelProps) {
  return (
    <p
      className={`mb-3 text-[0.82rem] font-extrabold uppercase tracking-[0.12em] ${
        dark ? "text-gold-500" : "text-gold-600"
      } ${className}`}
    >
      {children}
    </p>
  );
}
