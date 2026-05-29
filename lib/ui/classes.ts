/** Shared Tailwind class strings for consistent UI across the app. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2";

export const inputBase =
  `w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-charcoal shadow-sm transition-[border-color,box-shadow] placeholder:text-brand-gray/70 hover:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 ${focusRing}`;

export const selectBase = `${inputBase} cursor-pointer`;

export const textareaBase = `${inputBase} min-h-[7rem] resize-y`;

export const labelBase = "block text-sm font-medium text-brand-charcoal";

export const hintBase = "mt-1.5 text-xs leading-relaxed text-brand-gray";

export const formErrorBase = "mt-1.5 text-sm font-medium text-brand-red";

export const checkboxBase =
  "h-4 w-4 shrink-0 rounded border-gray-300 text-brand-red focus:ring-brand-red/40";

export const formGrid = "grid gap-5 sm:grid-cols-2";

export const formStack = "space-y-5";

export const pageSection = "space-y-8";

export const cardList = "space-y-4";

/** @deprecated Use inputBase — kept for incremental migration */
export const inputClassName = inputBase;
