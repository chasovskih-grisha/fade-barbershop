'use client';
// Hook графіка барбера (T-LOC-гейт): завантаження вікон локації,
// оновлення дня і збереження PATCH-ом. Стани й помилки — тут.
import { useEffect, useState } from 'react';

export type AvailabilityWindow = { dayOfWeek: number; start: string; end: string };

export function useAvailability(barberId: string, locationId: string) {
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!locationId) return;
    setWindows([]);
    void fetch(`/admin/barbers/${barberId}/availability/${locationId}`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setWindows((await response.json())?.windows ?? []);
        setError('');
      })
      .catch(() => setError('Не вдалося завантажити графік'));
  }, [barberId, locationId]);

  /** Оновлює один із двох слотів дня (порожні створюються за потреби). */
  const update = (
    dayOfWeek: number,
    index: number,
    change: Partial<Pick<AvailabilityWindow, 'start' | 'end'>>
  ) => {
    setWindows((prev) => {
      const day = prev.filter((w) => w.dayOfWeek === dayOfWeek);
      // prettier-ignore
      const next: AvailabilityWindow[] = [0, 1].map((slot) => day[slot] ?? { dayOfWeek, start: '', end: '' });
      next[index] = { dayOfWeek, start: '', end: '', ...next[index], ...change };
      return [...prev.filter((w) => w.dayOfWeek !== dayOfWeek), ...next];
    });
  };

  /** PATCH; true — успіх, string — повідомлення помилки (валідація або API). */
  const save = async (): Promise<string | null> => {
    // prettier-ignore
    if (windows.some((w) => Boolean(w.start) !== Boolean(w.end))) return 'Заповніть обидва часи для кожного вікна або залиште його порожнім';
    const response = await fetch(`/admin/barbers/${barberId}/availability`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId, windows: windows.filter((w) => w.start && w.end) }),
    });
    if (response.ok) return null;
    const body = (await response.json()) as { message?: string };
    return body.message ?? 'Не вдалося зберегти графік';
  };

  return { windows, error, setError, update, save };
}
