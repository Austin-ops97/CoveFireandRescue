export function EmergencyBanner() {
  return (
    <div
      role="alert"
      className="bg-red-700 px-4 py-2.5 text-center text-[0.95rem] font-bold text-white"
    >
      For emergencies, call{" "}
      <a
        href="tel:911"
        className="underline underline-offset-2 hover:text-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-red-700"
      >
        911
      </a>
      .
    </div>
  );
}
