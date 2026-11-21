'use client';

import PageHeader from '../components/PageHeader';
import { Skeleton } from '@fade/ui';

export function AnalyticsLoadingState() {
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Аналітика мережі" subtitle="Зведені звіти та операційні показники" />
      <div className="grid gap-4 sm:grid-cols-4">
        <Skeleton variant="rect" className="h-28" />
        <Skeleton variant="rect" className="h-28" />
        <Skeleton variant="rect" className="h-28" />
        <Skeleton variant="rect" className="h-28" />
      </div>
      <Skeleton variant="rect" className="h-96" />
    </main>
  );
}

export function AnalyticsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex flex-col gap-6">
      <PageHeader title="Аналітика мережі" subtitle="Зведені звіти та операційні показники" />
      <div
        role="alert"
        className="p-4 rounded-card border border-semantic-danger text-semantic-danger"
      >
        Не вдалося завантажити дані аналітики.{' '}
        <button type="button" onClick={onRetry} className="underline font-bold">
          Спробувати знову
        </button>
      </div>
    </main>
  );
}
