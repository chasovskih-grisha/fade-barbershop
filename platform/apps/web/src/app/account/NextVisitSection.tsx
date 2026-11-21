'use client';

import { NextVisitCard } from './NextVisitCard';
import type { VisitSummary } from './useVisitSummary';

/**
 * Секція «Найближчий візит» профілю (T-4716b). Список візитів вантажить
 * `useVisitSummary` один раз на сторінку (T-4734b) — тут лише стани: поки
 * вантажиться один спокійний рядок, запит упав — картки немає.
 */
export function NextVisitSection({ summary }: { summary: VisitSummary }) {
  if (summary.state === 'error') return null;
  if (summary.state === 'loading') {
    return (
      <div data-testid="next-visit-loading" aria-live="polite">
        <p role="status" className="px-1 text-body-s text-fg-secondary">
          Завантаження найближчого візиту…
        </p>
      </div>
    );
  }
  return (
    <div data-testid="next-visit-container">
      <NextVisitCard visit={summary.nextVisit} />
    </div>
  );
}
