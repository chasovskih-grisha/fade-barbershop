import { useCallback, useEffect, useState } from 'react';
import { fetchWaitlistEntries, leaveWaitlist } from './waitlist-api';
import type { WaitlistEntry } from './waitlist-model';

export function useWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetchWaitlistEntries()
      .then((list) => {
        if (mounted) setEntries(list);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const leave = useCallback(async (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    await leaveWaitlist(id);
  }, []);

  return { entries, loading, reload, leave };
}
