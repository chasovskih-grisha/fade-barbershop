// Шапка картки візиту: коли, статус і повернення в календар. Час — одним
// діапазоном (booking-format.timeRange), статус — українським підписом
// StatusPill; невідомий доменний код показуємо як є, щоб нічого не втратити.
'use client';

import Link from 'next/link';
import { StatusPill } from '@fade/ui';
import { timeRange } from './booking-format';
import { statusPillLabel, visitStatus } from './booking-status';
import type { BookingDetail } from './booking-types';

export function BookingHeader({ detail }: { detail: BookingDetail }) {
  // exactOptionalPropertyTypes не приймає label={undefined}: для відомого
  // статусу підпис бере компонент, невідомого показуємо кодом як є.
  const label = statusPillLabel(detail.status);
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-h3">Візит</h1>
          <StatusPill
            status={visitStatus(detail.status)}
            {...(label === undefined ? {} : { label })}
          />
        </div>
        <p className="mt-1 text-body text-fg-muted">
          {`${timeRange(detail.start, detail.end)} · ${detail.durationMinutes} хв`}
        </p>
      </div>
      <Link
        href="/calendar"
        className="rounded-input border border-line px-3 py-2 text-body text-fg-secondary hover:bg-interactive"
      >
        До календаря
      </Link>
    </header>
  );
}
