// Слоти для обраних дати і барбера (T-4409): завантаження, помилка, вибір.
// Відокремлено від JSX форми (VisitFormFields): уся мережева логіка — тут.
// useEffect перезавантажує слоти щоразу, коли змінюється вхід (enabled, дата,
// барбер, локація); окремий виклик з onChange не потрібен і був би подвійним.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AvailableSlotDto } from './types';

interface UseVisitSlotsInput {
  /** refsState === 'ready' — довідники завантажені, можна питати слоти. */
  ready: boolean;
  locationId: string;
  serviceId: string;
  /** Тривалість обраної послуги — нею міряються слоти (T-4738b). */
  duration: number;
  date: string;
  barberId: string;
}

export function useVisitSlots({
  ready,
  locationId,
  serviceId,
  duration,
  date,
  barberId,
}: UseVisitSlotsInput) {
  const [slots, setSlots] = useState<AvailableSlotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<AvailableSlotDto | null>(null);

  const load = useCallback(async () => {
    // Порожні поля/порожні довідники → запиту немає (той самий гвард, що й був).
    // Слоти міряються тривалістю послуги, тож без неї запиту теж немає (T-4738b).
    if (!ready || !locationId || !serviceId || !duration || !date || !barberId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/admin/bookings/slots', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, serviceId, date, barberId }),
      });
      if (!res.ok) throw new Error('slots');
      const rows = (await res.json()) as AvailableSlotDto[];
      setSlots(rows);
      // Вибраний слот лишається, лише якщо він ще є в оновленому списку.
      setPicked(
        (current) => rows.find((s) => s.start === current?.start && s.end === current?.end) ?? null
      );
    } catch {
      // Дефект залишкового слота: без скидання приховане значення можна було
      // б відправити, хоч слоти недоступні.
      setSlots([]);
      setPicked(null);
      setError('Не вдалося завантажити слоти');
    } finally {
      setLoading(false);
    }
  }, [ready, locationId, serviceId, duration, date, barberId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { slots, loading, error, picked, setPicked, reload: load };
}
