'use client';

import { useCallback, useState } from 'react';
import { revokeAllSessions } from '@/lib/api/client-sessions';
import { useClientSessions } from './useClientSessions';

const REVOKE_FAILED = 'Не вдалося вийти з інших пристроїв. Спробуйте ще раз.';

// Стан екрана «Пристрої»: список активних сесій + «вийти скрізь» із
// підтвердженням (дія незворотна — інші пристрої одразу втрачають сесію).
export function useDevicesPage() {
  const { sessions, loading, error, reload } = useClientSessions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmRevokeAll = useCallback(async () => {
    setBusy(true);
    setActionError(null);
    try {
      await revokeAllSessions();
      setConfirmOpen(false);
      await reload();
    } catch {
      setActionError(REVOKE_FAILED);
    } finally {
      setBusy(false);
    }
  }, [reload]);

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
    retry: reload,
  };
}
