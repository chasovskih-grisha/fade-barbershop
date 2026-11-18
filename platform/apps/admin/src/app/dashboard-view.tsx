'use client';

// Розмітка головної адмінки: KPI + сьогоднішні візити. Без фетчу — дані
// приходять з page.tsx; KPI-картки — dashboard-kpi.tsx (LOC-гейт).
import Link from 'next/link';
import { Card, EmptyState, Skeleton } from '@fade/ui';
import PageHeader from './components/PageHeader';
import DashboardKpi from './dashboard-kpi';
import TodaysVisits from './dashboard-visits';
import AdminControlCenterWidget from './components/AdminControlCenterWidget';
import type { DashboardData } from './types';

export default function DashboardView({
  data,
  failed,
  onRetry,
}: {
  data: DashboardData | null;
  failed: boolean;
  onRetry: () => void;
}) {
  if (!data) {
    return failed ? (
      <div role="alert" className="text-semantic-danger">
        Не вдалося завантажити дані{' '}
        <button type="button" className="underline" onClick={onRetry}>
          Оновити
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton variant="rect" className="h-24" />
          <Skeleton variant="rect" className="h-24" />
          <Skeleton variant="rect" className="h-24" />
        </div>
        <Skeleton variant="rect" className="h-64" />
      </div>
    );
  }

  const { visits, barbers, locations } = data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Головна"
        subtitle="Зведення мережі за сьогодні"
        actions={
          <Link
            href="/bookings/phone"
            className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-4 font-text font-medium text-accent-fg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Новий запис
          </Link>
        }
      />

      <DashboardKpi visits={visits} />

      <AdminControlCenterWidget />

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 className="font-display text-h4">Сьогоднішні візити</h2>
          <Link href="/calendar" className="text-body underline">
            Весь календар
          </Link>
        </div>
        {visits.length === 0 ? (
          <EmptyState
            title="На сьогодні візитів немає"
            description="Створіть запис через календар або телефонний запис."
            action={
              <Link
                href="/calendar"
                className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-4 font-text font-medium text-accent-fg hover:opacity-90"
              >
                Відкрити календар
              </Link>
            }
          />
        ) : (
          <TodaysVisits visits={visits} barbers={barbers} locations={locations} />
        )}
      </Card>
    </div>
  );
}
