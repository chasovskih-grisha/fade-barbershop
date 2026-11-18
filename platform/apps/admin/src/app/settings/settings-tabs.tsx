'use client';

// Спільний перемикач розділів налаштувань: геокодування, підтвердження
// запису, нагадування про візит. Активний розділ — за pathname; вкладені
// маршрути теж гортаються.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { label: 'Геокодування', path: '/settings/geocoder' },
  { label: 'Підтвердження запису', path: '/settings/booking-confirmation' },
  { label: 'Нагадування про візит', path: '/settings/appointment-reminder' },
  { label: 'Політика депозиту', path: '/settings/deposit-policy' },
  { label: 'Ролі та права (RBAC)', path: '/settings/staff-roles' },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div role="tablist" aria-label="Розділи налаштувань" className="flex gap-2">
      {SECTIONS.map((section) => {
        const active = pathname === section.path || pathname.startsWith(`${section.path}/`);
        return (
          <Link
            key={section.path}
            href={section.path}
            role="tab"
            aria-selected={active}
            className={`rounded-pill px-4 py-2 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${
              active
                ? 'bg-interactive font-semibold text-fg'
                : 'bg-surface-raised text-fg-secondary hover:bg-interactive hover:text-fg'
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </div>
  );
}
