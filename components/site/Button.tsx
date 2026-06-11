import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "navCta"
  /** Gold primary CTA on dark backgrounds */
  | "heroPrimary"
  /** Transparent white border — secondary on dark backgrounds */
  | "heroSecondary"
  /** White fill, navy text — tertiary on dark backgrounds */
  | "heroTertiary";

type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-gold-500 bg-gold-500 text-text-dark shadow-sm hover:border-gold-600 hover:bg-gold-600 hover:text-white focus-visible:ring-gold-500/50",
  secondary:
    "border border-navy-900 bg-navy-900 text-white shadow-sm hover:border-navy-800 hover:bg-navy-800 focus-visible:ring-navy-900/40",
  outline:
    "border border-gray-200 bg-white text-text-dark shadow-sm hover:border-gray-300 hover:bg-gray-100 focus-visible:ring-blue-700/30",
  ghost:
    "text-text-dark hover:bg-gray-100 focus-visible:ring-gray-500/30",
  danger:
    "bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:ring-red-700/40",
  navCta:
    "border border-navy-900 bg-navy-900 text-white shadow-sm hover:border-navy-800 hover:bg-navy-800 focus-visible:ring-navy-900/40",
  heroPrimary:
    "border border-gold-500 bg-gold-500 text-text-dark shadow-md hover:border-gold-600 hover:bg-gold-600 hover:text-white focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
  heroSecondary:
    "border border-white/25 bg-white/10 text-white shadow-md hover:border-white/35 hover:bg-white/18 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
  heroTertiary:
    "!border-white !bg-white !text-navy-900 shadow-md visited:!text-navy-900 active:!text-navy-900 hover:!border-white hover:!bg-gray-100 hover:!text-navy-900 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 gap-1.5 px-3 py-2 text-sm",
  md: "min-h-10 gap-2 px-4 py-2.5 text-sm",
  lg: "min-h-12 gap-2 px-5 py-3 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-[10px] font-bold transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

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
