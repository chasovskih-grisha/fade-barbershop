'use client';

import { useCallback, useEffect, useState } from 'react';

type AdminLocation = { id: string; name: string; active: boolean };
type AdminBarber = { id: string; name: string | null; phone: string; active: boolean };
export type LocationOption = { id: string; name: string };
export type BarberOption = { id: string; name: string };
export type RefsState = 'loading' | 'error' | 'ready';

export function useVisitRefs() {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [refsState, setRefsState] = useState<RefsState>('loading');
  const [refsError, setRefsError] = useState('');

  const loadRefs = useCallback(async () => {
    setRefsState('loading');
    setRefsError('');
    try {
      const [locationsRes, barbersRes] = await Promise.all([
        fetch('/admin/locations', { credentials: 'include' }),
        fetch('/admin/barbers', { credentials: 'include' }),
      ]);
      if (!locationsRes.ok || !barbersRes.ok) throw new Error('довідники недоступні');
      const locationRows = (await locationsRes.json()) as AdminLocation[];
      const barberRows = (await barbersRes.json()) as AdminBarber[];
      setLocations(locationRows.filter((l) => l.active).map((l) => ({ id: l.id, name: l.name })));
      setBarbers(
        barberRows.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name ?? b.phone }))
      );
      setRefsState('ready');
    } catch {
      setLocations([]);
      setBarbers([]);
      setRefsState('error');
      setRefsError('Не вдалося завантажити довідники');
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  return { locations, barbers, refsState, refsError, loadRefs };
}
