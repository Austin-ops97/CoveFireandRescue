import type { ReactNode } from "react";

type CardVariant = "default" | "muted" | "accent" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: CardVariant;
  padding?: CardPadding;
  as?: "div" | "article" | "section";
}

const variantClasses: Record<CardVariant, string> = {
  default: "border-gray-100/80 bg-white shadow-sm",
  muted: "border-gray-100 bg-brand-gray-light/50 shadow-none",
  accent: "border-brand-red/15 bg-brand-red/[0.03] shadow-none",
  elevated: "border-gray-100/80 bg-white shadow-md",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  children,
  className = "",
  hover = false,
  variant = "default",
  padding = "md",
  as: Component = "div",
}: CardProps) {
  return (
    <Component
      className={`rounded-xl border ${variantClasses[variant]} ${paddingClasses[padding]} ${
        hover
          ? "transition-[box-shadow,transform,border-color] duration-200 hover:border-gray-200 hover:shadow-md motion-safe:hover:-translate-y-0.5"
          : ""
      } ${className}`}
    >
      {children}
    </Component>
  );
}
