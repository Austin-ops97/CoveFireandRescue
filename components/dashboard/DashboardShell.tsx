"use client";

import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNav />
      {children}
    </>
  );
}
