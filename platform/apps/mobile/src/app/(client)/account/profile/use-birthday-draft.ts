import { useEffect, useState } from 'react';
import { updateProfileBirthday, type Birthday } from '@/lib/api/identity';
import { clampDay } from './birthday';

function same(a: Birthday | null, b: Birthday | null): boolean {
  return a?.day === b?.day && a?.month === b?.month;
}

/** Стан картки дня народження (T-4730c): чернетка, збереження, очищення. */
export function useBirthdayDraft(initial: Birthday | null) {
  const [saved, setSaved] = useState<Birthday | null>(initial);
  const [day, setDay] = useState(initial?.day ?? 0);
  const [month, setMonth] = useState(initial?.month ?? 0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  // Профіль приходить після монтування картки — підставляємо збережену дату.
  useEffect(() => {
    setSaved(initial);
    setDay(initial?.day ?? 0);
    setMonth(initial?.month ?? 0);
  }, [initial]);

  const draft: Birthday | null = day > 0 && month > 0 ? { day, month } : null;

  // Скорочення місяця (31 → лютий) прибирає неможливий день, інакше PATCH
  // отримує 31 лютого і відмовляє.
  const pickMonth = (value: number) => {
    setMonth(value);
    setDay((current) => clampDay(current, value));
  };

  const persist = async (next: Birthday | null) => {
    setStatus('saving');
    try {
      const stored = await updateProfileBirthday(next);
      setSaved(stored);
      setDay(stored?.day ?? 0);
      setMonth(stored?.month ?? 0);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  return {
    saved,
    day,
    month,
    setDay,
    setMonth: pickMonth,
    status,
    dirty: !same(draft, saved),
    save: () => persist(draft),
    clear: () => persist(null),
  };
}
