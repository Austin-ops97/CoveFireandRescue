import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${
        hover ? "transition-shadow hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
