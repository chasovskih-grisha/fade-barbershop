'use client';

// Стан матриці «послуги барбера» (T-4521b): завантаження каталогу та рядків
// локації, перемикання послуг і категорій. Винесено з редактора за LOC-гейтом.
import { useEffect, useState } from 'react';
import {
  applyCategories,
  assignedServiceIds,
  categoriesOf,
  locationServices,
  toggleService,
  type MatrixService,
} from './barber-matrix-data';
import type { MatrixMode } from './MatrixModePicker';

export function useBarberMatrix(barberId: string) {
  const [locationId, setLocationId] = useState('');
  const [services, setServices] = useState<MatrixService[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<MatrixMode>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!locationId) {
      setLoaded(false);
      return;
    }
    setLoaded(false);
    setError('');
    Promise.all([locationServices(locationId), assignedServiceIds(barberId, locationId)])
      .then(([catalog, rows]) => {
        setServices(catalog);
        setAssigned(rows);
        setCategories(
          categoriesOf(catalog)
            .filter((group) => rows.size === 0 || group.serviceIds.some((id) => rows.has(id)))
            .map((group) => group.name)
        );
        setMode(rows.size > 0 ? 'selected' : 'all');
        setLoaded(true);
      })
      .catch(() => setError('Не вдалося завантажити матрицю послуг'));
  }, [locationId, barberId]);

  const isChecked = (serviceId: string) => (assigned.size > 0 ? assigned.has(serviceId) : true); // fallback «усі»

  const onToggle = (serviceId: string, makeIt: boolean) => {
    if (busy || !locationId) return;
    setBusy(true);
    setError('');
    toggleService({ barberId, locationId, serviceId, services, assigned, makeIt })
      .then((next) => setAssigned(next))
      .catch(() => setError('Не вдалося оновити матрицю'))
      .finally(() => setBusy(false));
  };

  const onPickMode = (next: MatrixMode) => {
    setMode(next);
    if (next !== 'category' || !services.length) return;
    applyCategories({ barberId, locationId, services, assigned, categories })
      .then((result) => setAssigned(result))
      .catch(() => setError('Не вдалося застосувати категорії'));
  };

  const onToggleCategory = (name: string, makeIt: boolean) => {
    if (busy || !locationId) return;
    const next = makeIt ? [...categories, name] : categories.filter((item) => item !== name);
    setCategories(next);
    setBusy(true);
    setError('');
    applyCategories({ barberId, locationId, services, assigned, categories: next })
      .then((result) => setAssigned(result))
      .catch(() => setError('Не вдалося застосувати категорії'))
      .finally(() => setBusy(false));
  };

  return {
    locationId,
    setLocationId,
    services,
    assigned,
    loaded,
    busy,
    error,
    mode,
    categories,
    isChecked,
    onToggle,
    onPickMode,
    onToggleCategory,
  };
}
