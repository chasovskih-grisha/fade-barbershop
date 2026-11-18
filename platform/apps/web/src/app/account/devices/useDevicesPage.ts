'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ClientSession } from '@fade/contracts';
import { useAuth } from '../../components/auth/AuthProvider';
import { getClientSessions, revokeAllSessions } from '@/lib/api/client-sessions';

const LOAD_FAILED = 'Не вдалося завантажити пристрої. Спробуйте пізніше.';
const REVOKE_FAILED = 'Не вдалося вийти з інших пристроїв. Спробуйте ще раз.';

// Стан екрана «Пристрої»: список активних сесій + «вийти скрізь» із
// підтвердженням (дія незворотна — інші пристрої одразу втрачають сесію).
export function useDevicesPage() {
  const { isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSessions(await getClientSessions());
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const confirmRevokeAll = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await revokeAllSessions();
      setConfirmOpen(false);
      await load();
    } catch {
      setActionError(REVOKE_FAILED);
    } finally {
      setBusy(false);
    }
  }, [load]);

  return {
    sessions,
    loading,
    error,
    actionError,
    busy,
    confirmOpen,
    others: sessions.filter((s) => !s.current).length,
    openConfirm: () => setConfirmOpen(true),
    closeConfirm: () => {
      if (!busy) setConfirmOpen(false);
    },
    confirmRevokeAll,
    retry: load,
  };
}
