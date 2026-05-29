import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-red text-white shadow-sm hover:bg-brand-red-dark focus-visible:ring-brand-red/50",
  secondary:
    "bg-brand-charcoal text-white shadow-sm hover:bg-brand-charcoal-light focus-visible:ring-brand-charcoal/40",
  outline:
    "border border-gray-200 bg-white text-brand-charcoal shadow-sm hover:border-gray-300 hover:bg-brand-gray-light focus-visible:ring-brand-red/30",
  ghost:
    "text-brand-charcoal hover:bg-brand-gray-light focus-visible:ring-brand-gray/30",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/40",
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
