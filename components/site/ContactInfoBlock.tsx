import { siteConfig } from "@/lib/config/site";

export function ContactInfoBlock({ compact = false }: { compact?: boolean }) {
  const { contact, hours } = siteConfig;

  return (
    <dl className={`space-y-4 text-sm ${compact ? "space-y-3" : ""}`}>
      {contact.showAddressPublicly && (
        <div>
          <dt className="font-semibold text-brand-charcoal">Station Address</dt>
          <dd className="mt-1 text-brand-gray">
            <address className="not-italic">{contact.address.full}</address>
          </dd>
        </div>
      )}
      <div>
        <dt className="font-semibold text-brand-charcoal">Phone</dt>
        <dd className="mt-1">
          <a href={`tel:${contact.publicPhoneTel}`} className="text-brand-blue hover:underline">
            {contact.publicPhone}
          </a>
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-brand-charcoal">Email</dt>
        <dd className="mt-1">
          <a href={`mailto:${contact.publicEmail}`} className="text-brand-blue hover:underline">
            {contact.publicEmail}
          </a>
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-brand-charcoal">Station Hours</dt>
        <dd className="mt-1 text-brand-gray">
          <ul className="space-y-1">
            {hours.schedule.map((entry) => (
              <li key={entry.day}>
                <span className="font-medium text-brand-charcoal">{entry.day}:</span> {entry.hours}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs leading-relaxed">{hours.note}</p>
        </dd>
      </div>
    </dl>
  );
}
