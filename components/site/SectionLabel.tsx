interface SectionLabelProps {
  children: string;
  className?: string;
}

/** Small gold accent label above section titles */
export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p
      className={`mb-2 inline-block rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-charcoal ${className}`}
    >
      {children}
    </p>
  );
}
