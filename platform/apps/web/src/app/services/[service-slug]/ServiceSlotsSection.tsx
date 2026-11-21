import Link from 'next/link';
import { SlotsGrid } from './slots-grid';
import { FIXED_DATE, type BookingHref, type Slots } from './service-overview.types';

interface ServiceSlotsSectionProps {
  slotsResult: Slots;
  bookingHref: BookingHref;
  name: string;
  duration: number;
}

export function ServiceSlotsSection({
  slotsResult,
  bookingHref,
  name,
  duration,
}: ServiceSlotsSectionProps) {
  return (
    <section className="rounded-card bg-surface-raised p-8 border border-line">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold text-fg">Вільні вікна запису</h3>
          <p className="text-sm text-fg-secondary">
            Оберіть зручний час на дату:{' '}
            <span className="text-accent font-medium">{FIXED_DATE}</span>
          </p>
        </div>
        <span className="text-xs bg-semantic-success/10 text-semantic-success px-3 py-1 rounded-full font-medium">
          Оновлено щойно
        </span>
      </div>
      <div className="space-y-6">
        <SlotsGrid slotsResult={slotsResult} bookingHref={bookingHref} />
        <div className="flex justify-center pt-2">
          <Link
            href={bookingHref()}
            className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-10 font-text text-bodyLg font-bold text-accent-fg transition-all duration-200 hover:scale-105 hover:bg-fg-secondary shadow-lg shadow-accent/20"
          >
            Записатися на {name} ({duration} хв.) &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
