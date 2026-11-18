import { EmptyState } from '@fade/ui';
import type { Metadata } from 'next';
import { getLocations } from '@/lib/api/locations';
import { pageMetadata } from '@/lib/metadata';
import { ActionLink } from '@/app/components/ActionLink';
import { ErrorState } from '@/app/components/states/ErrorState';
import { LocationBreadcrumb } from './LocationBreadcrumb';
import { LocationCard } from './LocationCard';
import { LocationNetworkStandard } from './LocationNetworkStandard';
import { BOOKING_OPENS_SOON_TEXT } from '@/lib/booking-availability';

export const metadata: Metadata = pageMetadata({
  title: 'Наші студії та локації — Fade Atelier',
  description:
    'Приватні студії Fade у Києві: адреси, години роботи, вільні крісла на онлайн-запис.',
  path: '/locations',
});

export default async function LocationsPage() {
  const result = await getLocations();

  return (
    <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:py-24">
      <header className="flex flex-col gap-6 border-b border-line pb-12 rounded-card p-8 md:p-14 bg-gradient-to-b from-surface-raised/50 to-transparent">
        <LocationBreadcrumb />
        <div className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-2 text-caption font-semibold uppercase text-fg-muted w-fit bg-surface">
          Приватні студії мережі FADE
        </div>
        <h1 className="font-display text-display font-bold text-fg leading-none">Наші локації</h1>
        <p className="max-w-3xl text-bodyLg text-fg-secondary">
          Камерні студії на два крісла у центрі Києва. Жодних черг і галасу — лише ідеальна
          геометрія стрижки та розкіш тиші.
        </p>

        {/* Переваги мережі локацій */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6 border-t border-line">
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5 shadow-sm">
            <span className="text-h4 font-display font-bold text-fg">09:00 — 21:00</span>
            <span className="text-caption text-fg-secondary font-medium">
              Щоденний графік без вихідних та пауз
            </span>
          </div>
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5 shadow-sm">
            <span className="text-h4 font-display font-bold text-fg">Два крісла</span>
            <span className="text-caption text-fg-secondary font-medium">
              Максимальна приватність без сторонніх очей
            </span>
          </div>
          <div className="p-5 rounded-card bg-surface-sunken border border-line flex flex-col gap-1.5 shadow-sm">
            <span className="text-h4 font-display font-bold text-fg">Wi-Fi & Bar</span>
            <span className="text-caption text-fg-secondary font-medium">
              Крафтові напої, музика та преміум-сервіс
            </span>
          </div>
        </div>
      </header>

      {result.state === 'error' && <ErrorState message={result.message} />}

      {result.state === 'empty' && (
        <EmptyState
          title="Локацій ще немає"
          description={BOOKING_OPENS_SOON_TEXT}
          action={
            <ActionLink href="/" variant="secondary" className="mt-2">
              На головну
            </ActionLink>
          }
        />
      )}

      {result.state === 'ok' && (
        <div className="flex flex-col gap-10">
          <div
            className="grid grid-cols-1 gap-8 md:grid-cols-2"
            role="feed"
            aria-label="Список локацій"
          >
            {result.data.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>

          <LocationNetworkStandard />
        </div>
      )}
    </div>
  );
}
