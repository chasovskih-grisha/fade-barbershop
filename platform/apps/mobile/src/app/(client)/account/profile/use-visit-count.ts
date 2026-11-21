import { useEffect, useState } from 'react';
import { getAppointments } from '@/lib/api/appointments';
import { countPastVisits } from './visit-count';

/**
 * Лічильник минулих візитів (T-4734c): джерело — той самий список, що вантажить
 * екран візитів, без окремого запиту. `null` — запит упав, рядок ховаємо.
 */
export function useVisitCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getAppointments()
      .then((list) => {
        if (alive) setCount(countPastVisits(list));
      })
      .catch(() => {
        if (alive) setCount(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return count;
}
