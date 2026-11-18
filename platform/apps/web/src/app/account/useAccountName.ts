'use client';

import { useCallback, useState } from 'react';
import type { User } from '@/lib/api/identity';

/** Ukrainian sentence the client reads when the name is empty (T-4719). */
export const NAME_REQUIRED = 'Вкажіть ім’я';

export interface AccountName {
  name: string;
  setName: (value: string) => void;
  error: string | null;
  saving: boolean;
  saved: boolean;
  save: () => Promise<void>;
}

/**
 * Name field of the account card (T-4719b). Trims on save, refuses an empty
 * value with a Ukrainian sentence, and refreshes the session so the cabinet
 * heading shows the stored name.
 */
export function useAccountName(
  user: User | null,
  token: string | null,
  refreshUser: () => Promise<void>
): AccountName {
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    const trimmed = name.trim();
    if (!token || trimmed === (user?.name ?? '')) return;
    if (!trimmed) {
      setError(NAME_REQUIRED);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/account/name', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.status === 400) {
        setError(NAME_REQUIRED);
        return;
      }
      if (!res.ok) throw new Error('Failed to save');
      setName(trimmed);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [name, token, user?.name, refreshUser]);

  return { name, setName, error, saving, saved, save };
}
