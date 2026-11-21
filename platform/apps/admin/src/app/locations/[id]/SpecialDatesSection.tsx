'use client';

// Особливі дати локації (§1.5, T-4525a): read-only список дат, де виняток
// перекриває тижневий графік. Дані дає T-4414 (WorkdayException); тут лише
// огляд, редагування — у календарі (§5).
import { Badge } from '@fade/ui';

export interface SpecialDateItem {
  date: string; // 'YYYY-MM-DD'
  closed: boolean;
  open: string | null; // 'HH:MM' — лише коли не closed
  close: string | null;
  reason: string;
}

export default function SpecialDatesSection({
  exceptions = [],
}: {
  exceptions?: SpecialDateItem[] | undefined;
}) {
  return (
    <section
      aria-label="Особливі дати локації"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <h2 className="font-display text-h4">Особливі дати</h2>

      {exceptions.length === 0 ? (
        <p className="text-body text-fg-muted">Особливих дат немає.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {exceptions.map((item) => (
            <li key={item.date} className="flex items-center justify-between gap-3">
              <span className="text-body">
                {item.date} · {item.reason}
              </span>
              <Badge tone={item.closed ? 'warning' : 'neutral'}>
                {item.closed ? 'Зачинено' : `${item.open ?? ''}–${item.close ?? ''}`}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
