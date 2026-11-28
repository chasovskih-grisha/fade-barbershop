import Link from 'next/link';
import { ActionLink } from '@/app/components/ActionLink';
import { ShareBarberButton } from '@/app/components/ShareBarberButton';
import { BarberPortrait } from '../BarberPortrait';
import { BarberProfileFacts } from './BarberProfileFacts';
import { BarberServices } from './BarberServices';
import { BarberGalleryPlaceholder, BarberReviewsPlaceholder } from './BarberSections';
import { BarberStructuredData } from './BarberStructuredData';
import { BarberBreadcrumb } from '../BarberBreadcrumb';
import type { Service } from '@/lib/api/catalog';
import type { LoadableList } from '@/lib/api/loadable';
import type { Barber } from '@/lib/api/staff';

// T-4860: профіль майстра — одна колонка тієї ж ширини, що й список
// (`max-w-container`), у порядку: портрет, імʼя, студії, послуги, портфоліо,
// відгуки, дії. Студії прийдуть із T-4861, послуги — з каталогу локації;
// порядок тримає кожен регіон у потоці, а не сітка з двома колонками.
// Нижче широкого брейкпойнта кнопка запису лишається на екрані (sticky-бар),
// тож останній регіон має відступ, щоб не ховатися під нею.
export function BarberDetailContent({
  barber,
  services,
}: {
  barber: Barber;
  services: LoadableList<Service>;
}) {
  const bookHref = `/booking?barber=${barber.id}`;

  return (
    <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-4 py-10 pb-28 md:pb-10">
      <BarberStructuredData barber={barber} />

      <BarberBreadcrumb current={barber.name} />

      <div data-region="portrait" className="w-full max-w-md">
        <BarberPortrait
          name={barber.name}
          photoUrl={barber.photoUrl}
          sizes="(max-width: 768px) 100vw, 420px"
          className="w-full rounded-card"
        />
      </div>

      <div data-region="name" className="flex flex-col gap-6">
        <div>
          <span className="text-xs uppercase text-accent font-semibold">{barber.role}</span>
          <h1 className="font-display text-h2 mt-1">{barber.name}</h1>
          {barber.bio && <p className="text-bodyLg text-fg-secondary mt-2">{barber.bio}</p>}
        </div>
        <BarberProfileFacts barber={barber} />
      </div>

      {barber.studios && barber.studios.length > 0 && (
        <section data-region="studios" aria-labelledby="barber-studios" className="flex flex-col gap-3">
          <h2 id="barber-studios" className="font-display text-h3">
            Студії, де працює {barber.name}
          </h2>
          <ul className="flex flex-wrap gap-3">
            {barber.studios.map((studio) => (
              <li key={studio.code}>
                <Link
                  href={`/locations/${studio.code}`}
                  className="inline-flex items-center rounded-pill border border-line px-4 py-2 text-body text-fg transition-colors hover:bg-interactive"
                >
                  {studio.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div data-region="services">
        <BarberServices services={services} />
      </div>

      <div data-region="portfolio">
        <BarberGalleryPlaceholder name={barber.name} />
      </div>

      <div data-region="reviews">
        <BarberReviewsPlaceholder />
      </div>

      <div data-region="actions" className="hidden flex-col gap-4 pt-2 md:flex md:flex-row">
        <ActionLink href={bookHref} className="w-full md:w-auto">
          Записатися до майстра
        </ActionLink>
        <ShareBarberButton barber={barber} />
        <Link
          href="/services"
          className="inline-flex h-12 w-full items-center justify-center rounded-input border border-line px-6 font-text text-body font-medium text-fg transition-colors hover:bg-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue md:w-auto"
        >
          Переглянути послуги та ціни
        </Link>
      </div>

      <div
        data-region="book-mobile"
        className="fixed inset-x-0 bottom-0 border-t border-line bg-surface px-4 py-3 md:hidden"
      >
        <ActionLink href={bookHref} className="w-full">
          Записатися до майстра
        </ActionLink>
      </div>
    </div>
  );
}
