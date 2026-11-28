import { StatusPill } from '../StatusPill';
import { TextField } from '../TextField';

const SECTIONS = ['Календар', 'Клієнти', 'Послуги', 'Барбери', 'Аналітика'];

const VISITS = [
  { time: '10:00', client: 'Олена', service: 'Стрижка', status: 'confirmed' as const },
  { time: '11:30', client: 'Ігор', service: 'Гоління', status: 'in_progress' as const },
  { time: '12:15', client: 'Марта', service: 'Борода', status: 'booked' as const },
];

/** Каркас адмінки: бічна навігація, пошук і список візитів дня. */
export function AdminShellPreview() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
      <nav
        aria-label="Розділи адмінки"
        className="flex flex-row flex-wrap gap-2 rounded-card border border-line bg-surface-sunken p-3 lg:flex-col lg:flex-nowrap"
      >
        {SECTIONS.map((section, index) => (
          <span
            key={section}
            aria-current={index === 0 ? 'page' : undefined}
            className={
              index === 0
                ? 'rounded-input bg-interactive px-3 py-2 text-sm font-medium text-fg'
                : 'rounded-input px-3 py-2 text-sm text-fg-secondary'
            }
          >
            {section}
          </span>
        ))}
      </nav>

      <section aria-label="Візити дня" className="flex flex-col gap-4">
        <TextField label="Пошук клієнта" placeholder="Ім’я або телефон" className="max-w-xs" />
        <ul className="list-none divide-y divide-line overflow-hidden rounded-card border border-line bg-surface-raised">
          {VISITS.map((visit) => (
            <li key={visit.time} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-14 text-body tabular-nums text-fg">{visit.time}</span>
              <span className="flex-1 text-body text-fg">{visit.client}</span>
              <span className="text-sm text-fg-muted">{visit.service}</span>
              <StatusPill status={visit.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
