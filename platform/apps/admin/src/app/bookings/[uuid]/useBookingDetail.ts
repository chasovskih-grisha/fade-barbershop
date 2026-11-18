// Хук деталей візиту (/bookings/[uuid]): одна завантажувальна вимога
// GET /admin/bookings/:id. Відокремлено від розкладки за LOC-гейтом (ADR 0019).
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { BookingDetail } from './booking-types';

export function useBookingDetail() {
  const uuid = useParams().uuid as string;
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/admin/bookings/${uuid}`, { credentials: 'include' });
        if (res.status === 404) throw new Error('Візит не знайдено');
        if (!res.ok) throw new Error('Не вдалося завантажити візит');
        const data = (await res.json()) as BookingDetail;
        if (!cancelled) setDetail(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Помилка завантаження');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  return { detail, loading, error };
}
