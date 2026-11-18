'use client';

// Довідник локацій для фільтра списку клієнтів і назв у стрічці підсумків.
// Помилка довідника не ламає список: без назв показуємо id локації.
import { useEffect, useState } from 'react';

export interface LocationOption {
  id: string;
  name: string;
}

export function useLocationOptions(): LocationOption[] {
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    fetch('/admin/locations', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => {
        if (Array.isArray(rows))
          setLocations((rows as LocationOption[]).map((row) => ({ ...row })));
      })
      .catch(() => setLocations([]));
  }, []);

  return locations;
}
