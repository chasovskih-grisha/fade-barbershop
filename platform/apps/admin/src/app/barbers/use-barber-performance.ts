'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeBarberPerformance } from './barber-performance-normalizer';
import type { BarberPerformanceData } from './barber-performance-types';

export type { BarberPerformanceData, VacationRequest } from './barber-performance-types';

export function useBarberPerformance(barberId: string) {
  const [data, setData] = useState<BarberPerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittingVacation, setSubmittingVacation] = useState(false);

  const fetchPerformance = useCallback(async () => {
    if (!barberId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/admin/barbers/${barberId}/performance`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Не вдалося завантажити дані продуктивності');
      const json = (await res.json()) as Partial<BarberPerformanceData> | null;
      setData(normalizeBarberPerformance(json));
    } catch {
      setData(normalizeBarberPerformance(null));
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useEffect(() => {
    void fetchPerformance();
  }, [fetchPerformance]);

  const requestVacation = async (
    startDate: string,
    endDate: string,
    reason: string
  ): Promise<boolean> => {
    setSubmittingVacation(true);
    setError('');
    try {
      const res = await fetch(`/admin/barbers/${barberId}/vacation-requests`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      if (!res.ok) {
        setError('Не вдалося надіслати запит на відпустку');
        return false;
      }
      await fetchPerformance();
      return true;
    } catch {
      setError('Не вдалося надіслати запит на відпустку');
      return false;
    } finally {
      setSubmittingVacation(false);
    }
  };

  return { data, loading, error, submittingVacation, requestVacation, reload: fetchPerformance };
}
