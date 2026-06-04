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
  default: "border-gray-200 bg-white shadow-ui",
  muted: "border-gray-200 bg-gray-50 shadow-none",
  accent: "border-blue-700/15 bg-blue-700/[0.03] shadow-none",
  elevated: "border-gray-200 bg-white shadow-ui",
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
          ? "transition-[box-shadow,transform,border-color] duration-200 hover:border-gray-200 hover:shadow-ui-lg motion-safe:hover:-translate-y-0.5"
          : ""
      } ${className}`}
    >
      {children}
    </Component>
  );
}
