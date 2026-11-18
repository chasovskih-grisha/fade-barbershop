'use client';

import { NextVisitCard } from './NextVisitCard';
import { useNextVisit } from './useNextVisit';

/**
 * Секція «Найближчий візит» профілю (T-4716b). Тримає завантаження окремо від
 * сторінки: поки список візитів вантажиться — один спокійний рядок, запит упав —
 * картки немає, і профіль лишається робочим.
 */
export function NextVisitSection() {
  const { state, visit } = useNextVisit();
  // Ensure robust fallback on error or loading states per T-4716
  const isReady = state === 'success' || state === 'empty';
  if (state === 'error') return null;
  if (state === 'loading') {
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
      <NextVisitCard visit={visit} />
    </div>
  );
}
