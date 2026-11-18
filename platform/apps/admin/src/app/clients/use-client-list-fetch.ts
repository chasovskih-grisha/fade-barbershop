'use client';

import { useEffect, useState } from 'react';
import type { ClientListResult } from './client-list-types';

export function useClientListFetch(query: string, attempt: number) {
  const [data, setData] = useState<ClientListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/admin/clients?${query}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as ClientListResult;
      })
      .then((json) => {
        if (alive) {
          setData(json);
          setError(null);
        }
      })
      .catch(() => {
        if (alive) setError('Не вдалося завантажити клієнтів');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, attempt]);

  return { data, loading, error };
}
