'use client';

// Стан списку клієнтів у URL (T-4606a): фільтри/сортування/сторінка — query
// params, локального дубля стану немає; кожна зміна — router.push, тож «Назад»
// відновлює попередні фільтри. Пошук — debounce 300мс; дані — GET
// /admin/clients {items,total,page,pages}; локації — довідник для фільтра.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_PERIOD,
  applyParams,
  clientListQuery,
  readClientListState,
} from './client-list-query';
import { useLocationOptions } from './useLocationOptions';
import { useClientListFetch } from './use-client-list-fetch';

const DEBOUNCE_MS = 300;

export function useClientsList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = readClientListState(params);
  const query = useMemo(() => clientListQuery(params), [params]);

  const [input, setInput] = useState(state.search);
  const [attempt, setAttempt] = useState(0);
  const { data, loading, error } = useClientListFetch(query, attempt);
  // Довідник локацій для фільтра й назв у підсумках (окремий хук).
  const locations = useLocationOptions();

  /** Патч параметрів: порожні значення видаляються з URL (applyParams). */
  const patch = useCallback(
    (changes: Record<string, string>) => {
      const qs = applyParams(query, changes);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [query, pathname, router]
  );

  /** Клік по заголовку: інша колонка — asc, та сама — перемикач asc/desc. */
  const onSort = useCallback(
    (key: string) => {
      const dir = state.sort.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc';
      patch({ sort: key === 'name' ? '' : key, order: dir === 'asc' ? '' : dir, page: '' });
    },
    [state.sort, patch]
  );

  const setPage = useCallback(
    (page: number) => patch({ page: page <= 1 ? '' : String(page) }),
    [patch]
  );

  /** Період змінює лише вікно підсумків: сторінка скидається, щоб не плутати. */
  const setPeriod = useCallback(
    (value: string) => patch({ period: value === DEFAULT_PERIOD ? '' : value, page: '' }),
    [patch]
  );

  const reset = useCallback(() => {
    setInput('');
    patch({ search: '', locationId: '', loyaltyStatus: '', page: '' });
  }, [patch]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Debounce: URL оновлюється через 300мс після останньої клавіші, не на букву.
  useEffect(() => {
    if (input.trim() === state.search) return;
    const timer = setTimeout(() => patch({ search: input.trim(), page: '' }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, state.search, patch]);

  return {
    input,
    setInput,
    data,
    summary: data?.summary ?? null,
    loading,
    error,
    retry,
    locations,
    locationId: state.locationId,
    loyaltyStatus: state.loyaltyStatus,
    period: state.period,
    setPeriod,
    sort: state.sort,
    hasFilters: Boolean(state.search || state.locationId || state.loyaltyStatus),
    onSort,
    setPage,
    patch,
    reset,
  };
}
