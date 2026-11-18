'use client';
// Hook каналу підтвердження запису (T-LOC-гейт): спільний callSettings
// (401 → login, ок → Settings, збій → null) + стани load/save.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Channel } from './channels';

// prettier-ignore
interface Settings { channel: Channel; }

export function useConfirmationSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Спільний виклик ендпоінта налаштувань: 401 → login, ок → Settings. */
  const callSettings = useCallback(
    async (init?: RequestInit): Promise<Settings | null> => {
      try {
        const res = await fetch('/admin/settings/booking-confirmation', {
          credentials: 'include',
          ...init,
        });
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error(`API ${res.status}`);
        return (await res.json()) as Settings;
      } catch {
        return null;
      }
    },
    [router]
  );

  useEffect(() => {
    const load = async () => {
      const next = await callSettings({ cache: 'no-store' });
      if (next) setSettings(next);
      setLoadError(next === null);
    };
    void load();
  }, [callSettings]);

  const save = async (channel: Channel): Promise<string | null> => {
    setSaving(true);
    const next = await callSettings({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    });
    setSaving(false);
    if (!next) return 'Не вдалося зберегти. Спробуйте ще раз.';
    setSettings(next);
    return null;
  };

  return { settings, loadError, saving, save };
}
