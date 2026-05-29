import type { ReactNode } from "react";
import { Card } from "@/components/site/Card";

export function InfoBanner({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Card variant="accent" padding="md" className={className}>
      <div className="text-sm leading-relaxed text-brand-gray">{children}</div>
    </Card>
  );
}
