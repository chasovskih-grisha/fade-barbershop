'use client';

// Стан налаштувань нагадування про візит (патерн use-confirmation-settings):
// GET при монтуванні, PUT на зміну, 401 → /login. Канал і час у допуску
// чинні негайно — без деплою (MNG-ADM-18).
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReminderChannel } from './channels';

const SETTINGS_URL = '/admin/settings/appointment-reminder';

export interface ReminderSettings {
  channel: ReminderChannel;
  leadMinutes: number;
}

export function useReminderSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Спільний виклик ендпоінта: 401 → login, ок → Settings, збій → null. */
  const call = useCallback(
    async (init?: RequestInit): Promise<ReminderSettings | null> => {
      try {
        const res = await fetch(SETTINGS_URL, { credentials: 'include', ...init });
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        if (!res.ok) throw new Error(`API ${res.status}`);
        return (await res.json()) as ReminderSettings;
      } catch {
        return null;
      }
    },
    [router]
  );

  useEffect(() => {
    void (async () => {
      const next = await call({ cache: 'no-store' });
      if (next) setSettings(next);
      setLoadError(next === null);
    })();
  }, [call]);

  /** Патч (channel і/або leadMinutes); повертає текст помилки або null. */
  const save = async (patch: Partial<ReminderSettings>): Promise<string | null> => {
    setSaving(true);
    const next = await call({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!next) return 'Не вдалося зберегти. Спробуйте ще раз.';
    setSettings(next);
    return null;
  };

  return { settings, loadError, saving, save };
}
