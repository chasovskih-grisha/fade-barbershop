'use client';

import { useEffect, useState } from 'react';
import { getAppointments, type ExtendedAppointment } from '@/lib/api/appointments';
import { useAuth } from '../components/auth/AuthProvider';
import { countPastVisits, pickNextVisit } from './next-visit';

export type VisitSummaryState = 'loading' | 'ready' | 'error';

export interface VisitSummary {
  state: VisitSummaryState;
  nextVisit: ExtendedAppointment | null;
  pastCount: number;
}

/**
 * Один список візитів на профіль (T-4716b, T-4734b): і найближчий візит, і
 * кількість минулих читаються з того самого `getAppointments`, без другого
 * запиту. Помилка не блокує профіль — стан 'error' ховає обидві похідні.
 */
export function useVisitSummary(): VisitSummary {
  const { isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<VisitSummary>({
    state: 'loading',
    nextVisit: null,
    pastCount: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setSummary((prev) => ({ ...prev, state: 'loading' }));
    getAppointments()
      .then((list) => {
        if (!active) return;
        setSummary({
          state: 'ready',
          nextVisit: pickNextVisit(list),
          pastCount: countPastVisits(list),
        });
      })
      .catch(() => {
        if (active) setSummary((prev) => ({ ...prev, state: 'error' }));
      });
    return () => {
      active = false;
    };
  }, [authLoading]);

  return summary;
}
