export function EmergencyBanner() {
  return (
    <div
      role="alert"
      className="border-b border-brand-red-dark bg-brand-red px-4 py-2 text-center text-sm font-semibold text-white"
    >
      For emergencies, call{" "}
      <a href="tel:911" className="underline underline-offset-2 hover:text-brand-gold">
        911
      </a>
      .
    </div>
  );
}
