'use client';

// Стан правил surge (T-4811): GET списку при монтуванні, PUT на збереження,
// 401 → /login. Правила читаються разом із локаціями, бо locationId у формі
// — це вибір із довідника, а не вільний текст.
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SurgeRulePayload, SurgeRuleRow } from './surge-rule-draft';

const RULES_URL = '/admin/pricing/surge-rules';

export interface LocationOption {
  id: string;
  name: string;
}

export function useSurgeRules() {
  const router = useRouter();
  const [rules, setRules] = useState<SurgeRuleRow[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  const call = useCallback(
    async <T>(url: string, init?: RequestInit): Promise<T | null> => {
      try {
        const res = await fetch(url, { credentials: 'include', ...init });
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

  const reload = useCallback(async (): Promise<void> => {
    const next = await call<SurgeRuleRow[]>(RULES_URL, { cache: 'no-store' });
    if (next) setRules(next);
  }, [call]);

  useEffect(() => {
    void (async () => {
      const [rows, places] = await Promise.all([
        call<SurgeRuleRow[]>(RULES_URL, { cache: 'no-store' }),
        call<LocationOption[]>('/admin/locations', { cache: 'no-store' }),
      ]);
      if (rows) setRules(rows);
      if (places) setLocations(places);
      setLoadError(rows === null);
    })();
  }, [call]);

  /** PUT правила; повертає текст помилки або null. */
  const save = async (payload: SurgeRulePayload, id?: string): Promise<string | null> => {
    setSaving(true);
    const body = id ? { ...payload, id } : payload;
    const next = await call<SurgeRuleRow>(RULES_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!next) return 'Не вдалося зберегти. Перевірте межі й спробуйте ще раз.';
    await reload();
    return null;
  };

  return { rules, locations, loadError, saving, save };
}
