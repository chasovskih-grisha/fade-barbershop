'use client';

import { useEffect, useState } from 'react';
import { getAppointments, type ExtendedAppointment } from '@/lib/api/appointments';
import { useAuth } from '../components/auth/AuthProvider';
import { pickNextVisit } from './next-visit';

export type NextVisitState = 'loading' | 'ready' | 'error';

export interface NextVisit {
  state: NextVisitState;
  visit: ExtendedAppointment | null;
}

/**
 * Найближчий візит профілю (T-4716b). Читає той самий список, що сторінка
 * візитів (`getAppointments`), не додаючи другого ендпоінта. Помилка не
 * блокує профіль: стан 'error' лишає картку поза сторінкою.
 */
export function useNextVisit(): NextVisit {
  const { isLoading: authLoading } = useAuth();
  const [state, setState] = useState<NextVisitState>('loading');
  const [visit, setVisit] = useState<ExtendedAppointment | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setState('loading');
    getAppointments()
      .then((list) => {
        if (!active) return;
        setVisit(pickNextVisit(list));
        setState('ready');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [authLoading]);

  return { state, visit };
}
