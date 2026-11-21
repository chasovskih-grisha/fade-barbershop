'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RecommendedServicesSettings } from './recommended-services-fields';

const SETTINGS_URL = '/admin/settings/recommended-services';

export function useRecommendedServicesSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<RecommendedServicesSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    void (async () => {
      const next = await call<RecommendedServicesSettings>('', { cache: 'no-store' });
      if (next) setSettings(next);
      setLoadError(next === null);
    })();
  }, [call]);

  const save = async (policy: RecommendedServicesSettings): Promise<string | null> => {
    setSaving(true);
    const next = await call<RecommendedServicesSettings>('', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    setSaving(false);
    if (!next) return 'Не вдалося зберегти. Спробуйте ще раз.';
    setSettings(next);
    return null;
  };

  return { settings, loadError, saving, save };
}
