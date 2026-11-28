'use client';

import type { ReactNode } from 'react';
import { AlertBanner, EmptyState, Skeleton } from '@fade/ui';

// T-4516: «сторінка = shell + контент + стани». Один регіон відповідає за те,
// що бачить людина, поки список вантажиться, упав або порожній: скелетон —
// ніколи спінер, помилка — банер із повтором, порожнеча — CTA. Екрани не
// переписують ці стани по-своєму.

export interface ListState {
  loading: boolean;
  error: string | null;
  retrying?: boolean;
  empty: boolean;
  onRetry: () => void;
}

export interface ListStateRegionProps {
  state: ListState;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeleton: ReactNode;
  children: ReactNode;
}

export function ListStateRegion({
  state,
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeleton,
  children,
}: ListStateRegionProps) {
  if (state.loading) return <>{skeleton}</>;

  return (
    <>
      {state.error ? (
        <AlertBanner
          tone="error"
          title={state.error}
          action={{
            label: 'Спробувати ще раз',
            onClick: state.onRetry,
            loading: state.retrying ?? false,
          }}
        />
      ) : state.empty ? (
        <EmptyState
          title={emptyTitle}
          {...(emptyDescription ? { description: emptyDescription } : {})}
          {...(emptyAction ? { action: emptyAction } : {})}
        />
      ) : (
        children
      )}
    </>
  );
}

/** Скелетон рядкового списку: та сама висота й кількість, що в таблиці. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="list-skeleton" aria-hidden="true">
      <Skeleton variant="rect" className="h-10" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} variant="rect" className="h-14" />
      ))}
    </div>
  );
}
