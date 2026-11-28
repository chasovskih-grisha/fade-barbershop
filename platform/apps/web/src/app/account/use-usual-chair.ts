'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  EMPTY_CHOICE,
  isUnavailable,
  sameChoice,
  type ChairOptions,
  type UsualChairChoice,
} from './usual-chair';

const NO_OPTIONS: ChairOptions = { locations: [], barbers: [] };

/**
 * Стан картки звичного місця (T-4725b): завантаження пари й довідників,
 * вибір локації з перезавантаженням барберів і збереження. Порожній вибір
 * лишається порожнім: перша локація не підставляється сама.
 */
export function useUsualChair(token: string | null) {
  const [saved, setSaved] = useState<UsualChairChoice>(EMPTY_CHOICE);
  const [draft, setDraft] = useState<UsualChairChoice>(EMPTY_CHOICE);
  const [options, setOptions] = useState<ChairOptions>(NO_OPTIONS);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    (async () => {
      try {
        const res = await fetch('/api/account/usual-chair', { headers });
        if (!res.ok) throw new Error('Failed to load');
        const data = (await res.json()) as { choice?: UsualChairChoice; options?: ChairOptions };
        if (!alive) return;
        const choice = data.choice ?? EMPTY_CHOICE;
        setSaved(choice);
        setDraft(choice);
        setOptions({ locations: data.options?.locations ?? [], barbers: data.options?.barbers ?? [] });
        setStatus('idle');
      } catch {
        if (alive) setStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Барбери — лише обраної локації; чисте поле лишає список порожнім.
  const pickLocation = useCallback(
    async (locationId: string | null) => {
      setDraft({ locationId, barberId: null });
      try {
        const query = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
        const res = await fetch(`/api/account/usual-chair${query}`, { headers: authHeaders });
        if (!res.ok) return;
        const data = (await res.json()) as { options?: ChairOptions };
        setOptions((current) => ({ locations: current.locations, barbers: data.options?.barbers ?? [] }));
      } catch {
        setOptions((current) => ({ ...current, barbers: [] }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- заголовок залежить лише від token
    [token]
  );

  const persist = useCallback(async () => {
    setStatus('saving');
    try {
      const res = await fetch('/api/account/usual-chair', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...authHeaders },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(draft);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- заголовок залежить лише від token
  }, [draft, token]);

  return {
    draft,
    setDraft,
    options,
    status,
    pickLocation,
    persist,
    dirty: !sameChoice(draft, saved),
    locationGone: isUnavailable(options.locations, saved.locationId),
    barberGone: isUnavailable(options.barbers, saved.barberId),
    clear: () => {
      setDraft(EMPTY_CHOICE);
      setOptions((current) => ({ ...current, barbers: [] }));
    },
  };
}
