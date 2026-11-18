'use client';

// Стан політики депозиту (патерн use-confirmation-settings): GET при
// монтуванні, PUT на зміну, 401 → /login. Значення чинне для нових записів
// одразу — снепшот на візиті не переписується. T-4444: GET віддає версію,
// а /history — затверджені набори правил.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DepositPolicy } from './deposit-policy-fields';

const SETTINGS_URL = '/admin/settings/deposit-policy';

export interface DerivedPolicy extends DepositPolicy {
  version: number;
}

export interface PolicyVersionRow extends DerivedPolicy {
  createdAt: string;
  createdBy: string | null;
}

export function useDepositPolicy() {
  const router = useRouter();
  const [settings, setSettings] = useState<DerivedPolicy | null>(null);
  const [history, setHistory] = useState<PolicyVersionRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Спільний виклик ендпоінта: 401 → login, ок → T, збій → null. */
  const call = useCallback(
    async <T>(path = '', init?: RequestInit): Promise<T | null> => {
      try {
        const res = await fetch(`${SETTINGS_URL}${path}`, { credentials: 'include', ...init });
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error(`API ${res.status}`);
        return (await res.json()) as T;
      } catch {
        return null;
      }
    },
    [router]
  );

  const loadHistory = useCallback(async () => {
    const rows = await call<PolicyVersionRow[]>('/history');
    if (rows) setHistory(rows);
  }, [call]);

  useEffect(() => {
    void (async () => {
      const next = await call<DerivedPolicy>('', { cache: 'no-store' });
      if (next) setSettings(next);
      setLoadError(next === null);
      if (next) await loadHistory();
    })();
  }, [call, loadHistory]);

  /** Надсилає всю політику; повертає текст помилки або null. */
  const save = async (policy: DepositPolicy): Promise<string | null> => {
    setSaving(true);
    const next = await call<DerivedPolicy>('', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    setSaving(false);
    if (!next) return 'Не вдалося зберегти. Спробуйте ще раз.';
    setSettings(next);
    await loadHistory();
    return null;
  };

  return { settings, history, loadError, saving, save };
}
