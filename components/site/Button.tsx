import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "navCta"
  /** Solid blue — hero primary CTA on dark backgrounds */
  | "heroPrimary"
  /** Solid gold — hero secondary CTA on dark backgrounds */
  | "heroSecondary"
  /** White fill, navy text — hero tertiary; hover gold + navy */
  | "heroTertiary";

type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-blue text-white shadow-sm hover:bg-brand-blue-dark focus-visible:ring-brand-blue/50",
  secondary:
    "bg-brand-gold text-brand-charcoal shadow-sm hover:bg-brand-gold-muted focus-visible:ring-brand-gold/50",
  outline:
    "border border-gray-200 bg-white text-brand-charcoal shadow-sm hover:border-brand-gold hover:bg-brand-gold/15 hover:text-brand-charcoal focus-visible:ring-brand-blue/30",
  ghost:
    "text-brand-charcoal hover:bg-brand-gray-light focus-visible:ring-brand-gray/30",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/40",
  navCta:
    "border-2 border-brand-gold bg-transparent text-brand-blue shadow-sm hover:bg-brand-gold hover:text-brand-charcoal focus-visible:ring-brand-gold/50",
  heroPrimary:
    "border-2 border-brand-blue bg-brand-blue text-white shadow-md hover:border-brand-blue-dark hover:bg-brand-blue-dark hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue",
  heroSecondary:
    "border-2 border-brand-gold bg-brand-gold text-brand-charcoal shadow-md hover:border-brand-gold-muted hover:bg-brand-gold-muted hover:text-brand-charcoal focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue",
  heroTertiary:
    "border-2 border-white bg-white text-brand-blue shadow-md hover:border-brand-gold hover:bg-brand-gold hover:text-brand-charcoal focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-blue",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-1.5 px-3 py-2 text-sm",
  md: "min-h-10 gap-2 px-4 py-2.5 text-sm",
  lg: "min-h-12 gap-2 px-5 py-3 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = SharedProps & {
  href: string;
};

type ButtonAsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: never;
  };

type ButtonProps = ButtonAsLink | ButtonAsButton;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
