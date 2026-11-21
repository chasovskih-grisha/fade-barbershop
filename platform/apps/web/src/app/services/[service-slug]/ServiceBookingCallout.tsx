import Link from 'next/link';
import { FIXED_DATE, type BookingHref } from './service-overview.types';

interface ServiceBookingCalloutProps {
  name: string;
  bookingHref: BookingHref;
}

export function ServiceBookingCallout({ name, bookingHref }: ServiceBookingCalloutProps) {
  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-r from-surface-raised via-surface to-surface-raised border border-accent/40 p-8 shadow-xl">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
            🔥 Високий попит на {FIXED_DATE}
          </span>
          <h3 className="font-display text-2xl font-bold text-fg">
            Забронюйте свій візит за лічені секунди
          </h3>
          <p className="text-sm text-fg-secondary">
            Оберіть зручний час нижче або натисніть швидкий запис зі збереженням місця.
          </p>
        </div>
        <Link
          href={bookingHref()}
          className="inline-flex h-14 items-center justify-center rounded-input bg-accent px-8 font-text text-bodyLg font-bold text-accent-fg shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-105 hover:bg-fg-secondary flex-shrink-0"
        >
          Швидкий запис на {name} &rarr;
        </Link>
      </div>
    </section>
  );
}
