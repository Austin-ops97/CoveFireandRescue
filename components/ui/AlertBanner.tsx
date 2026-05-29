import type { ReactNode } from "react";
import { Button } from "@/components/site/Button";

type AlertVariant = "success" | "error" | "info" | "warning";

const styles: Record<AlertVariant, string> = {
  success: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950",
  error: "border-red-200/80 bg-red-50/80 text-red-950",
  info: "border-sky-200/80 bg-sky-50/80 text-sky-950",
  warning: "border-amber-200/80 bg-amber-50/80 text-amber-950",
};

type AlertBannerProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function AlertBanner({
  variant = "info",
  title,
  children,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: AlertBannerProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3.5 sm:px-5 ${styles[variant]} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {title && <p className="text-sm font-semibold">{title}</p>}
      <div className={`text-sm leading-relaxed ${title ? "mt-1 opacity-90" : ""}`}>
        {children}
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
