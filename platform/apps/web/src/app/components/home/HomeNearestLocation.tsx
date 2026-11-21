import Link from 'next/link';
import { Card } from '@fade/ui';
import type { Location } from '@/lib/api/locations';

/** «Студія поруч» block shown when a location is available. */
export function HomeNearestLocation({ location }: { location: Location }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="font-display text-h3 font-semibold text-fg">Студія поруч</h2>
          <p className="text-body text-fg-secondary">Зручна локація для мешканців ЖК та району.</p>
        </div>
        <Link href="/locations" className="text-body font-medium text-fg-secondary hover:text-fg">
          Усі адреси &rarr;
        </Link>
      </div>

      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-6">
        <div className="flex flex-col gap-1">
          <span className="text-caption font-semibold uppercase text-fg-muted">
            Флагманська студія
          </span>
          <h3 className="text-h4 font-display font-semibold text-fg">{location.name}</h3>
          <p className="text-body text-fg-secondary">{location.address}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/locations/${location.code}`}
            className="inline-flex h-11 items-center justify-center rounded-input border border-line px-4 text-body font-medium text-fg hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Деталі та графік
          </Link>
          <Link
            href="/booking"
            className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-5 text-body font-medium text-accent-fg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          >
            Записатися сюди
          </Link>
        </div>
      </Card>
    </section>
  );
}
