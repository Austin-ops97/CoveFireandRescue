import type { ReactNode } from "react";
import { mobileActionStack } from "@/lib/ui/classes";

type MobileActionBarProps = {
  children: ReactNode;
  className?: string;
};

/** Sticky bottom action bar on mobile; inline on md+ */
export function MobileActionBar({ children, className = "" }: MobileActionBarProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] backdrop-blur-sm sticky-safe-bottom safe-area-bottom md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none ${className}`}
    >
      <div className={mobileActionStack}>{children}</div>
    </div>
  );
}
