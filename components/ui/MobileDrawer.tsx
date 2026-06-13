"use client";

import { useEffect, useRef, type ReactNode } from "react";

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
  id?: string;
  /** Tailwind breakpoint class prefix — drawer hidden at this breakpoint and above */
  hideAt?: "md" | "lg";
};

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  side = "left",
  id,
  hideAt = "md",
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const hideClass = hideAt === "lg" ? "lg:hidden" : "md:hidden";
  const positionClass = side === "left" ? "left-0 drawer-enter" : "right-0";

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] drawer-backdrop-enter ${hideClass}`}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={id}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Navigation menu"}
        className={`fixed inset-y-0 z-[70] flex w-[min(100vw-2.5rem,22rem)] flex-col bg-white shadow-2xl outline-none safe-area-top safe-area-bottom ${positionClass} ${hideClass}`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-bold text-navy-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] text-navy-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">{children}</div>
      </div>
    </>
  );
}
