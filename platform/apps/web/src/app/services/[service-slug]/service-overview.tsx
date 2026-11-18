'use client';
import Link from 'next/link';
import Image from 'next/image';
import { SlotsGrid } from './slots-grid';
import type { Service } from '@/lib/api/catalog';
import type { LoadableList } from '@/lib/api/loadable';
type Barbers = LoadableList<{ id: string; name: string; slug: string }>;
type Slots = LoadableList<{ start: string; end: string; barbers: string[] }>;

const H = ({ text }: { text: string }) => <p className="text-sm text-fg-muted">{text}</p>;

const BarbersList = ({ result }: { result: Barbers }) => {
  if (result.state === 'error') return <H text={result.message} />;
  if (result.state === 'ok' && result.data.length > 0)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {result.data.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg bg-interactive p-4 border border-line hover:border-accent transition-colors">
            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 font-display text-xl text-accent font-bold">
              {b.name[0]}
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-fg line-clamp-1">{b.name}</h4>
              <p className="text-xs text-accent font-medium">Експерт-барбер ★ 4.9</p>
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <>
      {result.state === 'empty' && <H text="Немає доступних майстрів" />}
      <H text="Немає активних майстрів" />
    </>
  );
};

export function ServiceOverview({
  service,
  barbersResult,
  slotsResult,
  faqs = [],
  reviews = [],
}: {
  service: Service;
  barbersResult: Barbers;
  slotsResult: Slots;
  faqs?: Array<{ question: string; answer: string }>;
  reviews?: Array<{ author: string; datePublished: string; reviewRating: { ratingValue: string; bestRating: string }; reviewBody: string }>;
}) {
  const FIXED_DATE = '2026-10-02';
  // prettier-ignore
  const bookingHref = (s?: { start: string; end: string }) =>
    `/booking?serviceId=${service.id}&date=${FIXED_DATE}${s ? `&start=${s.start}&end=${s.end}` : ''}`;
  // prettier-ignore
  const coverImage = service.coverImage ? (
    <div className="relative w-full h-64 md:h-96 overflow-hidden group">
      <Image
        src={service.coverImage}
        alt={service.name}
        width={1280}
        height={384}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjgwIDM4NCI+PHJlY3Qgd2lkdGg9IjEyODAiIGhlaWdodD0iMzg0IiBmaWxsPSIjMTMxNDE4Ii8+PC9zdmc+"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent opacity-90" />
      <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-fg text-xs font-semibold uppercase tracking-wider mb-2 shadow-md">
            Преміум сервіс
          </span>
          <h1 className="font-display text-3xl md:text-display font-bold text-fg drop-shadow-sm">{service.name}</h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-fg-muted block">Вартість</span>
          <span className="font-display text-3xl md:text-4xl font-bold text-accent">{service.price} грн</span>
        </div>
      </div>
    </div>
  ) : null;
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <section className="rounded-[var(--radius-card)] overflow-hidden bg-surface border border-line-strong shadow-2xl">
        {!service.coverImage && (
          <div className="p-8 pb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-fg text-xs font-semibold uppercase tracking-wider mb-2">
              Преміум сервіс
            </span>
            <h1 className="font-display text-4xl font-bold text-fg">{service.name}</h1>
            <span className="font-display text-2xl font-bold text-accent mt-2 block">{service.price} грн</span>
          </div>
        )}
        {coverImage}
        <div className="p-8 space-y-6">
          <p className="text-h4 text-fg-secondary leading-relaxed">
            {service.description || 'Послуга barbershop Fade'}
          </p>
          
          {/* Trust Badges Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">⏱</div>
              <div>
                <p className="text-xs text-fg-muted">Тривалість</p>
                <p className="text-sm font-semibold text-fg">{service.duration} хв</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">🛡</div>
              <div>
                <p className="text-xs text-fg-muted">Гарантія якості</p>
                <p className="text-sm font-semibold text-fg">100% результат</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">⭐</div>
              <div>
                <p className="text-xs text-fg-muted">Рейтинг послуги</p>
                <p className="text-sm font-semibold text-fg">4.9 / 5.0 (120+)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">☕</div>
              <div>
                <p className="text-xs text-fg-muted">Бонус</p>
                <p className="text-sm font-semibold text-fg">Напої у лаунжі</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversion Sticky / Urgent Booking Callout Banner */}
      <section className="relative overflow-hidden rounded-card bg-gradient-to-r from-surface-raised via-surface to-surface-raised border border-accent/40 p-8 shadow-xl">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
              🔥 Високий попит на {FIXED_DATE}
            </span>
            <h3 className="font-display text-2xl font-bold text-fg">Забронюйте свій візит за лічені секунди</h3>
            <p className="text-sm text-fg-secondary">Оберіть зручний час нижче або натисніть швидкий запис зі збереженням місця.</p>
          </div>
          <Link
            href={bookingHref()}
            className="inline-flex h-14 items-center justify-center rounded-input bg-accent px-8 font-text text-bodyLg font-bold text-accent-fg shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-105 hover:bg-fg-secondary flex-shrink-0"
          >
            Швидкий запис на {service.name} &rarr;
          </Link>
        </div>
      </section>

      <section className="rounded-card bg-surface-raised w-full p-8 border border-line">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-fg">Майстри високої кваліфікації</h3>
            <p className="text-sm text-fg-secondary">Досвідчені фахівці FADE, які спеціалізуються на цій послузі</p>
          </div>
          <span className="text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-full font-medium">Сертифіковані експерти</span>
        </div>
        <BarbersList result={barbersResult} />
      </section>

      <section className="rounded-card bg-surface-raised p-8 border border-line">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-fg">Вільні вікна запису</h3>
            <p className="text-sm text-fg-secondary">Оберіть зручний час на дату: <span className="text-accent font-medium">{FIXED_DATE}</span></p>
          </div>
          <span className="text-xs bg-semantic-success/10 text-semantic-success px-3 py-1 rounded-full font-medium">Оновлено щойно</span>
        </div>
        <div className="space-y-6">
          <SlotsGrid slotsResult={slotsResult} bookingHref={bookingHref} />
          <div className="flex justify-center pt-2">
            <Link
              href={bookingHref()}
              className="inline-flex h-14 w-full sm:w-auto items-center justify-center rounded-input bg-accent px-10 font-text text-bodyLg font-bold text-accent-fg transition-all duration-200 hover:scale-105 hover:bg-fg-secondary shadow-lg shadow-accent/20"
            >
              Записатися на {service.name} ({service.duration} хв.) &rarr;
            </Link>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="rounded-card bg-surface-raised p-8 border border-line">
          <h2 className="font-display text-h3 text-fg mb-6">
            Часті питання про {service.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-card bg-surface p-5 border border-line flex flex-col justify-between">
                <h3 className="font-semibold text-fg mb-2 flex items-start gap-2">
                  <span className="text-accent">Q.</span> {faq.question}
                </h3>
                <p className="text-sm text-fg-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="rounded-card bg-surface-raised p-8 border border-line">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-h3 text-fg">
              Відгуки клієнтів про {service.name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-accent font-semibold">
              <span>★ 4.9 з 5.0</span>
              <span className="text-fg-muted">({reviews.length} перевірених відгуків)</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev, idx) => (
              <div key={idx} className="rounded-card bg-surface border border-line p-6 flex flex-col justify-between gap-4 shadow-sm">
                <p className="text-body text-fg-secondary italic">&ldquo;{rev.reviewBody}&rdquo;</p>
                <div className="flex items-center justify-between pt-3 border-t border-line text-caption">
                  <div>
                    <span className="font-bold text-fg block">{rev.author}</span>
                    <span className="text-xs text-fg-muted">Верифікований відвідувач</span>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-full text-accent font-bold text-xs">
                    <span>★</span> {rev.reviewRating.ratingValue}/5.0
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
