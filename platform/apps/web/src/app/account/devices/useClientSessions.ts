'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ClientSession } from '@fade/contracts';
import { useAuth } from '../../components/auth/AuthProvider';
import { getClientSessions } from '@/lib/api/client-sessions';

export const SESSIONS_LOAD_FAILED = 'Не вдалося завантажити пристрої. Спробуйте пізніше.';

/** Одне джерело списку сесій: екран «Пристрої» (T-4422) і рядок профілю (T-4724). */
export function useClientSessions() {
  const { isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSessions((await getClientSessions()) ?? []);
    } catch {
      setError(SESSIONS_LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  return { sessions, loading, error, reload: load };
}
