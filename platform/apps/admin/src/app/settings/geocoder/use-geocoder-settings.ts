'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SETTINGS_URL = '/admin/settings/geocoder';

export interface GeocoderSettings {
  provider: 'nominatim' | 'google';
  rateLimit: { max: number; windowMs: number };
  cacheTtlMs: number;
  googleConfigured: boolean;
}

/** Cookie-запит із 401→/login; ok=false кидає `API <status>`. */
export async function apiPut(router: { push: (url: string) => void }, body: object) {
  const res = await fetch(SETTINGS_URL, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    router.push('/login');
    return null;
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as GeocoderSettings;
}

/** GET-версія apiPut: той самий контракт 401/помилок. */
export async function apiGet(router: { push: (url: string) => void }) {
  const res = await fetch(SETTINGS_URL, { credentials: 'include', cache: 'no-store' });
  if (res.status === 401) {
    router.push('/login');
    return null;
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as GeocoderSettings;
}

/** Стан налаштувань геокодування: load/save + прапорці saving/notice/error. */
export function useGeocoderSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<GeocoderSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet(router);
      if (data) setSettings(data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Partial<GeocoderSettings>) => {
    if (!settings) return;
    setSaving(true);
    setNotice(null);
    try {
      const data = await apiPut(router, patch);
      if (data) setSettings(data);
      setNotice('Збережено — застосовується негайно, без деплою.');
    } catch {
      setNotice('Не вдалося зберегти. Спробуйте ще раз.');
    } finally {
      setSaving(false);
    }
  };

  return { settings, loadError, saving, notice, load, save };
}
